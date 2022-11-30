package main

import (
	"context"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/todo-app/database"
)

// TODO (2022.11.30): this should belong to the model
func logEvent(
	log *logger.BLogger,
	latency time.Duration,
	apiName, apiType, callerId string,
	createEntityId *string,
	getResponseBytes *int,
) error {
	conn, err := database.GetPgxConn()
	if err != nil {
		log.Errorf("unable to connect to database: %v", err)
		return err
	}
	defer conn.Close(context.Background())

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
		callerId,
		apiName,
		apiType,
		createEntityId,
		getResponseBytes,
		latency,
	)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return err
	}

	return nil
}

func logEventApplicationStartup(
	log *logger.BLogger,
	latency time.Duration,
	callerId string,
) error {
	return logEvent(log, latency, "AppStartup", "Util", callerId, nil, nil)
}
