package main

import (
	"io"
	"net/http"
	"os"
	"path"
	"regexp"
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
	sessionDuration time.Duration = 45 * time.Second
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
		println("asdf")
		sessionValid := true

		// *Cookie.Valid() added in go1.18
		// "session" not present in cookie, or cookie not present at all
		cookie, err := r.Cookie("session")
		if err != nil {
			sessionValid = false
			log.Infof("invalid cookie: no session in cookie")
		}

		// id not found in sessions data structure
		_, ok := sessions[cookie.Value]
		if !ok {
			sessionValid = false
			log.Infof("invalid cookie: session not recognized")
		}

		// session expired
		if time.Now().Sub(sessions[cookie.Value].CreatedAt) > sessionDuration {
			sessionValid = false
			log.Infof("invalid cookie: session expired")
		}

		if !sessionValid {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return // is this needed?
		}
		h.ServeHTTP(w, r)
	})
}

func loginHandle(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		println("asdflogin")
		// TODO: branching based on method seems clunky...
		// if GET, we want to serve the login/index.html page
		if r.Method == http.MethodGet {
			h.ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodPost {
			pass := r.FormValue("pass")
			if pass == loginPw {
				log.Info("login successful!")
				id := createSaveNewSession()
				cookie := &http.Cookie{
					Name:     "session",
					Value:    id,
					SameSite: http.SameSiteDefaultMode,
				}
				http.SetCookie(w, cookie)
				log.Infof("setting cookie: %v\n", cookie)
				http.Redirect(w, r, "/", http.StatusSeeOther)
				return
			}
			log.Infof("incorrect pw: %v\n", pass)
			http.Error(w, "incorrect pw", http.StatusUnauthorized)
			return
		}
	})
}

func matchIdRedir(h http.Handler) http.Handler {
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

func init() {
	file, err := os.OpenFile(logPath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}
	mw := io.MultiWriter(file, os.Stdout)
	log = logger.New(mw)
	sessions = make(map[string]Session)
	loginPw = os.Getenv("LOGIN_PW")
}

func main() {
	// special case handlers
	fs := http.FileServer(http.Dir(path.Join("..", staticDir)))
	http.Handle("/", sessionMiddleware(matchIdRedir(fs)))
	http.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path.Join("..", staticDir, "favicon.png"))
	})
	http.Handle("/login", loginHandle(fs))

	routes := []struct {
		Path    string
		Handler func() http.Handler
	}{
		{"/echo", utils.EchoHandle},
		{"/get_config", getConfigHandle},
		{"/get_tasks", getTasksHandle},
		{"/get_task", getTaskByIdHandle},
		{"/put_task", putTaskHandle},
		{"/create_task", createTaskHandle},
		{"/create_comment", createCommentHandle},
		{"/get_comments_by_task_id", getCommentsByIdHandle},
		{"/get_stories", getStoriesHandle},
		{"/get_story", getStoryByIdHandle},
		{"/create_story", createStoryHandle},
		{"/get_sprints", getSprintsHandle},
		{"/create_sprint", createSprintHandle},
	}
	for _, route := range routes {
		http.Handle(route.Path, utils.LogReq(log)(route.Handler()))
	}

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		panic("SERVER_PORT env var not set")
	}
	log.Info("starting http server on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
