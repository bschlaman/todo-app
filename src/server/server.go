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
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/todo-app/cache"
	"github.com/bschlaman/todo-app/database"
	"github.com/bschlaman/todo-app/eventlog"
	"github.com/bschlaman/todo-app/metrics"
	"github.com/bschlaman/todo-app/session"
	"github.com/bschlaman/todo-app/storage"
	"github.com/sqids/sqids-go"
)

// TODO: pull these from config table
const (
	serverName      string        = "TODO-APP-SERVER"
	logPath         string        = "logs/output.log"
	staticDirName   string        = "dist"
	sprintDuration  time.Duration = 24 * 14 * time.Hour
	sessionDuration time.Duration = 2 * time.Hour
	// I used to use this const table as a config and changed it in code
	enableDebugSessionAPIs bool             = false
	metricNamespace        string           = "todo-app/api"
	createEntityIDKey      CustomContextKey = "createReqIDKey"
	getRequestBytesKey     CustomContextKey = "getReqKey"
	cacheTTL               time.Duration    = 2 * time.Second
	devModeCacheTTL        time.Duration    = 5 * time.Minute
	rootServerPath         string           = "/sprintboard"
	uploadsDir                              = "uploads"
	maxUploadSize                           = 10 << 20 // 10 MB
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
	S3Uploader  *storage.S3Uploader
	LoginPw     string
	CallerID    string
	Sqids       *sqids.Sqids
	DevMode     bool
	// future state: possibly store db connection here
}

var env *Env

// keeping this for convenience of use in the main package
// i.e. avoid e.Log
var log *logger.BLogger

var sessionManager *session.Manager

var metricsPublisher *metrics.Publisher

var eventRecorder *eventlog.Recorder

var apiCache *cache.Store

// APIType is a kind of enum for classifications of api calls
var APIType = struct {
	Util    string
	Auth    string
	Get     string
	GetMany string
	Put     string
	Create  string
	Destroy string
	Upload  string
}{
	"Util",
	"Auth",
	"Get",
	"GetMany",
	"Put",
	"Create",
	"Destroy",
	"Upload",
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
	s3Client := s3.NewFromConfig(cfg)
	s3Uploader, err := storage.NewS3Uploader(
		s3Client,
		os.Getenv("UPLOADS_S3_BUCKET"),
		os.Getenv("UPLOADS_S3_KEY_PREFIX"),
		15*time.Second,
	)
	if err != nil {
		panic(err)
	}

	// init globals
	l := logger.New(mw)
	sessionManager = session.NewManager(l)
	metricsPublisher = metrics.NewPublisher(cwClient, metricNamespace, l)
	eventRecorder = eventlog.NewRecorder(l)
	devMode := false
	cttl := cacheTTL
	if os.Getenv("DEV_MODE") == "true" {
		cttl = devModeCacheTTL
		devMode = true
	}
	apiCache = cache.NewStore(cttl)
	s, _ := sqids.New(sqids.Options{Alphabet: os.Getenv("SQIDS_ALPHABET"), MinLength: 6})
	env = &Env{l, cfg, cwClient, s3Uploader, os.Getenv("LOGIN_PW"), os.Getenv("CALLER_ID"), s, devMode}
	log = env.Log
}

func main() {
	defer sessionManager.Stop()
	defer database.ClosePool()
	// Make sure we can connect to the database
	conn, err := database.GetPgxConn()
	if err != nil || conn.Ping(context.Background()) != nil {
		log.Fatal(err)
	}
	defer conn.Release()
	log.Infof("using db: %+v", database.PrintableConnDetails(conn.Conn().Config()))

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
	if os.Getenv("SQIDS_ALPHABET") == "" {
		log.Fatal("SQIDS_ALPHABET env var not set")
	}
	if env.DevMode {
		log.Info("⚠️ Heads up!  DEV_MODE is enabled ⚠️")
	}

	// register handlers
	registerStaticAssetHandlers()
	registerAPIHandlers()

	// server startup event log
	serverStartDuration := time.Since(serverStart)
	eventRecorder.LogApplicationStartup(serverStartDuration, env.CallerID)
	log.Infof("server start duration: %s", serverStartDuration)

	// Start the server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		log.Fatal("SERVER_PORT env var not set")
	}
	log.Info("starting http server on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
