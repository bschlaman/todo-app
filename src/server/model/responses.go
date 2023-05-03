package model

type CreateEntityResponse struct {
	ID string `json:"id"`
}

type CreateCommentResponse struct {
	Comment Comment `json:"comment"`
}
