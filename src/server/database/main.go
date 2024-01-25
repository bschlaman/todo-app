package database

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type basicConnDetails struct {
	Host     string
	Port     uint16
	Database string
	User     string
}

var (
	pool *pgxpool.Pool
	once sync.Once
)

func getPgxPool() *pgxpool.Pool {
	// lazy initialization
	once.Do(
		func() {
			var err error
			// use ConnectConfig so I can specify values
			config, _ := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
			config.MaxConns = 4
			pool, err = pgxpool.ConnectConfig(context.Background(), config)
			if err != nil {
				fmt.Printf("[FATAL] could not establish a connection pool: %v", err)
				os.Exit(1)
			}
		},
	)
	return pool
}

func ClosePool() {
	if pool != nil {
		pool.Close()
		pool = nil
	}
}

func GetPgxConn() (*pgxpool.Conn, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, err := getPgxPool().Acquire(ctx)
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
