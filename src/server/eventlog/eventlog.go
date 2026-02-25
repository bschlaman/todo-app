package eventlog

import (
	"context"
	"net/http"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/b-utils/pkg/utils"
	"github.com/bschlaman/todo-app/database"
	"github.com/bschlaman/todo-app/model"
)

// Recorder persists application event logs to the database.
type Recorder struct {
	log *logger.BLogger
}

// NewRecorder creates a new event log Recorder.
func NewRecorder(log *logger.BLogger) *Recorder {
	return &Recorder{log: log}
}

// LogEvent inserts an API event into the events table.
func (r *Recorder) LogEvent(eventRecord model.EventRecord) error {
	conn, err := database.GetPgxConn()
	if err != nil {
		r.log.Errorf("unable to connect to database: %v", err)
		return err
	}
	defer conn.Release()

	_, err = conn.Exec(context.Background(),
		`INSERT INTO events (
				caller_id,
				action,
				action_type,
				create_entity_id,
				get_response_bytes,
				latency
			) VALUES (
				$1,
				$2,
				$3,
				$4,
				$5,
				$6
			);`,
		eventRecord.CallerID,
		eventRecord.ApiName,
		eventRecord.ApiType,
		eventRecord.CreateEntityID,
		eventRecord.GetResponseBytes,
		eventRecord.Latency,
	)
	if err != nil {
		r.log.Errorf("Exec failed: %v", err)
		return err
	}

	return nil
}

func (rec *Recorder) Middleware(callerID, apiName, apiType string, createEntityIDKey, getRequestBytesKey any) utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			h.ServeHTTP(w, r)

			// TODO (2022.12.01): this results in 0 value strings / ints
			// being sent to the db - figure out a better way
			createEntityID, _ := r.Context().Value(createEntityIDKey).(string)

			getRequestBytes, _ := r.Context().Value(getRequestBytesKey).(int)

			go rec.LogEvent(model.EventRecord{CallerID: callerID, ApiName: apiName, ApiType: apiType, CreateEntityID: &createEntityID, GetResponseBytes: &getRequestBytes, Latency: time.Since(start)})
		})
	}
}

// LogApplicationStartup records a server startup event.
func (r *Recorder) LogApplicationStartup(latency time.Duration, callerID string) error {
	return r.LogEvent(model.EventRecord{CallerID: callerID, ApiName: "AppStartup", ApiType: "Util", CreateEntityID: nil, GetResponseBytes: nil, Latency: latency})
}
