package main

import (
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

func sessionMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// authentication not required for these paths
		skippablePaths := []string{
			"/login",
			"/js",
			"/css",
			"/favicon.ico",
			"/api/login",
			"/api/echo",
			"/api/clear_sessions",
		}
		for _, path := range skippablePaths {
			if strings.HasPrefix(r.URL.Path, path) {
				h.ServeHTTP(w, r)
				return
			}
		}

		qparam := url.Values{}
		qparam.Add("ref", r.URL.Path)

		// url.JoinPath added in go 1.19
		loginPath := "/login" + "?" + qparam.Encode()

		// *Cookie.Valid() added in go1.18
		// "session" not present in cookie, or cookie not present at all
		cookie, err := r.Cookie("session")
		if err != nil {
			log.Infof("invalid cookie: no session in cookie: %s %s", r.RemoteAddr, r.UserAgent())
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.Error(w, "invalid cookie", http.StatusUnauthorized)
			} else {
				http.Redirect(w, r, loginPath, http.StatusSeeOther)
			}
			return
		}

		// id not found in sessions data structure
		_, ok := sessions[cookie.Value]
		if !ok {
			log.Info("invalid cookie: session not recognized")
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.Error(w, "invalid cookie", http.StatusUnauthorized)
			} else {
				http.Redirect(w, r, loginPath, http.StatusSeeOther)
			}
			return
		}

		// session expired
		if time.Now().Sub(sessions[cookie.Value].CreatedAt) > sessionDuration {
			log.Info("invalid cookie: session expired")
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.Error(w, "invalid cookie", http.StatusUnauthorized)
			} else {
				http.Redirect(w, r, loginPath, http.StatusSeeOther)
			}
			return
		}

		h.ServeHTTP(w, r)
	})
}

func matchIdRedirMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO: really really don't like this strategy
		match, _ := regexp.MatchString(
			"/task/([0-9a-z]+-){4}[0-9a-z]+",
			r.URL.Path)
		if match {
			r.URL.Path = "/task/"
		}
		h.ServeHTTP(w, r)
	})
}

func redirectRootPathMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			// http.FileServer will register /taskboard and /taskboard/;
			// the former redirects to the latter.  Not ideal but whatever
			http.Redirect(w, r, "/taskboard", http.StatusSeeOther)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func incrementAPIMetricMiddleware(h http.Handler, apiName, apiType string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		go incrementAPIMetric(apiName, apiType)
		h.ServeHTTP(w, r)
	})
}

func putAPILatencyMetricMiddleware(h http.Handler, apiName, apiType string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h.ServeHTTP(w, r)
		go putLatencyMetric(time.Since(start), apiName, apiType)
	})
}

func logEventMiddleware(h http.Handler, apiName, apiType, callerId string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		h.ServeHTTP(w, r)

		referenceId, _ := r.Context().Value(referenceIdKey).(*string)

		getRequestBytes, _ := r.Context().Value(getRequestBytesKey).(*int)

		go logEvent(env.Log, time.Since(start), apiName, apiType, callerId, referenceId, getRequestBytes)
	})
}
