package session

import (
	"sync"
	"time"

	"github.com/bschlaman/b-utils/pkg/logger"
	"github.com/bschlaman/todo-app/model"
)

// Manager provides thread-safe session management with batched database updates
type Manager struct {
	log      *logger.BLogger
	sessions map[string]model.SessionRecord
	mutex    sync.RWMutex

	// For batched updates
	pendingUpdates map[string]time.Time
	updateMutex    sync.Mutex
	updateTicker   *time.Ticker
	stopChan       chan struct{}
}

// NewManager creates a new Manager instance
func NewManager(log *logger.BLogger) *Manager {
	sm := &Manager{
		log:            log,
		sessions:       make(map[string]model.SessionRecord),
		pendingUpdates: make(map[string]time.Time),
		stopChan:       make(chan struct{}),
	}

	// Start batch update routine (every 30 seconds)
	sm.updateTicker = time.NewTicker(30 * time.Second)
	go sm.batchUpdateRoutine()

	return sm
}

// GetSession retrieves a session by cookie value (thread-safe)
func (sm *Manager) GetSession(cookieValue string) (model.SessionRecord, bool) {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()

	session, exists := sm.sessions[cookieValue]
	return session, exists
}

// SetSession stores a session (thread-safe)
func (sm *Manager) SetSession(cookieValue string, session model.SessionRecord) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	sm.sessions[cookieValue] = session
}

// UpdateLastAccessed updates the session's last accessed time and queues a database update
func (sm *Manager) UpdateLastAccessed(cookieValue string) (time.Time, time.Time, bool) {
	sm.mutex.Lock()
	session, exists := sm.sessions[cookieValue]
	if !exists {
		sm.mutex.Unlock()
		return time.Time{}, time.Time{}, false
	}

	prevLastAccessed := session.SessionLastAccessed
	session.SessionLastAccessed = time.Now()
	sm.sessions[cookieValue] = session
	sm.mutex.Unlock()

	// Only queue database update if enough time has passed (10 seconds)
	if session.SessionLastAccessed.Sub(prevLastAccessed) > 10*time.Second {
		sm.queueDBUpdate(session.SessionID, session.SessionLastAccessed)
		sm.log.Infof("queued SessionLastAccessed update for session: %s", session.SessionID)
	}

	return prevLastAccessed, session.SessionLastAccessed, true
}

// queueDBUpdate queues a session for database update
func (sm *Manager) queueDBUpdate(sessionID string, lastAccessed time.Time) {
	sm.updateMutex.Lock()
	defer sm.updateMutex.Unlock()

	sm.pendingUpdates[sessionID] = lastAccessed
}

// batchUpdateRoutine runs periodically to flush pending updates to database
func (sm *Manager) batchUpdateRoutine() {
	for {
		select {
		case <-sm.updateTicker.C:
			sm.flushPendingUpdates()
		case <-sm.stopChan:
			return
		}
	}
}

// flushPendingUpdates sends all pending updates to database in a single transaction
func (sm *Manager) flushPendingUpdates() {
	sm.updateMutex.Lock()
	updates := sm.pendingUpdates
	sm.pendingUpdates = make(map[string]time.Time)
	sm.updateMutex.Unlock()

	if len(updates) == 0 {
		return
	}

	sm.log.Infof("flushing %d pending session updates to database", len(updates))

	go func() {
		err := model.BatchUpdateSessionsLastAccessed(sm.log, updates)
		if err != nil {
			sm.log.Errorf("failed to batch update sessions: %v", err)
		}
	}()
}

// Stop gracefully shuts down the Manager
func (sm *Manager) Stop() {
	close(sm.stopChan)
	sm.updateTicker.Stop()

	// Flush any remaining updates before shutting down
	sm.flushPendingUpdates()
}

// GetSessionCount returns the current number of sessions in memory
func (sm *Manager) GetSessionCount() int {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()

	return len(sm.sessions)
}

// GetAllSessions returns all sessions in memory (for debugging)
func (sm *Manager) GetAllSessions() []model.SessionRecord {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()

	var sessionValues []model.SessionRecord
	for _, s := range sm.sessions {
		sessionValues = append(sessionValues, s)
	}
	return sessionValues
}

// ClearAllSessions removes all sessions from memory (for debugging)
func (sm *Manager) ClearAllSessions() {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	sm.sessions = make(map[string]model.SessionRecord)
	sm.log.Info("cleared all sessions from memory")
}
