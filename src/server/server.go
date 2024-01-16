package main

import (
	"context"
	"io"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/b-utils/pkg/utils"
	"github.com/bschlaman/todo-app/database"
	"github.com/bschlaman/todo-app/model"
)

// TODO: pull these from config table
const (
	serverName             string           = "TODO-APP-SERVER"
	logPath                string           = "logs/output.log"
	staticDir              string           = "dist"
	sprintDuration         time.Duration    = 24 * 14 * time.Hour
	sessionDuration        time.Duration    = 2 * time.Hour
	enableDebugSessionAPIs bool             = false
	metricNamespace        string           = "todo-app/api"
	createEntityIDKey      CustomContextKey = "createReqIDKey"
	getRequestBytesKey     CustomContextKey = "getReqKey"
	cacheTTLSeconds        int              = 2
	rootServerPath         string           = "/sprintboard"
)

// CustomContextKey is a type that represents
// context keys, of which happen to be strings
type CustomContextKey string

var serverStart = time.Now()

// Env stores global variables for dependence injection
type Env struct {
	Log         *logger.BLogger
	AWSCfg      aws.Config
	AWSCWClient *cloudwatch.Client
	LoginPw     string
	CallerID    string
	// future state: possibly store db connection here
}

var env *Env

// keeping this for convenience of use in the main package
// i.e. avoid e.Log
var log *logger.BLogger

var sessions map[string]model.SessionRecord

var cache *cacheStore

// APIType is a kind of enum for classifications of api calls
var APIType = struct {
	Util    string
	Auth    string
	Get     string
	GetMany string
	Put     string
	Create  string
	Destroy string
}{
	"Util",
	"Auth",
	"Get",
	"GetMany",
	"Put",
	"Create",
	"Destroy",
}

func init() {
	// log file
	file, err := os.OpenFile(path.Join("../..", logPath), os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}
	mw := io.MultiWriter(file, os.Stdout)

	// aws config and clients
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(err)
	}
	cwClient := cloudwatch.NewFromConfig(cfg)

	// init globals
	sessions = make(map[string]model.SessionRecord)
	cache = &cacheStore{items: make(map[string]*cacheItem)}
	env = &Env{logger.New(mw), cfg, cwClient, os.Getenv("LOGIN_PW"), os.Getenv("CALLER_ID")}
	log = env.Log
}

func main() {

	// special case handlers
	fs := http.FileServer(http.Dir(path.Join("../..", staticDir)))
	http.Handle("/", utils.LogReq(log)(sessionMiddleware(
		redirectRootPathMiddleware(
			matchIDRedirMiddleware(fs),
		),
	)))

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
		http.Handle(route.Path, utils.LogReqSimple(log)(
			// TODO (2022.11.30): chain middleware; don't nest
			cachingMiddleware(
				route.APIType,
				cache,
				logEventMiddleware(
					route.APIName,
					route.APIType,
					env.CallerID,
					putAPILatencyMetricMiddleware(
						route.APIName,
						route.APIType,
						incrementAPIMetricMiddleware(
							route.APIName,
							route.APIType,
							sessionMiddleware(enforceJSONHandler(route.Handler())),
						),
					),
				),
			)))
	}

	// Make sure we can connect to the database
	conn, err := database.GetPgxConn()
	if err != nil || conn.Ping(context.Background()) != nil {
		log.Fatal(err)
	}
	log.Infof("using db: %+v", database.PrintableConnDetails(conn.Config()))

	log.Infof("using aws region: %s", env.AWSCfg.Region)

	// Make sure we're authenticated with aws
	stsClient := sts.NewFromConfig(env.AWSCfg)
	res, err := stsClient.GetCallerIdentity(context.TODO(), &sts.GetCallerIdentityInput{})
	if err != nil {
		log.Fatal(err)
	}
	id := struct {
		Account string
		Arn     string
		UserID  string
	}{*res.Account, *res.Arn, *res.UserId}
	log.Infof("using aws creds: %+v", id)

	if env.CallerID == "" {
		log.Fatal("CALLER_ID env var not set")
	}
	log.Infof("using caller identity: %s", env.CallerID)

	// server startup event log
	serverStartDuration := time.Since(serverStart)
	logEventApplicationStartup(log, serverStartDuration, env.CallerID)
	log.Infof("server start duration: %s", serverStartDuration)

	// Start the server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		log.Fatal("SERVER_PORT env var not set")
	}
	log.Info("starting http server on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
