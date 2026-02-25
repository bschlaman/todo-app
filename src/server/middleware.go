package main

import (
	"fmt"
	"math/rand/v2"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/b-utils/pkg/utils"
	"github.com/bschlaman/todo-app/cache"
	"github.com/fatih/color"
)

func chainMiddlewares(h http.Handler, middlewares ...utils.Middleware) http.Handler {
	for i := range middlewares {
		h = middlewares[len(middlewares)-1-i](h)
	}
	return h
}

func sessionMiddleware() utils.Middleware {
	return func(h http.Handler) http.Handler {
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

			session, ok := sessionManager.GetSession(cookie.Value)
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

			// Update last accessed time - SessionManager handles batching and DB updates
			_, _, _ = sessionManager.UpdateLastAccessed(cookie.Value)

			// session expired
			if time.Now().After(session.SessionCreatedAt.Add(sessionDuration)) {
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
}

func matchIDRedirMiddleware() utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// TODO: really really don't like this strategy
			match, _ := regexp.MatchString(
				"/task/[0-9a-zA-Z-]{6,}$",
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
}

// spaRewriteMiddleware is used for parts of my application which are Single Page Applications.
// For this to work, client-side routing owns sub-paths; the server should return /path/index.html.
func spaRewriteMiddleware(staticDirRoot string) utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Resolve the path the file server would try to serve
			fsPath := filepath.Join(staticDirRoot, filepath.Clean(r.URL.Path))
			if strings.HasPrefix(r.URL.Path, "/stories/") {
				println(r.URL.Path)
				println(fsPath)
			}

			// If an actual file exists (e.g. bundle, css, favicon), let it through
			if info, err := os.Stat(fsPath); err == nil && !info.IsDir() {
				h.ServeHTTP(w, r)
				return
			}

			// stories SPA
			if strings.HasPrefix(r.URL.Path, "/stories/") {
				r.URL.Path = "/stories/"
			}

			h.ServeHTTP(w, r)
		})
	}
}

func redirectRootPathMiddleware() utils.Middleware {
	return func(h http.Handler) http.Handler {
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
}

func incrementAPIMetricMiddleware(apiName, apiType string) utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			go metricsPublisher.IncrementAPIMetric(apiName, apiType)
			h.ServeHTTP(w, r)
		})
	}
}

func putAPILatencyMetricMiddleware(apiName, apiType string) utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			h.ServeHTTP(w, r)
			go metricsPublisher.PutLatencyMetric(time.Since(start), apiName, apiType)
		})
	}
}

// chaosMiddleware randomly fails a percentage of requests to aid in testing
// client-side error handling.  Only intended for use in dev mode.
func chaosMiddleware(devMode bool, failRate float64, apiType string) utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !devMode {
				h.ServeHTTP(w, r)
				return
			}
			// Don't break auth or utility routes
			if apiType == APIType.Auth || apiType == APIType.Util {
				h.ServeHTTP(w, r)
				return
			}
			if rand.Float64() < failRate {
				log.Infof("🔥 chaos: simulated failure on %s", r.URL.Path)
				http.Error(w, "chaos: simulated failure", http.StatusInternalServerError)
				return
			}
			h.ServeHTTP(w, r)
		})
	}
}

// enforceMediaTypeMiddleware is an inert middleware, just here as an example
func enforceMediaTypeMiddleware() utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// don't enforce on GET requests
			// (we could be checking e.g. if apiType == APIType.Auth)
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

				if mt != "application/json" && mt != "multipart/form-data" {
					http.Error(w, "Content-Type header must be application/json or multipart/form-data", http.StatusUnsupportedMediaType)
					return
				}
			}

			h.ServeHTTP(w, r)
		})
	}
}

// improvedLogReqMiddleware creates a logging middleware that logs requests in a readable format
// including timestamp, method, URI, and cache status
func improvedLogReqMiddleware(l *logger.BLogger) utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Create a custom ResponseWriter to capture cache status
			cacheStatus := cache.Skipped // default
			crw := cache.NewResponseWriter(w, &cacheStatus)

			h.ServeHTTP(crw, r)

			// Log the request with modern colored formatting
			// Define color functions for different elements - make methods dim
			var methodColorFunc func(a ...interface{}) string
			switch r.Method {
			case "GET":
				methodColorFunc = color.New(color.FgGreen, color.Faint).SprintFunc()
			case "POST":
				methodColorFunc = color.New(color.FgBlue, color.Faint).SprintFunc()
			case "PUT":
				methodColorFunc = color.New(color.FgYellow, color.Faint).SprintFunc()
			case "DELETE":
				methodColorFunc = color.New(color.FgRed, color.Faint).SprintFunc()
			case "PATCH":
				methodColorFunc = color.New(color.FgMagenta, color.Faint).SprintFunc()
			default:
				methodColorFunc = color.New(color.FgCyan, color.Faint).SprintFunc()
			}

			// Color code the cache status
			var cacheColorFunc func(a ...interface{}) string
			switch cacheStatus {
			case cache.Hit:
				cacheColorFunc = color.New(color.FgGreen).SprintFunc()
			case cache.Miss:
				cacheColorFunc = color.New(color.FgYellow).SprintFunc()
			case cache.Skipped:
				cacheColorFunc = color.New(color.FgCyan).SprintFunc()
			}

			// Duration coloring based on response time - all dim, no color for fast requests
			duration := time.Since(start).Milliseconds()
			var durationColorFunc func(a ...interface{}) string
			switch {
			case duration < 50:
				durationColorFunc = color.New(color.Faint).SprintFunc()
			case duration < 200:
				durationColorFunc = color.New(color.FgYellow, color.Faint).SprintFunc()
			default:
				durationColorFunc = color.New(color.FgRed, color.Faint).SprintFunc()
			}

			// Create colored components with padding for alignment
			coloredMethod := methodColorFunc(fmt.Sprintf("%-6s", r.Method))
			coloredPath := color.New(color.FgCyan).Sprint(fmt.Sprintf("%-30s", r.URL.Path))
			coloredCache := cacheColorFunc(fmt.Sprintf("%-5s", cacheStatus))
			coloredDuration := durationColorFunc(fmt.Sprintf("%dms", duration))
			arrow := color.New(color.Bold).Sprint("→")

			logLine := fmt.Sprintf("%s %s %s %s (%s)",
				coloredMethod,
				coloredPath,
				arrow,
				coloredCache,
				coloredDuration,
			)

			l.Info(logLine)
		})
	}
}
