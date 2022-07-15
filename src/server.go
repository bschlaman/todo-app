package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/b-utils/pkg/utils"
	"github.com/jackc/pgx/v4"
)

// TODO: pull these from config table
const (
	serverName     string        = "TODO-APP-SERVER"
	port           string        = ":8080"
	logPath        string        = "logs/output.log"
	configPath     string        = "config.json"
	staticDir      string        = "assets/static"
	sprintDuration time.Duration = time.Hour * 24 * 14
)

var log *logger.BLogger

func getPgxConn() (*pgx.Conn, error) {
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}
	return conn, nil
}

type Task struct {
	Id          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	StoryId     string    `json:"story_id"`
}

type Comment struct {
	Id        int       `json:"id"`
	TaskId    string    `json:"task_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Text      string    `json:"text"`
	Edited    bool      `json:"edited"`
}

type Sprint struct {
	Id        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Title     string    `json:"title"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}

type Story struct {
	Id          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	SprintId    string    `json:"sprint_id"`
}

func getCommentsByIdHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		taskId := r.URL.Query().Get("id")
		if strings.Count(taskId, "-") != 4 {
			log.Errorf("taskId seems incorrect: %s\n", taskId)
			http.Error(w, "bad task id", http.StatusBadRequest)
			return
		}

		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		rows, err := conn.Query(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				text,
				edited
				FROM comments
				WHERE task_id = $1`,
			taskId,
		)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var comments []Comment
		for rows.Next() {
			var id int
			var text string
			var edited bool
			var cAt, uAt time.Time
			rows.Scan(&id, &cAt, &uAt, &text, &edited)
			comments = append(comments, Comment{id, taskId, cAt, uAt, text, edited})
		}

		if rows.Err() != nil {
			log.Errorf("Query failed: %v\n", rows.Err())
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(comments)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getTaskByIdHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		taskId := r.URL.Query().Get("id")
		// TODO: strongly coupled to id format
		if strings.Count(taskId, "-") != 4 {
			log.Errorf("taskId seems incorrect: %s\n", taskId)
			http.Error(w, "bad task id", http.StatusBadRequest)
			return
		}

		// TODO: can getting a connection be middleware?
		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		var id, title, desc, status, storyId string
		var cAt, uAt time.Time

		err = conn.QueryRow(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				story_id
				FROM tasks
				WHERE id = $1`,
			taskId,
		).Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyId)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(Task{id, cAt, uAt, title, desc, status, storyId})
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)

	})
}

func getTasksHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		rows, err := conn.Query(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				story_id
				FROM tasks`,
		)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var tasks []Task
		for rows.Next() {
			var id, title, desc, status, storyId string
			var cAt, uAt time.Time
			rows.Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyId)
			tasks = append(tasks, Task{id, cAt, uAt, title, desc, status, storyId})
		}

		if rows.Err() != nil {
			log.Errorf("Query failed: %v\n", rows.Err())
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(tasks)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createTaskHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var createReq struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		_, err = conn.Exec(context.Background(),
			`INSERT INTO tasks (
				updated_at,
				title,
				description
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2
			);`,
			createReq.Title,
			createReq.Description,
		)
		if err != nil {
			log.Errorf("Exec failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func createCommentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var createReq struct {
			Text   string `json:"text"`
			TaskId string `json:"task_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		if createReq.Text == "" || createReq.TaskId == "" {
			log.Error("createComment: Text or TaskId blank")
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		_, err = conn.Exec(context.Background(),
			`INSERT INTO comments (
				updated_at,
				text,
				task_id
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2
			);`,
			createReq.Text,
			createReq.TaskId,
		)
		if err != nil {
			log.Errorf("Exec failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func putTaskHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var putReq struct {
			Id          string `json:"id"`
			Status      string `json:"status"`
			Title       string `json:"title"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&putReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		_, err = conn.Exec(context.Background(),
			`UPDATE tasks SET
			updated_at = CURRENT_TIMESTAMP,
			status = $1,
			title = $2,
			description = $3
			WHERE id = $4`,
			putReq.Status,
			putReq.Title,
			putReq.Description,
			putReq.Id,
		)
		if err != nil {
			log.Errorf("Exec failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func getSprintsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		rows, err := conn.Query(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				title,
				start_date,
				end_date
				FROM sprints`,
		)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var sprints []Sprint
		for rows.Next() {
			var id, title string
			var cAt, uAt, sd, ed time.Time
			rows.Scan(&id, &cAt, &uAt, &title, &sd, &ed)
			sprints = append(sprints, Sprint{id, cAt, uAt, title, sd, ed})
		}

		if rows.Err() != nil {
			log.Errorf("Query failed: %v\n", rows.Err())
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(sprints)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createSprintHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		var createReq struct {
			Title     string    `json:"title"`
			StartDate time.Time `json:"start_date"`
		}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		_, err = conn.Exec(context.Background(),
			`INSERT INTO sprints (
				updated_at,
				title,
				start_date,
				end_date
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2,
				$3
			);`,
			createReq.Title,
			createReq.StartDate,
			createReq.StartDate.Add(sprintDuration),
		)
		if err != nil {
			log.Errorf("Exec failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func getStoriesHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		rows, err := conn.Query(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				sprint_id
				FROM stories`,
		)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var stories []Story
		for rows.Next() {
			var id, title, desc, status, sId string
			var cAt, uAt time.Time
			rows.Scan(&id, &cAt, &uAt, &title, &desc, &status, &sId)
			stories = append(stories, Story{id, cAt, uAt, title, desc, status, sId})
		}

		if rows.Err() != nil {
			log.Errorf("Query failed: %v\n", rows.Err())
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(stories)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createStoryHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var createReq struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			SprintId    string `json:"sprint_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		conn, err := getPgxConn()
		if err != nil {
			log.Errorf("unable to connect to database: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer conn.Close(context.Background())

		_, err = conn.Exec(context.Background(),
			`INSERT INTO stories (
				updated_at,
				title,
				description,
				sprint_id
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2,
				$3
			);`,
			createReq.Title,
			createReq.Description,
			createReq.SprintId,
		)
		if err != nil {
			log.Errorf("Exec failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
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
}

func main() {
	// special case handlers
	fs := http.FileServer(http.Dir(path.Join("..", staticDir)))
	http.Handle("/", matchIdRedir(fs))
	http.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path.Join("..", staticDir, "favicon.png"))
	})

	routes := []struct {
		Path    string
		Handler func() http.Handler
	}{
		{"/echo", utils.EchoHandle},
		{"/get_tasks", getTasksHandle},
		{"/get_task", getTaskByIdHandle},
		{"/put_task", putTaskHandle},
		{"/create_task", createTaskHandle},
		{"/create_comment", createCommentHandle},
		{"/get_comments_by_task_id", getCommentsByIdHandle},
		{"/get_sprints", getSprintsHandle},
		{"/create_sprint", createSprintHandle},
		{"/get_stories", getStoriesHandle},
		{"/create_story", createStoryHandle},
	}
	for _, route := range routes {
		http.Handle(route.Path, utils.LogReq(log)(route.Handler()))
	}

	log.Info("starting http server on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
