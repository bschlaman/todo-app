package cache

import (
	"bytes"
	"net/http"
	"sync"
	"time"

	"github.com/bschlaman/b-utils/pkg/utils"
)

// Status represents whether a request was a cache hit, miss, or not cached.
type Status string

const (
	Hit     Status = "HIT"
	Miss    Status = "MISS"
	Skipped Status = "SKIP"
)

type item struct {
	value     []byte
	createdAt int64
}

// Store is a thread-safe in-memory cache with a configurable TTL.
type Store struct {
	sync.RWMutex
	items map[string]*item
	ttl   time.Duration
}

// NewStore creates a new cache Store with the given TTL.
func NewStore(ttl time.Duration) *Store {
	return &Store{
		items: make(map[string]*item),
		ttl:   ttl,
	}
}

// Get retrieves a cached value by key. Returns false if not found or expired.
func (s *Store) Get(key string) ([]byte, bool) {
	s.RLock()
	defer s.RUnlock()

	it, found := s.items[key]
	if !found {
		return nil, false
	}

	if time.Now().Unix() > it.createdAt+int64(s.ttl.Seconds()) {
		return nil, false
	}

	return it.value, true
}

// Set stores a value in the cache.
func (s *Store) Set(key string, value []byte) {
	s.Lock()
	defer s.Unlock()

	s.items[key] = &item{
		value:     value,
		createdAt: time.Now().Unix(),
	}
}

// ResponseWriter wraps http.ResponseWriter to track cache status.
type ResponseWriter struct {
	http.ResponseWriter
	StatusPtr *Status
}

// NewResponseWriter creates a ResponseWriter that tracks cache status.
func NewResponseWriter(w http.ResponseWriter, statusPtr *Status) *ResponseWriter {
	return &ResponseWriter{
		ResponseWriter: w,
		StatusPtr:      statusPtr,
	}
}

// responseRecorder captures the response body so it can be cached.
type responseRecorder struct {
	http.ResponseWriter
	body       *bytes.Buffer
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

// Middleware returns a caching middleware.
// If cacheable is false, the request is marked as Skipped and passed through.
// Otherwise it checks/populates the store.
func (s *Store) Middleware(cacheable bool) utils.Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			crw, ok := w.(*ResponseWriter)
			if !ok {
				h.ServeHTTP(w, r)
				return
			}

			if !cacheable {
				*crw.StatusPtr = Skipped
				h.ServeHTTP(w, r)
				return
			}

			cacheKey := r.URL.String()
			response, found := s.Get(cacheKey)

			if found {
				*crw.StatusPtr = Hit
				w.Header().Set("Content-Type", "application/json")
				w.Write(response)
				return
			}

			*crw.StatusPtr = Miss
			recorder := &responseRecorder{w, new(bytes.Buffer), http.StatusOK}
			h.ServeHTTP(recorder, r)

			if recorder.statusCode == http.StatusOK {
				s.Set(cacheKey, recorder.body.Bytes())
			}
		})
	}
}
