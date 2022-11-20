package database

import (
	"context"
	"os"
	"time"

	"github.com/jackc/pgx/v4"
)

type basicConnDetails struct {
	Host     string
	Port     uint16
	Database string
	User     string
}

func GetPgxConn() (*pgx.Conn, error) {
	// TODO (2022.11.19) possibly make this middleware and pass context
	// into this method from r.Context()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}
	return conn, nil
}

func PrintableConnDetails(cc *pgx.ConnConfig) basicConnDetails {
	return basicConnDetails{
		cc.Host, cc.Port, cc.Database, cc.User,
	}
}
