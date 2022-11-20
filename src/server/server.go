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
	"github.com/google/uuid"
)

// TODO: pull these from config table
const (
	serverName           string        = "TODO-APP-SERVER"
	logPath              string        = "logs/output.log"
	staticDir            string        = "dist"
	sprintDuration       time.Duration = 24 * 14 * time.Hour
	sessionDuration      time.Duration = 2 * time.Hour
	allowClearSessionAPI bool          = false
	metricNamespace      string        = "todo-app/api"
)

// global variables for dependence injection
type Env struct {
	Log         *logger.BLogger
	AWSCfg      aws.Config
	AWSCWClient *cloudwatch.Client
	LoginPw     string
	// future state: possibly store db connection here
}

var env *Env

// keeping this for convenience of use in the main package
// i.e. avoid e.Log
var log *logger.BLogger

type Session struct {
	Id        string
	CreatedAt time.Time
}

var sessions map[string]Session

var ApiType = struct {
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

func createSaveNewSession() string {
	id := uuid.NewString()
	sessions[id] = Session{id, time.Now()}
	return id
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
	sessions = make(map[string]Session)
	env = &Env{logger.New(mw), cfg, cwClient, os.Getenv("LOGIN_PW")}
	log = env.Log
}

func main() {

	// special case handlers
	fs := http.FileServer(http.Dir(path.Join("../..", staticDir)))
	http.Handle("/", sessionMiddleware(
		redirectRootPathMiddleware(
			matchIdRedirMiddleware(fs),
		),
	))

	if allowClearSessionAPI {
		http.Handle("/api/clear_sessions", clearSessionsHandle())
	}

	apiRoutes := []struct {
		Path    string
		Handler func() http.Handler
		ApiName string
		ApiType string
	}{
		{"/api/echo", utils.EchoHandle, "Echo", ApiType.Util},
		{"/api/echodelay", utils.EchoDelayHandle, "EchoDelay", ApiType.Util},
		{"/api/login", loginHandle, "Login", ApiType.Auth},
		{"/api/check_session", checkSessionHandle, "CheckSession", ApiType.Auth},
		{"/api/get_config", getConfigHandle, "GetConfig", ApiType.Get},
		{"/api/get_tasks", getTasksHandle, "GetTasks", ApiType.GetMany},
		{"/api/get_task", getTaskByIdHandle, "GetTaskById", ApiType.Get},
		{"/api/put_task", putTaskHandle, "PutTask", ApiType.Put},
		{"/api/put_story", putStoryHandle, "PutStory", ApiType.Put},
		{"/api/create_task", createTaskHandle, "CreateTask", ApiType.Create},
		{"/api/create_comment", createCommentHandle, "CreateComment", ApiType.Create},
		{"/api/get_comments_by_task_id", getCommentsByTaskIdHandle, "GetCommentsByTaskId", ApiType.GetMany},
		{"/api/get_stories", getStoriesHandle, "GetStories", ApiType.GetMany},
		{"/api/get_story", getStoryByIdHandle, "GetStoryById", ApiType.Get},
		{"/api/create_story", createStoryHandle, "CreateStory", ApiType.Create},
		{"/api/get_sprints", getSprintsHandle, "GetSprints", ApiType.GetMany},
		{"/api/create_sprint", createSprintHandle, "CreateSprint", ApiType.Create},
		{"/api/create_tag_assignment", createTagAssignmentHandle, "CreateTagAssignment", ApiType.Create},
		{"/api/destroy_tag_assignment", destroyTagAssignmentHandle, "DestroyTagAssignment", ApiType.Destroy},
		{"/api/get_tags", getTagsHandle, "GetTags", ApiType.GetMany},
		{"/api/get_tag_assignments", getTagAssignmentsHandle, "GetTagAssignments", ApiType.GetMany},
		{"/api/create_tag", createTagHandle, "CreateTag", ApiType.Create},
	}
	for _, route := range apiRoutes {
		http.Handle(route.Path, utils.LogReq(log)(
			putAPILatencyMetricMiddleware(
				incrementAPIMetricMiddleware(
					sessionMiddleware(route.Handler()),
					route.ApiName,
					route.ApiType,
				),
				route.ApiName,
				route.ApiType,
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
		UserId  string
	}{*res.Account, *res.Arn, *res.UserId}
	log.Infof("using aws creds: %+v", id)

	// Start the server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		log.Fatal("SERVER_PORT env var not set")
	}
	log.Info("starting http server on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
