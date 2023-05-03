package model

import "time"

type CreateTaskReq struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	StoryID     *string `json:"story_id"`  // ptr allows for null values
	BulkTask    *bool   `json:"bulk_task"` // ptr allows for null values
}

type CreateCommentReq struct {
	Text   string `json:"text"`
	TaskID string `json:"task_id"`
}

type PutStoryReq struct {
	ID          string `json:"id"`
	Status      string `json:"status"`
	Title       string `json:"title"`
	Description string `json:"description"`
	SprintID    string `json:"sprint_id"`
}

type PutTaskReq struct {
	ID          string  `json:"id"`
	Status      string  `json:"status"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	StoryID     *string `json:"story_id"`
}

type CreateSprintReq struct {
	Title     string    `json:"title"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}

type CreateStoryReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	SprintID    string `json:"sprint_id"`
}

type CreateTagAssignmentReq struct {
	TagID   string `json:"tag_id"`
	StoryID string `json:"story_id"`
}

// TODO (2023.01.22): this should be by ID
type DestroyTagAssignmentReq struct {
	TagID   string `json:"tag_id"`
	StoryID string `json:"story_id"`
}

type DestroyTagAssignmentByIDReq struct {
	ID int `json:"id"`
}

type CreateTagReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type CreateStoryRelationshipReq struct {
	StoryIDA string `json:"story_id_a"`
	StoryIDB string `json:"story_id_b"`
	Relation string `json:"relation"`
}

type DestroyStoryRelationshipByIDReq struct {
	ID int `json:"id"`
}
