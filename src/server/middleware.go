package main

import (
	"bytes"
	"mime"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/bschlaman/todo-app/model"
)

func sessionMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// authentication not required for these paths
		skippablePaths := []string{
			"/login",
			"/favicon.ico",
			"/api/login",
			"/api/echo",
			"/api/clear_sessions",
			"/api/get_sessions",
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

		cookie, err := r.Cookie("session")
		// TODO: *Cookie.Valid() added in go1.18
		// "session" not present in cookie, or cookie not present at all
		if err != nil {
			log.Infof("invalid cookie: no session in cookie")
			// log.Infof("request details: %s, %s, %s", r.URL.Path, r.RemoteAddr, r.UserAgent())
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.Error(w, "invalid cookie", http.StatusUnauthorized)
			} else {
				http.Redirect(w, r, loginPath, http.StatusSeeOther)
			}
			return
		}

		session, ok := sessions[cookie.Value]
		// id not found in sessions data structure
		if !ok {
			log.Info("invalid cookie: session not recognized")
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.Error(w, "invalid cookie", http.StatusUnauthorized)
			} else {
				http.Redirect(w, r, loginPath, http.StatusSeeOther)
			}
			return
		}

		// prevSessionLastAccessed used for workaround in the TODO below
		prevSessionLastAccessed := session.SessionLastAccessed
		// update LastAccessed, even if the session is ultimately expired
		session.SessionLastAccessed = time.Now()
		sessions[cookie.Value] = session
		// using a goroutine to be consistent with other best effort operations
		// like event logging and metric emission
		// TODO (2023.09.30): this db update happens for every API request!
		// For now, I will only make the db call if the session LastAccessed update is
		// sufficiently new.  Need to find a longer term fix for this
		// For one thing, this may result in the db information being stale if
		// the in-memory sessions are deleted before this sync happens
		if session.SessionLastAccessed.Sub(prevSessionLastAccessed) > 10*time.Second {
			log.Infof("updating SessionLastAccessed in db for session: %s", session.SessionID)
			go model.PutSessionLastAccessed(env.Log, session.SessionID, session.SessionLastAccessed)
		}

		// session expired
		if time.Since(session.SessionCreatedAt) > sessionDuration {
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

func matchIDRedirMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO: really really don't like this strategy
		match, _ := regexp.MatchString(
			"/task/([0-9a-z]+-){4}[0-9a-z]+",
			r.URL.Path)
		if match {
			r.URL.Path = "/task/"
		}
		matchV1, _ := regexp.MatchString(
			"/task_v1/([0-9a-z]+-){4}[0-9a-z]+",
			r.URL.Path)
		if matchV1 {
			r.URL.Path = "/task_v1/"
		}
		h.ServeHTTP(w, r)
	})
}

func redirectRootPathMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			// http.FileServer will register /<root> and /<root>/;
			// the former redirects to the latter.  Not ideal but whatever
			http.Redirect(w, r, rootServerPath, http.StatusSeeOther)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func incrementAPIMetricMiddleware(apiName, apiType string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		go incrementAPIMetric(apiName, apiType)
		h.ServeHTTP(w, r)
	})
}

func putAPILatencyMetricMiddleware(apiName, apiType string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h.ServeHTTP(w, r)
		go putLatencyMetric(time.Since(start), apiName, apiType)
	})
}

func logEventMiddleware(apiName, apiType, callerID string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		h.ServeHTTP(w, r)

		// TODO (2022.12.01): this results in 0 value strings / ints
		// being sent to the db - figure out a better way
		createEntityID, _ := r.Context().Value(createEntityIDKey).(string)

		getRequestBytes, _ := r.Context().Value(getRequestBytesKey).(int)

		go logEvent(env.Log, time.Since(start), apiName, apiType, callerID, &createEntityID, &getRequestBytes)
	})
}

// TODO (2022.12.03): is this middleware really necessary?
func enforceJSONHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// don't enforce on GET requests
		if r.Method == "GET" || r.URL.Path == "/api/login" {
			h.ServeHTTP(w, r)
			return
		}

		contentType := r.Header.Get("Content-Type")

		if contentType != "" {
			mt, _, err := mime.ParseMediaType(contentType)
			if err != nil {
				http.Error(w, "malformed Content-Type header", http.StatusBadRequest)
				return
			}

			if mt != "application/json" {
				http.Error(w, "Content-Type header must be application/json", http.StatusUnsupportedMediaType)
				return
			}
		}

		h.ServeHTTP(w, r)
	})
}

func cachingMiddleware(apiType string, cache *cacheStore, h http.Handler) http.Handler {
	cacheMutex := &sync.Mutex{}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// if it's not a get request, don't do anything
		if apiType != APIType.Get && apiType != APIType.GetMany {
			h.ServeHTTP(w, r)
			return
		}

		cacheKey := r.URL.String()
		cacheMutex.Lock()
		response, found := cache.get(cacheKey)

		if found {
			log.Infof("cache hit for key: %s", cacheKey)
			cacheMutex.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.Write(response)
			return
		}

		recorder := &responseRecorder{w, new(bytes.Buffer)}

		h.ServeHTTP(recorder, r)

		cache.set(cacheKey, recorder.body.Bytes())
		cacheMutex.Unlock()
	})
}
