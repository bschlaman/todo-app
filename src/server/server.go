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
	"github.com/bschlaman/todo-app/database"
	"github.com/bschlaman/todo-app/model"
	"github.com/sqids/sqids-go"
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
	Sqids       *sqids.Sqids
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
	s, _ := sqids.New(sqids.Options{Alphabet: os.Getenv("SQIDS_ALPHABET"), MinLength: 6})
	env = &Env{logger.New(mw), cfg, cwClient, os.Getenv("LOGIN_PW"), os.Getenv("CALLER_ID"), s}
	log = env.Log
}

func main() {
	registerHandlers()

	// Make sure we can connect to the database
	defer database.ClosePool()
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
	log.Infof("using caller sqids alphabet: %s", os.Getenv("SQIDS_ALPHABET"))

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
