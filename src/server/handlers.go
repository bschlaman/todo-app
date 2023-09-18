package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/bschlaman/todo-app/model"
)

func loginHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		pass := r.FormValue("pass")

		if pass != env.LoginPw {
			log.Infof("incorrect pw: %v", pass)
			http.Error(w, "incorrect pw", http.StatusUnauthorized)
			return
		}

		log.Info("login successful!")
		id := createSaveNewSession()
		cookie := &http.Cookie{
			Name:     "session",
			Value:    id,
			SameSite: http.SameSiteDefaultMode,
			Path:     "/",
		}
		http.SetCookie(w, cookie)
		log.Infof("setting cookie: %v", cookie)

		u, err := url.Parse(r.Header.Get("Referer"))
		if err != nil {
			delete(sessions, id)
			log.Infof("invalid ref url: %v", r.Header.Get("Referer"))
			http.Error(w, "invalid ref url", http.StatusBadRequest)
			return
		}
		ref, err := url.PathUnescape(u.Query().Get("ref"))
		log.Infof("u: %s, ref: %s", u, ref)
		if err != nil {
			delete(sessions, id)
			log.Infof("invalid ref url: %v", r.Header.Get("Referer"))
			http.Error(w, "invalid ref url", http.StatusBadRequest)
			return
		}
		// redirecting to url = "" causes weirdness
		if ref == "" {
			ref = "/"
		}
		http.Redirect(w, r, ref, http.StatusSeeOther)
	})
}

func checkSessionHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// if the call makes it this far, we know the session is valid
		cookie, _ := r.Cookie("session")
		s := sessions[cookie.Value]

		timeRemaining := sessionDuration - time.Since(s.CreatedAt)

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
		var sessionValues []Session
		for _, s := range sessions {
			sessionValues = append(sessionValues, s)
		}

		js, err := json.Marshal(sessionValues)
		if err != nil {
			http.Error(w, "error marshalling sessions", http.StatusInternalServerError)
		}

		*r = *r.WithContext(context.WithValue(r.Context(), getRequestBytesKey, len(js)))

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func clearSessionsHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessions = make(map[string]Session)
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
		if strings.Count(taskID, "-") != 4 {
			log.Errorf("taskID seems incorrect: %s\n", taskID)
			http.Error(w, "bad task id", http.StatusBadRequest)
			return
		}

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
		// TODO: strongly coupled to id format
		if strings.Count(taskID, "-") != 4 {
			log.Errorf("taskID seems incorrect: %s\n", taskID)
			http.Error(w, "bad task id", http.StatusBadRequest)
			return
		}

		task, err := model.GetTaskByID(env.Log, taskID)
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
		// TODO: strongly coupled to id format
		if strings.Count(storyID, "-") != 4 {
			log.Errorf("storyID seems incorrect: %s\n", storyID)
			http.Error(w, "bad story id", http.StatusBadRequest)
			return
		}

		story, err := model.GetStoryByID(env.Log, storyID)
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

		task, err := model.CreateTask(env.Log, createReq)
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

		entity, err := model.CreateStory(env.Log, createReq)
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
