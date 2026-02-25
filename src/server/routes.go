package main

import (
	"net/http"
	"path/filepath"

	"github.com/bschlaman/b-utils/pkg/utils"
)

// probably a more correct name than "Asset"...
func registerStaticAssetHandlers() {
	staticDir := http.Dir(filepath.Join("../..", staticDirName))
	fs := http.FileServer(staticDir)
	http.Handle("/", chainMiddlewares(fs, []utils.Middleware{
		utils.LogReq(log),
		sessionMiddleware(),
		redirectRootPathMiddleware(),
		matchIDRedirMiddleware(),
		spaRewriteMiddleware(string(staticDir)),
	}...))

	// Serve uploaded files
	uploadsFS := http.FileServer(http.Dir(filepath.Join("../..", uploadsDir)))
	http.Handle("/uploads/", chainMiddlewares(
		http.StripPrefix("/uploads/", uploadsFS),
		[]utils.Middleware{
			utils.LogReq(log),
			sessionMiddleware(),
		}...))
}

func registerAPIHandlers() {
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
		// uploads
		{"/api/upload_image", uploadImageHandle, "UploadImage", APIType.Upload},
	}

	for _, route := range apiRoutes {
		middlewares := []utils.Middleware{
			improvedLogReqMiddleware(log),
			apiCache.Middleware(route.APIType == APIType.Get || route.APIType == APIType.GetMany),
			eventRecorder.Middleware(env.CallerID, route.APIName, route.APIType, createEntityIDKey, getRequestBytesKey),
			sessionMiddleware(),
			putAPILatencyMetricMiddleware(route.APIName, route.APIType),
			incrementAPIMetricMiddleware(route.APIName, route.APIType),
			chaosMiddleware(env.DevMode, 0.2, route.APIType),
			enforceMediaTypeMiddleware(),
		}
		http.Handle(route.Path, chainMiddlewares(route.Handler(), middlewares...))
	}
}
