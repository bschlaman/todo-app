package model

import (
	"context"
	"strconv"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/todo-app/database"
)

type InputError struct{}

func (e InputError) Error() string {
	return "input invalid"
}

// TODO (2022.09.30): find a better way of logging here.
// Do I even need to log in this package?
// after some more thought, I really dont think I should be logging here
func GetConfig(log *logger.BLogger) (map[string]interface{}, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
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

	return serverConfig, nil
}

func GetCommentsByTaskId(log *logger.BLogger, taskId string) ([]Comment, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return comments, nil
}

func GetTaskByIdHandle(log *logger.BLogger, taskId string) (*Task, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id, title, desc, status string
	var storyId *string
	var cAt, uAt time.Time
	var edited, bulkTask bool

	err = conn.QueryRow(context.Background(),
		`SELECT
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				story_id,
				edited,
				bulk_task
				FROM tasks
				WHERE id = $1`,
		taskId,
	).Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyId, &edited, &bulkTask)
	if err != nil {
		log.Errorf("Query failed: %v", err)
		return nil, err
	}

	return &Task{id, cAt, uAt, title, desc, status, storyId, edited, bulkTask}, nil
}

func GetStoryById(log *logger.BLogger, storyId string) (*Story, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", err)
		return nil, err
	}

	return &Story{id, cAt, uAt, title, desc, status, sprintId, edited}, nil
}

func GetTasks(log *logger.BLogger) ([]Task, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
				edited,
				bulk_task
				FROM tasks`,
	)
	if err != nil {
		log.Errorf("Query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var id, title, desc, status string
		var storyId *string
		var cAt, uAt time.Time
		var edited, bulkTask bool
		rows.Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyId, &edited, &bulkTask)
		tasks = append(tasks, Task{id, cAt, uAt, title, desc, status, storyId, edited, bulkTask})
	}
	if rows.Err() != nil {
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return tasks, nil
}

func CreateTask(log *logger.BLogger, createReq CreateTaskReq) (*CreateEntityResponse, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id string

	err = conn.QueryRow(context.Background(),
		`INSERT INTO tasks (
				updated_at,
				title,
				description,
				story_id,
				bulk_task
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2,
				$3,
				$4
			) RETURNING id`,
		createReq.Title,
		createReq.Description,
		createReq.StoryId,
		createReq.BulkTask,
	).Scan(&id)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return nil, err
	}

	return &CreateEntityResponse{id}, nil
}

func CreateComment(log *logger.BLogger, createReq CreateCommentReq) (*CreateEntityResponse, error) {
	if createReq.Text == "" || createReq.TaskId == "" {
		log.Error("createComment: Text or TaskId blank")
		return nil, InputError{}
	}

	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id string

	err = conn.QueryRow(context.Background(),
		`INSERT INTO comments (
				updated_at,
				text,
				task_id
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2
			) RETURNING id::text`, // TODO (2022.12.01): is there a cleaner way than casting to text?
		createReq.Text,
		createReq.TaskId,
	).Scan(&id)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return nil, err
	}

	return &CreateEntityResponse{id}, nil
}

func PutStory(log *logger.BLogger, putReq PutStoryReq) error {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return err
	}
	defer conn.Close(context.Background())

	_, err = conn.Exec(context.Background(),
		`UPDATE stories SET
			updated_at = CURRENT_TIMESTAMP,
			status = $1,
			title = $2,
			description = $3,
			sprint_id = $4,
			edited = true
			WHERE id = $5`,
		putReq.Status,
		putReq.Title,
		putReq.Description,
		putReq.SprintId,
		putReq.Id,
	)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return err
	}

	return nil
}
func PutTask(log *logger.BLogger, putReq PutTaskReq) error {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return err
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
		log.Errorf("Exec failed: %v", err)
		return err
	}

	return nil
}

func GetSprints(log *logger.BLogger) ([]Sprint, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return sprints, nil
}

func CreateSprint(log *logger.BLogger, createReq CreateSprintReq) (*CreateEntityResponse, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id string

	err = conn.QueryRow(context.Background(),
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
			) RETURNING id`,
		createReq.Title,
		createReq.StartDate,
		// createReq.StartDate.Add(sprintDuration),
		createReq.EndDate,
	).Scan(&id)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return nil, err
	}

	return &CreateEntityResponse{id}, nil
}

func GetStories(log *logger.BLogger) ([]Story, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return stories, nil
}

func CreateStory(log *logger.BLogger, createReq CreateStoryReq) (*CreateEntityResponse, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id string

	err = conn.QueryRow(context.Background(),
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
			) RETURNING id`,
		createReq.Title,
		createReq.Description,
		createReq.SprintId,
	).Scan(&id)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return nil, err
	}

	return &CreateEntityResponse{id}, nil
}

func GetTags(log *logger.BLogger) ([]Tag, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return tags, nil
}

func GetTagAssignments(log *logger.BLogger) ([]TagAssignment, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", err)
		return nil, err
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
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return tagAssignments, nil
}

func CreateTagAssignment(log *logger.BLogger, createReq CreateTagAssignmentReq) (*CreateEntityResponse, error) {
	if createReq.TagId == "" || createReq.StoryId == "" {
		log.Error("createTagAssignment: TagId or StoryId blank")
		return nil, InputError{}
	}

	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id string

	err = conn.QueryRow(context.Background(),
		`INSERT INTO tag_assignments (
				tag_id,
				story_id
			) VALUES (
				$1,
				$2
			) RETURNING id::text`, // TODO (2022.12.01): is there a cleaner way than casting to text?
		createReq.TagId,
		createReq.StoryId,
	).Scan(&id)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return nil, err
	}

	return &CreateEntityResponse{id}, nil
}

func DestroyTagAssignment(log *logger.BLogger, destroyReq DestroyTagAssignmentReq) error {
	if destroyReq.TagId == "" || destroyReq.StoryId == "" {
		log.Error("destroyTagAssignment: TagId or StoryId blank")
		return InputError{}
	}

	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return err
	}
	defer conn.Close(context.Background())

	_, err = conn.Exec(context.Background(),
		`DELETE FROM tag_assignments
				WHERE
				tag_id = $1
				AND
				story_id = $2
			;`,
		destroyReq.TagId,
		destroyReq.StoryId,
	)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return err
	}

	return nil
}

func CreateTag(log *logger.BLogger, createReq CreateTagReq) (*CreateEntityResponse, error) {
	if createReq.Title == "" || createReq.Description == "" {
		log.Error("createTag: Title or Description blank")
		return nil, InputError{}
	}

	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id string

	err = conn.QueryRow(context.Background(),
		`INSERT INTO tags (
				updated_at,
				title,
				description
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2
			) RETURNING id`,
		createReq.Title,
		createReq.Description,
	).Scan(&id)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return nil, err
	}

	return &CreateEntityResponse{id}, nil
}
