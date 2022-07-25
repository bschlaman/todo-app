package main

import (
	"io"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/b-utils/pkg/utils"
	"github.com/google/uuid"
)

// TODO: pull these from config table
const (
	serverName      string        = "TODO-APP-SERVER"
	logPath         string        = "logs/output.log"
	staticDir       string        = "assets/static"
	sprintDuration  time.Duration = time.Hour * 24 * 14
	sessionDuration time.Duration = 1 * time.Hour
)

type Session struct {
	Id        string
	CreatedAt time.Time
}

var log *logger.BLogger

var sessions map[string]Session

var loginPw string

func createSaveNewSession() string {
	id := uuid.NewString()
	sessions[id] = Session{id, time.Now()}
	return id
}

func sessionMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// authentication not required for these paths
		skippablePaths := []string{
			"/login",
			"/js",
			"/css",
			"/favicon.ico",
		}
		for _, path := range skippablePaths {
			if strings.HasPrefix(r.URL.Path, path) {
				h.ServeHTTP(w, r)
				return
			}
		}

		loginPath := "/login"

		// *Cookie.Valid() added in go1.18
		// "session" not present in cookie, or cookie not present at all
		cookie, err := r.Cookie("session")
		if err != nil {
			log.Infof("invalid cookie: no session in cookie")
			http.Redirect(w, r, loginPath, http.StatusSeeOther)
			return
		}

		// id not found in sessions data structure
		session, ok := sessions[cookie.Value]
		if !ok {
			log.Infof("invalid cookie: session not recognized: %v\n", session)
			http.Redirect(w, r, loginPath, http.StatusSeeOther)
			return
		}

		// session expired
		if time.Now().Sub(sessions[cookie.Value].CreatedAt) > sessionDuration {
			log.Infof("invalid cookie: session expired")
			http.Redirect(w, r, loginPath, http.StatusSeeOther)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func loginHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO: branching based on method seems clunky...
		// if GET, we want to serve the login/index.html page
		// if r.Method == http.MethodGet {
		// 	// this also seems bad
		// 	http.ServeFile(w, r, "index.html")
		// 	return
		// }
		// if r.Method == http.MethodPost {
		pass := r.FormValue("pass")
		if pass == loginPw {
			log.Info("login successful!")
			id := createSaveNewSession()
			cookie := &http.Cookie{
				Name:     "session",
				Value:    id,
				SameSite: http.SameSiteDefaultMode,
				Path:     "/",
			}
			http.SetCookie(w, cookie)
			log.Infof("setting cookie: %v\n", cookie)
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}
		log.Infof("incorrect pw: %v\n", pass)
		http.Error(w, "incorrect pw", http.StatusUnauthorized)
		return
		// }
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

func init() {
	file, err := os.OpenFile(logPath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}
	mw := io.MultiWriter(file, os.Stdout)
	// init globals
	log = logger.New(mw)
	sessions = make(map[string]Session)
	loginPw = os.Getenv("LOGIN_PW")
}

func main() {

	// special case handlers
	fs := http.FileServer(http.Dir(path.Join("..", staticDir)))
	http.Handle("/", sessionMiddleware(
		redirectRootPathMiddleware(
			matchIdRedirMiddleware(fs),
		),
	))

	// currently using schlamalama.com/favicon.ico
	// http.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
	// 	http.ServeFile(w, r, path.Join("..", staticDir, "favicon.png"))
	// })

	apiRoutes := []struct {
		Path    string
		Handler func() http.Handler
	}{
		{"/api/echo", utils.EchoHandle},
		{"/api/login", loginHandle},
		{"/api/get_config", getConfigHandle},
		{"/api/get_tasks", getTasksHandle},
		{"/api/get_task", getTaskByIdHandle},
		{"/api/put_task", putTaskHandle},
		{"/api/create_task", createTaskHandle},
		{"/api/create_comment", createCommentHandle},
		{"/api/get_comments_by_task_id", getCommentsByIdHandle},
		{"/api/get_stories", getStoriesHandle},
		{"/api/get_story", getStoryByIdHandle},
		{"/api/create_story", createStoryHandle},
		{"/api/get_sprints", getSprintsHandle},
		{"/api/create_sprint", createSprintHandle},
		{"/api/assign_tag", createTagAssignmentHandle},
		{"/api/get_tags", getTagsHandle},
		{"/api/create_tag", createTagHandle},
	}
	for _, route := range apiRoutes {
		http.Handle(route.Path, utils.LogReq(log)(route.Handler()))
	}

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		panic("SERVER_PORT env var not set")
	}
	log.Info("starting http server on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
