package model

import "time"

type Task struct {
	ID          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	StoryID     *string   `json:"story_id"`
	Edited      bool      `json:"edited"`
	BulkTask    bool      `json:"bulk_task"`
}

type Comment struct {
	ID        int       `json:"id"`
	TaskID    string    `json:"task_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Text      string    `json:"text"`
	Edited    bool      `json:"edited"`
}

type Tag struct {
	ID          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	IsParent    bool      `json:"is_parent"`
	Edited      bool      `json:"edited"`
}

type TagAssignment struct {
	ID        int       `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	TagID     string    `json:"tag_id"`
	StoryID   string    `json:"story_id"`
}

type Sprint struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Title     string    `json:"title"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	Edited    bool      `json:"edited"`
}

type Story struct {
	ID          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	SprintID    string    `json:"sprint_id"`
	Edited      bool      `json:"edited"`
}

type StoryRelationship struct {
	ID        int       `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	StoryIDA  string    `json:"story_id_a"`
	StoryIDB  string    `json:"story_id_b"`
	Relation  string    `json:"relation"`
}

// SessionRecord contains a Session which is used to manage logged in users
// The struct is so named, since this is really a representation of what's in the database
// and contains record-level information (e.g. UpdatedAt) which is not used for business logic
type SessionRecord struct {
	ID                  string    `json:"id"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	CallerID            string    `json:"caller_id"`
	SessionID           string    `json:"session_id"`
	SessionCreatedAt    time.Time `json:"session_created_at"`
	SessionLastAccessed time.Time `json:"session_last_accessed"`
}

type ServerConfigRow struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	Key       string    `json:"key"`
	Value     string    `json:"value"`
}

// TODO: this is unused in favor of a map[string]interface{}
type ServerConfig struct {
	ServerName            string `json:"server_name"`
	SprintDurationSeconds int    `json:"sprint_duration_seconds"`
	SprintTitleMaxLen     int    `json:"sprint_title_max_len"`
	StoryTitleMaxLen      int    `json:"story_title_max_len"`
	TaskTitleMaxLen       int    `json:"task_title_max_len"`
	StoryDescMaxLen       int    `json:"story_desc_max_len"`
	TaskDescMaxLen        int    `json:"task_desc_max_len"`
	CommentMaxLen         int    `json:"comment_max_len"`
}
