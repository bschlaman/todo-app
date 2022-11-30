package main

import (
	"context"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/todo-app/database"
)

func logEvent(log *logger.BLogger, latency time.Duration, apiName, apiType, callerId, referenceId string) error {
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
				reference_id,
				latency
			) VALUES (
				$1,
				$2,
				$3,
				$4,
				$5
			);`,
		callerId,
		apiName,
		apiType,
		referenceId,
		latency,
	)
	if err != nil {
		log.Errorf("Exec failed: %v", err)
		return err
	}

	return nil
}
