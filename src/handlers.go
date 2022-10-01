package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/bschlaman/todo-app/model"
)

func getConfigHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serverConfig, err := model.GetConfig(env.Log)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(serverConfig)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getCommentsByIdHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		taskId := r.URL.Query().Get("id")
		if strings.Count(taskId, "-") != 4 {
			log.Errorf("taskId seems incorrect: %s\n", taskId)
			http.Error(w, "bad task id", http.StatusBadRequest)
			return
		}

		comments, err := model.GetCommentsById(env.Log, taskId)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(comments)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getTaskByIdHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		taskId := r.URL.Query().Get("id")
		// TODO: strongly coupled to id format
		if strings.Count(taskId, "-") != 4 {
			log.Errorf("taskId seems incorrect: %s\n", taskId)
			http.Error(w, "bad task id", http.StatusBadRequest)
			return
		}

		task, err := model.GetTaskByIdHandle(env.Log, taskId)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(task)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func getStoryByIdHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		storyId := r.URL.Query().Get("id")
		// TODO: strongly coupled to id format
		if strings.Count(storyId, "-") != 4 {
			log.Errorf("storyId seems incorrect: %s\n", storyId)
			http.Error(w, "bad story id", http.StatusBadRequest)
			return
		}

		story, err := model.GetStoryById(env.Log, storyId)
		if err != nil {
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(story)
		if err != nil {
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

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
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createTaskHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateTaskReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.CreateTask(env.Log, createReq)
		if err != nil {
			log.Errorf("task creation failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func createCommentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateCommentReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.CreateComment(env.Log, createReq)
		if err != nil {
			log.Errorf("comment creation failed: %v\n", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}
	})
}

func putStoryHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		putReq := model.PutStoryReq{}
		if err := json.NewDecoder(r.Body).Decode(&putReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.PutStory(env.Log, putReq)
		if err != nil {
			log.Errorf("story update failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
	})
}

func putTaskHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		putReq := model.PutTaskReq{}
		if err := json.NewDecoder(r.Body).Decode(&putReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.PutTask(env.Log, putReq)
		if err != nil {
			log.Errorf("story update failed: %v\n", err)
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
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createSprintHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateSprintReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.CreateSprint(env.Log, createReq)
		if err != nil {
			log.Errorf("task creation failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
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
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createStoryHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateStoryReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.CreateStory(env.Log, createReq)
		if err != nil {
			log.Errorf("task creation failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}
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
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

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
			log.Errorf("json.Marshal failed: %v\n", err)
			http.Error(w, "something went wrong", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
}

func createTagAssignmentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		createReq := model.CreateTagAssignmentReq{}
		if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.CreateTagAssignment(env.Log, createReq)
		if err != nil {
			log.Errorf("tag assignment creation failed: %v\n", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}
	})
}

func destroyTagAssignmentHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		destroyReq := model.DestroyTagAssignmentReq{}
		if err := json.NewDecoder(r.Body).Decode(&destroyReq); err != nil {
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.DestroyTagAssignment(env.Log, destroyReq)
		if err != nil {
			log.Errorf("tag assignment destruction failed: %v\n", err)
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
			log.Errorf("unable to decode json: %v\n", err)
			http.Error(w, "something went wrong", http.StatusBadRequest)
			return
		}

		err := model.CreateTag(env.Log, createReq)
		if err != nil {
			log.Errorf("tag creation failed: %v\n", err)
			if errors.Is(err, model.InputError{}) {
				http.Error(w, "something went wrong", http.StatusBadRequest)
			} else {
				http.Error(w, "something went wrong", http.StatusInternalServerError)
			}
			return
		}
	})
}
