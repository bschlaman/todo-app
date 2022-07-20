package main

import (
	"context"
	"os"

	"github.com/jackc/pgx/v4"
)

func getPgxConn() (*pgx.Conn, error) {
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}
	return conn, nil
}
