package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func getConfigHandle() http.Handler {
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
				key,
				value
				FROM config`,
		)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var serverConfigRows []ServerConfigRow
		for rows.Next() {
			var id, key, value string
			var cAt time.Time
			rows.Scan(&id, &cAt, &key, &value)
			serverConfigRows = append(serverConfigRows,
				ServerConfigRow{id, cAt, key, value})
		}

		if rows.Err() != nil {
			log.Errorf("Query failed: %v\n", rows.Err())
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		// this doesn't seem like good form
		// Might I have other types besides string and int??
		serverConfig := make(map[string]interface{})
		for _, scr := range serverConfigRows {
			i, err := strconv.ParseInt(scr.Value, 10, 64)
			if err == nil {
				serverConfig[scr.Key] = i
			} else {
				serverConfig[scr.Key] = scr.Value
			}
		}

		js, err := json.Marshal(serverConfig)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
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
		var edited bool

		err = conn.QueryRow(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				story_id,
				edited
				FROM tasks
				WHERE id = $1`,
			taskId,
		).Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyId, &edited)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(Task{id, cAt, uAt, title, desc, status, storyId, edited})
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)

	})
}

func getStoryByIdHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		storyId := r.URL.Query().Get("id")
		// TODO: strongly coupled to id format
		if strings.Count(storyId, "-") != 4 {
			log.Errorf("storyId seems incorrect: %s\n", storyId)
			http.Error(w, "bad story id", http.StatusBadRequest)
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

		var id, title, desc, status, sprintId string
		var cAt, uAt time.Time
		var edited bool

		err = conn.QueryRow(context.Background(),
			`SELECT
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				sprint_id,
				edited
				FROM stories
				WHERE id = $1`,
			storyId,
		).Scan(&id, &cAt, &uAt, &title, &desc, &status, &sprintId, &edited)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(Story{id, cAt, uAt, title, desc, status, sprintId, edited})
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
				story_id,
				edited
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
			var edited bool
			rows.Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyId, &edited)
			tasks = append(tasks, Task{id, cAt, uAt, title, desc, status, storyId, edited})
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
			StoryId     string `json:"story_id"`
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
				description,
				story_id
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2,
				$3
			);`,
			createReq.Title,
			createReq.Description,
			createReq.StoryId,
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
			StoryId     string `json:"story_id"`
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
			description = $3,
			story_id = $4,
			edited = true
			WHERE id = $5`,
			putReq.Status,
			putReq.Title,
			putReq.Description,
			putReq.StoryId,
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
				end_date,
				edited
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
			var edited bool
			rows.Scan(&id, &cAt, &uAt, &title, &sd, &ed, &edited)
			sprints = append(sprints, Sprint{id, cAt, uAt, title, sd, ed, edited})
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
			EndDate   time.Time `json:"end_date"`
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
			// createReq.StartDate.Add(sprintDuration),
			createReq.EndDate,
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
				sprint_id,
				edited
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
			var edited bool
			rows.Scan(&id, &cAt, &uAt, &title, &desc, &status, &sId, &edited)
			stories = append(stories, Story{id, cAt, uAt, title, desc, status, sId, edited})
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

// TAGS
func getTagsHandle() http.Handler {
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
				is_parent,
				edited
				FROM tags`,
		)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var tags []Tag
		for rows.Next() {
			var id, title, desc string
			var cAt, uAt time.Time
			var isParent, edited bool
			rows.Scan(&id, &cAt, &uAt, &title, &desc, &isParent, &edited)
			tags = append(tags, Tag{id, cAt, uAt, title, desc, isParent, edited})
		}

		if rows.Err() != nil {
			log.Errorf("Query failed: %v\n", rows.Err())
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(tags)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getTagAssignmentsHandle() http.Handler {
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
				tag_id,
				story_id
				FROM tag_assignments`,
		)
		if err != nil {
			log.Errorf("Query failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var tagAssignments []TagAssignment
		for rows.Next() {
			var id int
			var tagId, storyId string
			var cAt time.Time
			rows.Scan(&id, &cAt, &tagId, &storyId)
			tagAssignments = append(tagAssignments, TagAssignment{id, cAt, tagId, storyId})
		}

		if rows.Err() != nil {
			log.Errorf("Query failed: %v\n", rows.Err())
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(tagAssignments)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createTagAssignmentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var createReq struct {
			TagId   string `json:"tag_id"`
			StoryId string `json:"story_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		if createReq.TagId == "" || createReq.StoryId == "" {
			log.Error("createTagAssignment: TagId or StoryId blank")
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
			`INSERT INTO tag_assignments (
				tag_id,
				story_id
			) VALUES (
				$1,
				$2
			);`,
			createReq.TagId,
			createReq.StoryId,
		)
		if err != nil {
			log.Errorf("Exec failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func createTagHandle() http.Handler {
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

		// TODO: turn this into a validation function
		if createReq.Title == "" || createReq.Description == "" {
			log.Error("createTag: Title or Description blank")
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
			`INSERT INTO tags (
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
