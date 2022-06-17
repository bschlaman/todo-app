package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/b-utils/pkg/utils"
	"github.com/jackc/pgx/v4"
)

const (
	serverName string = "TODO-APP-SERVER"
	port       string = ":8080"
	logPath    string = "logs/output.log"
	configPath string = "config.json"
	staticDir  string = "assets/static"
)

var log *logger.BLogger

func getPgxConn() (*pgx.Conn, error) {
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}
	return conn, nil
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

		// TODO: this will not work; needs to be an array
		// fine for the initial commit
		var id, cAt, uAt, title, desc, status string
		err = conn.QueryRow(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				title,
				description,
				status
				FROM tasks`,
		).Scan(&id, &cAt, &uAt, &title, &desc, &status)
		if err != nil {
			log.Errorf("QueryRow failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(&struct {
			Id          string `json:"id"`
			CreatedAt   string `json:"created_at"`
			UpdatedAt   string `json:"updated_at"`
			Title       string `json:"title"`
			Description string `json:"description"`
			Status      string `json:"status"`
		}{
			id,
			cAt,
			uAt,
			title,
			desc,
			status,
		})
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func putTaskHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var putReq struct {
			Id     string     `json:"id"`
			Status TaskStatus `json:"status"`
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
			status = $1
			WHERE id = $2`,
			putReq.Status,
			putReq.Id,
		)
		if err != nil {
			log.Errorf("Exec failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
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
	fs := http.FileServer(http.Dir(path.Join("..", staticDir)))
	http.Handle("/", fs)
	http.Handle("/echo", utils.LogReq(log)(utils.EchoHandle()))
	http.Handle("/get_tasks", utils.LogReq(log)(getTasksHandle()))
	http.Handle("/put_task", utils.LogReq(log)(putTaskHandle()))
	http.Handle("/new_task", utils.LogReq(log)(newTaskHandle()))
	http.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path.Join("..", staticDir, "favicon.png"))
	})
	log.Info("starting http server on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
