package model

import "time"

type CreateTaskReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	StoryId     string `json:"story_id"`
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
	Id          string `json:"id"`
	Status      string `json:"status"`
	Title       string `json:"title"`
	Description string `json:"description"`
	StoryId     string `json:"story_id"`
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

type DestroyTagAssignmentReq struct {
	TagId   string `json:"tag_id"`
	StoryId string `json:"story_id"`
}

type CreateTagReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}
