package model

import "time"

type CreateTaskReq struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	StoryId     *string `json:"story_id"`  // ptr allows for null values
	BulkTask    *bool   `json:"bulk_task"` // ptr allows for null values
}

type CreateCommentReq struct {
	Text   string `json:"text"`
	TaskId string `json:"task_id"`
}

type PutStoryReq struct {
	Id          string `json:"id"`
	Status      string `json:"status"`
	Title       string `json:"title"`
	Description string `json:"description"`
	SprintId    string `json:"sprint_id"`
}

type PutTaskReq struct {
	Id          string  `json:"id"`
	Status      string  `json:"status"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	StoryId     *string `json:"story_id"`
}

type CreateSprintReq struct {
	Title     string    `json:"title"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}

type CreateStoryReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	SprintId    string `json:"sprint_id"`
}

type CreateTagAssignmentReq struct {
	TagId   string `json:"tag_id"`
	StoryId string `json:"story_id"`
}

// TODO (2023.01.22): this should be by Id
type DestroyTagAssignmentReq struct {
	TagId   string `json:"tag_id"`
	StoryId string `json:"story_id"`
}

type DestroyTagAssignmentByIdReq struct {
	Id int `json:"id"`
}

type CreateTagReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type CreateStoryRelationshipReq struct {
	StoryIdA string `json:"story_id_a"`
	StoryIdB string `json:"story_id_b"`
	Relation string `json:"relation"`
}

type DestroyStoryRelationshipByIdReq struct {
	Id int `json:"id"`
}
