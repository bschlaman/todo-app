package main

import (
	"net/http"
	"path"

	"github.com/bschlaman/b-utils/pkg/utils"
)

func registerHandlers() {
	// special case handlers
	fs := http.FileServer(http.Dir(path.Join("../..", staticDir)))
	http.Handle("/", chainMiddlewares(fs, []utils.Middleware{
		utils.LogReq(log),
		sessionMiddleware(),
		redirectRootPathMiddleware(),
		matchIDRedirMiddleware(),
	}...))

	if enableDebugSessionAPIs {
		http.Handle("/api/clear_sessions", clearSessionsHandle())
		http.Handle("/api/get_sessions", getSessionsHandle())
	}

	// TODO (2022.11.29): should this mapping be part of config, or at the very least the model?
	apiRoutes := []struct {
		Path    string
		Handler func() http.Handler
		APIName string
		APIType string
	}{
		{"/api/echo", utils.EchoHandle, "Echo", APIType.Util},
		{"/api/echodelay", utils.EchoDelayHandle, "EchoDelay", APIType.Util},
		{"/api/login", loginHandle, "Login", APIType.Auth},
		{"/api/check_session", checkSessionHandle, "CheckSession", APIType.Auth},
		{"/api/get_config", getConfigHandle, "GetConfig", APIType.Get},
		// tasks
		{"/api/get_tasks", getTasksHandle, "GetTasks", APIType.GetMany},
		{"/api/get_task", getTaskByIDHandle, "GetTaskByID", APIType.Get},
		{"/api/put_task", putTaskHandle, "PutTask", APIType.Put},
		{"/api/create_task", createTaskHandle, "CreateTask", APIType.Create},
		// comments
		{"/api/create_comment", createCommentHandle, "CreateComment", APIType.Create},
		{"/api/put_comment", putCommentHandle, "PutComment", APIType.Put},
		{"/api/get_comments_by_task_id", getCommentsByTaskIDHandle, "GetCommentsByTaskID", APIType.GetMany},
		// stories
		{"/api/get_stories", getStoriesHandle, "GetStories", APIType.GetMany},
		{"/api/get_story", getStoryByIDHandle, "GetStoryByID", APIType.Get},
		{"/api/create_story", createStoryHandle, "CreateStory", APIType.Create},
		{"/api/put_story", putStoryHandle, "PutStory", APIType.Put},
		// sprints
		{"/api/get_sprints", getSprintsHandle, "GetSprints", APIType.GetMany},
		{"/api/create_sprint", createSprintHandle, "CreateSprint", APIType.Create},
		// tag_assignments
		{"/api/get_tag_assignments", getTagAssignmentsHandle, "GetTagAssignments", APIType.GetMany},
		{"/api/create_tag_assignment", createTagAssignmentHandle, "CreateTagAssignment", APIType.Create},
		{"/api/destroy_tag_assignment", destroyTagAssignmentHandle, "DestroyTagAssignment", APIType.Destroy},
		{"/api/destroy_tag_assignment_by_id", destroyTagAssignmentByIDHandle, "DestroyTagAssignmentByID", APIType.Destroy},
		// tags
		{"/api/get_tags", getTagsHandle, "GetTags", APIType.GetMany},
		{"/api/create_tag", createTagHandle, "CreateTag", APIType.Create},
		// story_relationships
		{"/api/get_story_relationships", getStoryRelationshipsHandle, "GetStoryRelationships", APIType.GetMany},
		{"/api/create_story_relationship", createStoryRelationshipHandle, "CreateStoryRelationship", APIType.Create},
		{"/api/destroy_story_relationship", destroyStoryRelationshipByIDHandle, "DestroyStoryRelationship", APIType.Destroy},
	}

	for _, route := range apiRoutes {
		middlewares := []utils.Middleware{
			utils.LogReqSimple(log),
			cachingMiddleware(route.APIType, cache),
			logEventMiddleware(route.APIName, route.APIType, env.CallerID),
			sessionMiddleware(),
			putAPILatencyMetricMiddleware(route.APIName, route.APIType),
			incrementAPIMetricMiddleware(route.APIName, route.APIType),
			enforceJSONMiddleware(),
		}
		http.Handle(route.Path, chainMiddlewares(route.Handler(), middlewares...))
	}
}
