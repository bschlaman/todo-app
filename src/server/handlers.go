package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"

	"github.com/bschlaman/todo-app/model"
	"github.com/google/uuid"
)

// TODO (2023.09.29): this function does a lot - time to split out some behavior?
func loginHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		pass := r.FormValue("pass")

		if pass != env.LoginPw {
			log.Infof("incorrect pw: %v", pass)
			http.Error(w, "incorrect pw", http.StatusUnauthorized)
			return
		}

		// first, parse the Referer and ref.  If those don't work, return right away
		u, err := url.Parse(r.Header.Get("Referer"))
		if err != nil {
			log.Infof("invalid ref url: %v", r.Header.Get("Referer"))
			http.Error(w, "invalid ref url", http.StatusBadRequest)
			return
		}
		ref, err := url.PathUnescape(u.Query().Get("ref"))
		log.Infof("u: %s, ref: %s", u, ref)
		if err != nil {
			log.Infof("invalid ref url: %v", r.Header.Get("Referer"))
			http.Error(w, "invalid ref url", http.StatusBadRequest)
			return
		}
		// redirecting to url = "" causes weirdness
		if ref == "" {
			ref = "/"
		}

		// create a new SessionRecord object and save it in the db
		log.Info("login successful, creating session")
		now := time.Now() // keep it atomic!
		sessionRecord, err := model.CreateSessionRecord(log, env.CallerID, uuid.NewString(), now, now)
		if err != nil {
			log.Errorf("could not create session: %v", err)
			http.Error(w, "could not create session", http.StatusInternalServerError)
			return
		}
		// save the session in memory
		sessionManager.SetSession(sessionRecord.SessionID, *sessionRecord)

		cookie := &http.Cookie{
			Name:     "session",
			Value:    sessionRecord.SessionID,
			SameSite: http.SameSiteDefaultMode,
			Path:     "/",
		}
		http.SetCookie(w, cookie)
		log.Infof("setting cookie: %v", cookie)

		http.Redirect(w, r, ref, http.StatusSeeOther)
	})
}

func checkSessionHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// if the call makes it this far, we know the session is valid
		cookie, _ := r.Cookie("session")
		s, _ := sessionManager.GetSession(cookie.Value)

		timeRemaining := s.SessionCreatedAt.Add(sessionDuration).Sub(time.Now())

		js, err := json.Marshal(&struct {
			TimeRemainingSeconds int `json:"session_time_remaining_seconds"`
		}{
			int(timeRemaining.Seconds()),
		})
		if err != nil {
			http.Error(w, "error getting session", http.StatusInternalServerError)
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

// getSessionsHandle returns the sessions in memory.
// Used for debugging
func getSessionsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionValues := sessionManager.GetAllSessions()

		js, err := json.Marshal(sessionValues)
		if err != nil {
			http.Error(w, "error marshalling sessions", http.StatusInternalServerError)
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

// clearSessionsHandle clears the sessions in memory.
// Used for debugging
func clearSessionsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionManager.ClearAllSessions()
		js, err := json.Marshal(&struct {
			Message string `json:"message"`
		}{
			"ok",
		})
		if err != nil {
			http.Error(w, "error clearing sessions", http.StatusInternalServerError)
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getConfigHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serverConfig, err := model.GetConfig(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(serverConfig)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getCommentsByTaskIDHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		taskID := r.URL.Query().Get("id")

		comments, err := model.GetCommentsByTaskID(env.Log, taskID)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(comments)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getTaskByIDHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		taskID := r.URL.Query().Get("id")

		// I want to still be able to get entities
		// by the old UUIDv4 since I have sometimes
		// comented them and linked to them.
		var task *model.Task
		var err error
		if looksLikeUUIDv4(taskID) {
			log.Infof("id looks like UUIDv4: %s", taskID)
			task, err = model.GetTaskByID(env.Log, taskID)
		} else {
			task, err = model.GetTaskBySQID(env.Log, taskID)
		}

		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(task)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getStoryByIDHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		storyID := r.URL.Query().Get("id")

		// I want to still be able to get entities
		// by the old UUIDv4 since I have sometimes
		// comented them and linked to them.
		var story *model.Story
		var err error
		if looksLikeUUIDv4(storyID) {
			log.Infof("id looks like UUIDv4: %s", storyID)
			story, err = model.GetStoryByID(env.Log, storyID)
		} else {
			story, err = model.GetStoryBySQID(env.Log, storyID)
		}

		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(story)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getTasksHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tasks, err := model.GetTasks(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(tasks)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createTaskHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateTaskReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		task, err := model.CreateTask(env.Log, env.Sqids, createReq)
		if err != nil {
			log.Errorf("task creation failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), createEntityIDKey, task.ID))

		js, err := json.Marshal(task)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createCommentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateCommentReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		comment, err := model.CreateComment(env.Log, createReq)
		if err != nil {
			log.Errorf("comment creation failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), createEntityIDKey, comment.ID))

		js, err := json.Marshal(comment)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func putStoryHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		putReq := model.PutStoryReq{}
		if err := json.NewDecoder(r.Body).Decode(&putReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.PutStory(env.Log, putReq)
		if err != nil {
			log.Errorf("story update failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func putTaskHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		putReq := model.PutTaskReq{}
		if err := json.NewDecoder(r.Body).Decode(&putReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.PutTask(env.Log, putReq)
		if err != nil {
			log.Errorf("story update failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func putCommentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		putReq := model.PutCommentReq{}
		if err := json.NewDecoder(r.Body).Decode(&putReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.PutComment(env.Log, putReq)
		if err != nil {
			log.Errorf("comment update failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}
	})
}

func getSprintsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sprints, err := model.GetSprints(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(sprints)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createSprintHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateSprintReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		entity, err := model.CreateSprint(env.Log, createReq)
		if err != nil {
			log.Errorf("sprint creation failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), createEntityIDKey, entity.ID))

		js, err := json.Marshal(entity)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getStoriesHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		stories, err := model.GetStories(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(stories)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createStoryHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateStoryReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		entity, err := model.CreateStory(env.Log, env.Sqids, createReq)
		if err != nil {
			log.Errorf("story creation failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), createEntityIDKey, entity.ID))

		js, err := json.Marshal(entity)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

// TAGS
func getTagsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tags, err := model.GetTags(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(tags)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getTagAssignmentsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tagAssignments, err := model.GetTagAssignments(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(tagAssignments)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createTagAssignmentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateTagAssignmentReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		entity, err := model.CreateTagAssignment(env.Log, createReq)
		if err != nil {
			log.Errorf("tag assignment creation failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), createEntityIDKey, entity.ID))

		js, err := json.Marshal(entity)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func destroyTagAssignmentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		destroyReq := model.DestroyTagAssignmentReq{}
		if err := json.NewDecoder(r.Body).Decode(&destroyReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.DestroyTagAssignment(env.Log, destroyReq)
		if err != nil {
			log.Errorf("tag assignment destruction failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}
	})
}

func destroyTagAssignmentByIDHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		destroyReq := model.DestroyTagAssignmentByIDReq{}
		if err := json.NewDecoder(r.Body).Decode(&destroyReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.DestroyTagAssignmentByID(env.Log, destroyReq)
		if err != nil {
			log.Errorf("tag assignment destruction failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}
	})
}

func createTagHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateTagReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		entity, err := model.CreateTag(env.Log, createReq)
		if err != nil {
			log.Errorf("tag creation failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), createEntityIDKey, entity.ID))

		js, err := json.Marshal(entity)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getStoryRelationshipsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		StoryRelationships, err := model.GetStoryRelationships(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(StoryRelationships)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createStoryRelationshipHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateStoryRelationshipReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		entity, err := model.CreateStoryRelationship(env.Log, createReq)
		if err != nil {
			log.Errorf("story relationship creation failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), createEntityIDKey, entity.ID))

		js, err := json.Marshal(entity)
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func destroyStoryRelationshipByIDHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		destroyReq := model.DestroyStoryRelationshipByIDReq{}
		if err := json.NewDecoder(r.Body).Decode(&destroyReq); err != nil {
			log.Errorf("unable to decode json: %v", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.DestroyStoryRelationshipByID(env.Log, destroyReq)
		if err != nil {
			log.Errorf("story relationship destruction failed: %v", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}
	})
}

func uploadImageHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			log.Errorf("file too large or bad form: %v", err)
			http.Error(w, "file too large", http.StatusBadRequest)
			return
		}

		file, header, err := r.FormFile("image")
		if err != nil {
			log.Errorf("could not read form file: %v", err)
			http.Error(w, "missing image field", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// TODO: file type should be determined by the server, with ext set accordingly.
		filename := uuid.NewString() + filepath.Ext(header.Filename)

		// TODO: local file save logic should go to storage package
		dst, err := os.Create(filepath.Join("../..", uploadsDir, filename))
		if err != nil {
			log.Errorf("could not create file: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		hasher := sha256.New()
		var imageBytes bytes.Buffer
		written, err := io.Copy(io.MultiWriter(dst, hasher, &imageBytes), file)
		if err != nil {
			log.Errorf("could not write file: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		mimeType := header.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = mime.TypeByExtension(filepath.Ext(header.Filename))
		}
		if parsed, _, err := mime.ParseMediaType(mimeType); err == nil {
			mimeType = parsed
		}
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		cfg, _, err := image.DecodeConfig(bytes.NewReader(imageBytes.Bytes()))
		if err != nil {
			log.Errorf("could not decode image config: %v", err)
			http.Error(w, "invalid image", http.StatusBadRequest)
			return
		}

		remoteAddr := r.RemoteAddr
		if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
			remoteAddr = host
		}

		var uploaderIP *string
		if remoteAddr != "" {
			uploaderIP = &remoteAddr
		}

		var clientFilename *string
		if header.Filename != "" {
			clientFilename = &header.Filename
		}

		localUploadPath := fmt.Sprintf("/uploads/%s", filename)
		artifactReqs := []model.UploadArtifact{
			{
				ArtifactType: "LOCAL",
				StorageKey:   filename,
				PublicURL:    &localUploadPath,
				PixelWidth:   cfg.Width,
				PixelHeight:  cfg.Height,
				ByteSize:     written,
				MimeType:     mimeType,
				SHA256Hex:    hex.EncodeToString(hasher.Sum(nil)),
			},
		}

		s3Meta, err := env.S3Uploader.Upload(r.Context(), filename, mimeType, imageBytes.Bytes())
		if err == nil {
			artifactReqs = append(artifactReqs, model.UploadArtifact{
				ArtifactType: "S3",
				StorageKey:   s3Meta.StorageKey,
				PublicURL:    &s3Meta.PublicURL,
				PixelWidth:   cfg.Width,
				PixelHeight:  cfg.Height,
				ByteSize:     written,
				MimeType:     mimeType,
				SHA256Hex:    hex.EncodeToString(hasher.Sum(nil)),
			})
			log.Infof("s3 upload succeeded for %s to %s", filename, s3Meta.PublicURL)
		} else {
			log.Errorf("s3 upload failed for %s: %v", filename, err)
		}

		err = model.CreateUploadWithArtifacts(log, env.CallerID, model.CreateUploadWithArtifactsReq{
			UploaderIP:     uploaderIP,
			ClientFilename: clientFilename,
			UploadType:     "IMAGE",
			Artifacts:      artifactReqs,
		})
		if err != nil {
			log.Errorf("could not persist upload metadata: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(&struct {
			URL string `json:"url"`
		}{localUploadPath})
		if err != nil {
			log.Errorf("json.Marshal failed: %v", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func looksLikeUUIDv4(id string) bool {
	return len(id) == 36 && strings.Count(id, "-") == 4 && id[14] == '4'
}
