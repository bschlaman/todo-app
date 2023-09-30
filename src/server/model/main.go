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

func GetCommentsByTaskID(log *logger.BLogger, taskID string) ([]Comment, error) {
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
		taskID,
	)
	if err != nil {
		log.Errorf("Query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var comments = []Comment{}
	for rows.Next() {
		var id int
		var text string
		var edited bool
		var cAt, uAt time.Time
		rows.Scan(&id, &cAt, &uAt, &text, &edited)
		comments = append(comments, Comment{id, taskID, cAt, uAt, text, edited})
	}
	if rows.Err() != nil {
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return comments, nil
}

func GetTaskByID(log *logger.BLogger, taskID string) (*Task, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id, title, desc, status string
	var storyID *string
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
		taskID,
	).Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyID, &edited, &bulkTask)
	if err != nil {
		log.Errorf("Query failed: %v", err)
		return nil, err
	}

	return &Task{id, cAt, uAt, title, desc, status, storyID, edited, bulkTask}, nil
}

func GetStoryByID(log *logger.BLogger, storyID string) (*Story, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id, title, desc, status, sprintID string
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
		storyID,
	).Scan(&id, &cAt, &uAt, &title, &desc, &status, &sprintID, &edited)
	if err != nil {
		log.Errorf("Query failed: %v", err)
		return nil, err
	}

	return &Story{id, cAt, uAt, title, desc, status, sprintID, edited}, nil
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

	var tasks = []Task{}
	for rows.Next() {
		var id, title, desc, status string
		var storyID *string
		var cAt, uAt time.Time
		var edited, bulkTask bool
		rows.Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyID, &edited, &bulkTask)
		tasks = append(tasks, Task{id, cAt, uAt, title, desc, status, storyID, edited, bulkTask})
	}
	if rows.Err() != nil {
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return tasks, nil
}

func CreateTask(log *logger.BLogger, createReq CreateTaskReq) (*Task, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id, title, desc, status string
	var storyID *string
	var cAt, uAt time.Time
	var edited, bulkTask bool

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
			) RETURNING
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				story_id,
				edited,
				bulk_task`,
		createReq.Title,
		createReq.Description,
		createReq.StoryID,
		createReq.BulkTask,
	).Scan(&id, &cAt, &uAt, &title, &desc, &status, &storyID, &edited, &bulkTask)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &Task{id, cAt, uAt, title, desc, status, storyID, edited, bulkTask}, nil
}

func CreateComment(log *logger.BLogger, createReq CreateCommentReq) (*Comment, error) {
	if createReq.Text == "" || createReq.TaskID == "" {
		log.Error("createComment: Text or TaskID blank")
		return nil, InputError{}
	}

	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id int
	var text string
	var edited bool
	var cAt, uAt time.Time

	err = conn.QueryRow(context.Background(),
		`INSERT INTO comments (
				updated_at,
				text,
				task_id
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2
			) RETURNING
				id,
				created_at,
				updated_at,
				text,
				edited`,
		createReq.Text,
		createReq.TaskID,
	).Scan(&id, &cAt, &uAt, &text, &edited)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &Comment{id, createReq.TaskID, cAt, uAt, text, edited}, nil
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
		putReq.SprintID,
		putReq.ID,
	)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
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
		putReq.StoryID,
		putReq.ID,
	)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
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

	var sprints = []Sprint{}
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

func CreateSprint(log *logger.BLogger, createReq CreateSprintReq) (*Sprint, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id, title string
	var cAt, uAt, sd, ed time.Time
	var edited bool

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
			) RETURNING
				id,
				created_at,
				updated_at,
				title,
				start_date,
				end_date,
				edited`,
		createReq.Title,
		createReq.StartDate,
		// createReq.StartDate.Add(sprintDuration),
		createReq.EndDate,
	).Scan(&id, &cAt, &uAt, &title, &sd, &ed, &edited)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &Sprint{id, cAt, uAt, title, sd, ed, edited}, nil
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

	var stories []Story = []Story{}
	for rows.Next() {
		var id, title, desc, status, sID string
		var cAt, uAt time.Time
		var edited bool
		rows.Scan(&id, &cAt, &uAt, &title, &desc, &status, &sID, &edited)
		stories = append(stories, Story{id, cAt, uAt, title, desc, status, sID, edited})
	}

	if rows.Err() != nil {
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return stories, nil
}

