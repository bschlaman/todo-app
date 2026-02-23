package eventlog

import (
	"context"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/todo-app/database"
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
func (r *Recorder) LogEvent(
	latency time.Duration,
	apiName, apiType, callerID string,
	createEntityID *string,
	getResponseBytes *int,
) error {
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
		callerID,
		apiName,
		apiType,
		createEntityID,
		getResponseBytes,
		latency,
	)
	if err != nil {
		r.log.Errorf("Exec failed: %v", err)
		return err
	}

	return nil
}

// LogApplicationStartup records a server startup event.
func (r *Recorder) LogApplicationStartup(latency time.Duration, callerID string) error {
	return r.LogEvent(latency, "AppStartup", "Util", callerID, nil, nil)
}
