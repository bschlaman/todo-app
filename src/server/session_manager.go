package main

import (
	"sync"
	"time"

	"github.com/bschlaman/todo-app/model"
)

// SessionManager provides thread-safe session management with batched database updates
type SessionManager struct {
	sessions map[string]model.SessionRecord
	mutex    sync.RWMutex

	// For batched updates
	pendingUpdates map[string]time.Time
	updateMutex    sync.Mutex
	updateTicker   *time.Ticker
	stopChan       chan struct{}
}

// NewSessionManager creates a new SessionManager instance
func NewSessionManager() *SessionManager {
	sm := &SessionManager{
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
func (sm *SessionManager) GetSession(cookieValue string) (model.SessionRecord, bool) {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()
	
	session, exists := sm.sessions[cookieValue]
	return session, exists
}

// SetSession stores a session (thread-safe)
func (sm *SessionManager) SetSession(cookieValue string, session model.SessionRecord) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	
	sm.sessions[cookieValue] = session
}

// UpdateLastAccessed updates the session's last accessed time and queues a database update
func (sm *SessionManager) UpdateLastAccessed(cookieValue string) (time.Time, time.Time, bool) {
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
		log.Infof("queued SessionLastAccessed update for session: %s", session.SessionID)
	}

	return prevLastAccessed, session.SessionLastAccessed, true
}

// queueDBUpdate queues a session for database update
func (sm *SessionManager) queueDBUpdate(sessionID string, lastAccessed time.Time) {
	sm.updateMutex.Lock()
	defer sm.updateMutex.Unlock()
	
	sm.pendingUpdates[sessionID] = lastAccessed
}

// batchUpdateRoutine runs periodically to flush pending updates to database
func (sm *SessionManager) batchUpdateRoutine() {
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
func (sm *SessionManager) flushPendingUpdates() {
	sm.updateMutex.Lock()
	updates := sm.pendingUpdates
	sm.pendingUpdates = make(map[string]time.Time)
	sm.updateMutex.Unlock()

	if len(updates) == 0 {
		return
	}

	log.Infof("flushing %d pending session updates to database", len(updates))
	
	go func() {
		err := model.BatchUpdateSessionsLastAccessed(env.Log, updates)
		if err != nil {
			log.Errorf("failed to batch update sessions: %v", err)
		}
	}()
}

// Stop gracefully shuts down the SessionManager
func (sm *SessionManager) Stop() {
	close(sm.stopChan)
	sm.updateTicker.Stop()
	
	// Flush any remaining updates before shutting down
	sm.flushPendingUpdates()
}

// GetSessionCount returns the current number of sessions in memory
func (sm *SessionManager) GetSessionCount() int {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()
	
	return len(sm.sessions)
}

// GetAllSessions returns all sessions in memory (for debugging)
func (sm *SessionManager) GetAllSessions() []model.SessionRecord {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()
	
	var sessionValues []model.SessionRecord
	for _, s := range sm.sessions {
		sessionValues = append(sessionValues, s)
	}
	return sessionValues
}

// ClearAllSessions removes all sessions from memory (for debugging)
func (sm *SessionManager) ClearAllSessions() {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	
	sm.sessions = make(map[string]model.SessionRecord)
	log.Info("cleared all sessions from memory")
}
