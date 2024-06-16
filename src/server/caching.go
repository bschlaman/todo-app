package main

import (
	"bytes"
	"net/http"
	"sync"
	"time"
)

type cacheItem struct {
	value     []byte
	createdAt int64
}

type cacheStore struct {
	sync.RWMutex
	items map[string]*cacheItem
}

func (cs *cacheStore) get(key string) ([]byte, bool) {
	cs.RLock()
	defer cs.RUnlock()

	item, found := cs.items[key]
	if !found {
		return nil, false
	}

	if time.Now().Unix() > item.createdAt+int64(cacheTTLSeconds) {
		return nil, false
	}

	return item.value, true
}

func (cs *cacheStore) set(key string, value []byte) {
	cs.Lock()
	defer cs.Unlock()

	cs.items[key] = &cacheItem{
		value:     value,
		createdAt: time.Now().Unix(),
	}
}

type responseRecorder struct {
	http.ResponseWriter
	body *bytes.Buffer
	// so I can limit caching to only 200 responses
	statusCode int
}

func (rr *responseRecorder) WriteHeader(code int) {
	rr.statusCode = code
	rr.ResponseWriter.WriteHeader(code)
}

func (rr *responseRecorder) Write(content []byte) (int, error) {
	rr.body.Write(content)
	return rr.ResponseWriter.Write(content)
}