func CreateStory(log *logger.BLogger, createReq CreateStoryReq) (*Story, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id, title, desc, status, sprintID string
	var cAt, uAt time.Time
	var edited bool

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
			) RETURNING id
				id,
				created_at,
				updated_at,
				title,
				description,
				status,
				sprint_id,
				edited`,
		createReq.Title,
		createReq.Description,
		createReq.SprintID,
	).Scan(&id, &cAt, &uAt, &title, &desc, &status, &sprintID, &edited)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &Story{id, cAt, uAt, title, desc, status, sprintID, edited}, nil
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

	var tags = []Tag{}
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

	var tagAssignments = []TagAssignment{}
	for rows.Next() {
		var id int
		var tagID, storyID string
		var cAt time.Time
		rows.Scan(&id, &cAt, &tagID, &storyID)
		tagAssignments = append(tagAssignments, TagAssignment{id, cAt, tagID, storyID})
	}
	if rows.Err() != nil {
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return tagAssignments, nil
}

func CreateTagAssignment(log *logger.BLogger, createReq CreateTagAssignmentReq) (*TagAssignment, error) {
	if createReq.TagID == "" || createReq.StoryID == "" {
		log.Error("createTagAssignment: TagID or StoryID blank")
		return nil, InputError{}
	}

	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id int
	var tagID, storyID string
	var cAt time.Time

	err = conn.QueryRow(context.Background(),
		`INSERT INTO tag_assignments (
				tag_id,
				story_id
			) VALUES (
				$1,
				$2
			) RETURNING
			  id,
				created_at,
				tag_id,
				story_id`,
		createReq.TagID,
		createReq.StoryID,
	).Scan(&id, &cAt, &tagID, &storyID)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &TagAssignment{id, cAt, tagID, storyID}, nil
}

func DestroyTagAssignment(log *logger.BLogger, destroyReq DestroyTagAssignmentReq) error {
	// TODO (2023.01.22): can delete this check once using ID
	if destroyReq.TagID == "" || destroyReq.StoryID == "" {
		log.Error("destroyTagAssignment: TagID or StoryID blank")
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
		destroyReq.TagID,
		destroyReq.StoryID,
	)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return err
	}

	return nil
}

func DestroyTagAssignmentByID(log *logger.BLogger, destroyReq DestroyTagAssignmentByIDReq) error {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return err
	}
	defer conn.Close(context.Background())

	_, err = conn.Exec(context.Background(),
		`DELETE FROM tag_assignments
				WHERE
				id = $1
			;`,
		destroyReq.ID,
	)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return err
	}

	return nil
}

func CreateTag(log *logger.BLogger, createReq CreateTagReq) (*Tag, error) {
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

	var id, title, desc string
	var cAt, uAt time.Time
	var isParent, edited bool

	err = conn.QueryRow(context.Background(),
		`INSERT INTO tags (
				updated_at,
				title,
				description
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2
			) RETURNING
				id,
				created_at,
				updated_at,
				title,
				description,
				is_parent,
				edited`,
		createReq.Title,
		createReq.Description,
	).Scan(&id, &cAt, &uAt, &title, &desc, &isParent, &edited)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &Tag{id, cAt, uAt, title, desc, isParent, edited}, nil
}

func CreateStoryRelationship(log *logger.BLogger, createReq CreateStoryRelationshipReq) (*StoryRelationship, error) {
	if createReq.StoryIDA == "" || createReq.StoryIDB == "" || createReq.Relation == "" {
		log.Error("createStoryRelationship: parameter(s) blank")
		return nil, InputError{}
	}

	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id int
	var storyIDA, storyIDB, relation string
	var cAt time.Time

	err = conn.QueryRow(context.Background(),
		`INSERT INTO story_relationships (
				story_id_a,
				story_id_b,
				relation
			) VALUES (
				$1,
				$2,
				$3
			) RETURNING
				id,
				created_at,
				story_id_a,
				story_id_b,
				relation`,
		createReq.StoryIDA,
		createReq.StoryIDB,
		createReq.Relation,
	).Scan(&id, &cAt, &storyIDA, &storyIDB, &relation)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &StoryRelationship{id, cAt, storyIDA, storyIDB, relation}, nil
}

func DestroyStoryRelationshipByID(log *logger.BLogger, destroyReq DestroyStoryRelationshipByIDReq) error {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return err
	}
	defer conn.Close(context.Background())

	_, err = conn.Exec(context.Background(),
		`DELETE FROM story_relationships
				WHERE
				id = $1
			;`,
		destroyReq.ID,
	)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return err
	}

	return nil
}

func GetStoryRelationships(log *logger.BLogger) ([]StoryRelationship, error) {
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
				story_id_a,
				story_id_b,
				relation
				FROM story_relationships`,
	)
	if err != nil {
		log.Errorf("Query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var storyRelationships = []StoryRelationship{}
	for rows.Next() {
		var id int
		var storyIDA, storyIDB, relation string
		var cAt time.Time
		rows.Scan(&id, &cAt, &storyIDA, &storyIDB, &relation)
		storyRelationships = append(storyRelationships, StoryRelationship{id, cAt, storyIDA, storyIDB, relation})
	}
	if rows.Err() != nil {
		log.Errorf("Query failed: %v", rows.Err())
		return nil, rows.Err()
	}

	return storyRelationships, nil
}

func CreateSessionRecord(log *logger.BLogger, callerID, sessionID string, sessionCreatedAt, sessionLastAccessed time.Time) (*SessionRecord, error) {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return nil, err
	}
	defer conn.Close(context.Background())

	var id string
	var cAt, uAt time.Time

	err = conn.QueryRow(context.Background(),
		`INSERT INTO sessions (
				updated_at,
				caller_id,
				session_id,
				session_created_at,
				session_last_accessed
			) VALUES (
				CURRENT_TIMESTAMP,
				$1,
				$2,
				$3,
				$4
			) RETURNING
				id,
				created_at,
				updated_at`,
		callerID,
		sessionID,
		sessionCreatedAt,
		sessionLastAccessed,
		// lol hmmm not sure if rescaning into the variable is safe...
		// honestly I just wanna see if it works
	).Scan(&id, &cAt, &uAt)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return nil, err
	}

	return &SessionRecord{id, cAt, uAt, callerID, sessionID, sessionCreatedAt, sessionLastAccessed}, nil
}

func PutSessionLastAccessed(log *logger.BLogger, sessionID string, sessionLastAccessed time.Time) error {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return err
	}
	defer conn.Close(context.Background())

	_, err = conn.Exec(context.Background(),
		`UPDATE sessions SET
			updated_at = CURRENT_TIMESTAMP,
			session_last_accessed = $1,
			edited = true
			WHERE session_id = $2`,
		sessionLastAccessed,
		sessionID,
	)
	if err != nil {
		log.Errorf("conn.Exec failed: %v", err)
		return err
	}

	return nil
}
