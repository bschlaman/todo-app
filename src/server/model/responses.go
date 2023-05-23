package model

// TODO (2023.05.22): is this even used?

type createCommentResponse struct {
	Comment Comment `json:"comment"`
}

type createTaskResponse struct {
	Task Task `json:"task"`
}

type createStoryResponse struct {
	Story Story `json:"story"`
}

type createSprintResponse struct {
	Sprint Sprint `json:"sprint"`
}

type createTagResponse struct {
	Tag Tag `json:"tag"`
}

type createTagAssignmentResponse struct {
	TagAssignment TagAssignment `json:"tag_assignment"`
}
