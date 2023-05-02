import React, { useEffect, useRef, useState } from "react";
import ErrorBanner from "../../components/banners";
import {
  STATUSES,
  Sprint,
  Story,
  Task,
  TaskComment,
} from "../../ts/model/entities";
import {
  getCommentsByTaskId,
  getSprints,
  getStories,
  getTaskById,
} from "../../ts/lib/api";
import Loading from "../../components/loading";
import { formatDate, formatId } from "../../ts/lib/utils";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";

function TaskMetadata({ task }: { task: Task }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  // const [sprintsById, setSprintsById] = useState<Map<string, Sprint>>();
  const [error, setError] = useState();

  useEffect(() => {
    void (async () => {
      await getStories()
        .then((stories) => {
          setStories(stories);
        })
        .catch((e) => {
          setError(e.message);
        });
      await getSprints()
        .then((sprints) => {
          setSprints(sprints);
          // const sprintsById = new Map<string, Sprint>();
          // sprints.forEach((sprint) => {
          //   sprintsById.set(sprint.id, sprint);
          // });
          // setSprintsById(sprintsById);
        })
        .catch((e) => {
          setError(e.message);
        });
    })();
  }, []);

  function renderTaskMetadataPair(label: string, value: string) {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <p style={{ fontWeight: "bold" }}>{label}:</p>
        <p>{value}</p>
      </div>
    );
  }

  function renderStatusDropdown(taskStatus: string) {
    return (
      <select value={taskStatus}>
        {/* this list will not change, so fine to depend on it */}
        {STATUSES.map((status) => {
          return (
            <option key={status} value={status}>
              {status}
            </option>
          );
        })}
      </select>
    );
  }

  function renderStoryDropdown(
    taskStoryId: string,
    stories: Story[],
    sprints: Sprint[]
  ) {
    // bucketize the stories by sprint
    const sprintBuckets = new Map<string, Story[]>();
    for (const story of stories) {
      if (!sprintBuckets.has(story.sprint_id))
        sprintBuckets.set(story.sprint_id, []);
      sprintBuckets.get(story.sprint_id)?.push(story);
    }

    // const sprintBucketsToRender = new Map<Sprint, Story[]>();
    const sprintsToRender: Sprint[] = [];

    // only render 3 additional sprints after the task is found
    // to de-clutter the UI
    let taskSprintFound = false;
    let sprintsBeforeTask = 3;

    sprints
      .sort((sprint0, sprint1) => {
        return (
          new Date(sprint1.start_date).getTime() -
          new Date(sprint0.start_date).getTime()
        );
      })
      .forEach((sprint) => {
        if (sprintsBeforeTask === 0) return;
        if (taskSprintFound) sprintsBeforeTask--;
        sprintBuckets.get(sprint.id)?.forEach((story) => {
          if (story.id === taskStoryId) taskSprintFound = true;
        });
        sprintsToRender.push(sprint);
      });

    return (
      <select value={taskStoryId}>
        <option value={NULL_STORY_IDENTIFIER}>{NULL_STORY_IDENTIFIER}</option>
        {sprintsToRender.map((sprint) => {
          return (
            <optgroup key={sprint.id} label={sprint.title}>
              {sprintBuckets.get(sprint.id)?.map((story) => {
                return (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    );
  }

  if (error !== undefined) return <ErrorBanner message={error} />;

  return (
    <div>
      {renderTaskMetadataPair("Id", formatId(task.id))}
      {renderTaskMetadataPair("Created", formatDate(new Date(task.created_at)))}
      <p>Status:</p>
      {renderStatusDropdown(task.status)}
      <p>Parent story:</p>
      {renderStoryDropdown(task.story_id, stories, sprints)}
    </div>
  );
}

// TODO: maxlength property for contenteditable fields
function TaskView({ task }: { task: Task }) {
  return (
    <>
      <a href="/">Back</a>
      <h3>{task.title}</h3>
      <TaskMetadata task={task} />
    </>
  );
}

function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [error, setError] = useState();

  useEffect(() => {
    void (async () => {
      await getCommentsByTaskId(taskId)
        .then((comments) => {
          setComments(comments);
        })
        .catch((e) => {
          setError(e.message);
        });
    })();
  }, []);

  if (error !== undefined) return <ErrorBanner message={error} />;

  if (comments === undefined) return <Loading />;

  return (
    <>
      {comments.map((comment) => {
        return (
          <div key={comment.id}>
            <p>{comment.id}</p>
            <p>{formatDate(new Date(comment.created_at))}</p>
            <p>{comment.text}</p>
          </div>
        );
      })}
    </>
  );
}

export default function TaskPage() {
  const path = window.location.pathname;
  const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

  const [task, setTask] = useState<Task>();
  const [error, setError] = useState();

  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log("render count", renderCount.current);
  });

  useEffect(() => {
    void (async () => {
      await getTaskById(taskIdFromPath)
        .then((task) => {
          document.title = task.title;
          setTask(task);
        })
        .catch((e) => {
          setError(e.message);
        });
    })();
  }, [taskIdFromPath]);

  if (error !== undefined) return <ErrorBanner message={error} />;

  if (task === undefined) return <Loading />;

  return (
    <>
      <TaskView task={task} />
      <CommentsSection taskId={task.id} />
    </>
  );
}
