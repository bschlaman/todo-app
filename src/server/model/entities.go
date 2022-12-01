package model

import "time"

type Task struct {
	Id          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	StoryId     *string   `json:"story_id"`
	Edited      bool      `json:"edited"`
	BulkTask    bool      `json:"bulk_task"`
}

type Comment struct {
	Id        int       `json:"id"`
	TaskId    string    `json:"task_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Text      string    `json:"text"`
	Edited    bool      `json:"edited"`
}

type Tag struct {
	Id          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	IsParent    bool      `json:"is_parent"`
	Edited      bool      `json:"edited"`
}

type TagAssignment struct {
	Id        int       `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	TagId     string    `json:"tag_id"`
	StoryId   string    `json:"story_id"`
}

type Sprint struct {
	Id        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Title     string    `json:"title"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	Edited    bool      `json:"edited"`
}

type Story struct {
	Id          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	SprintId    string    `json:"sprint_id"`
	Edited      bool      `json:"edited"`
}

type ServerConfigRow struct {
	Id        string    `json:"id"`
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
