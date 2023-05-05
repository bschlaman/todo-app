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
  createComment,
  getCommentsByTaskId,
  getSprints,
  getStories,
  getTaskById,
  updateTaskById,
} from "../../ts/lib/api";
import Loading from "../../components/loading";
import { formatDate, formatId } from "../../ts/lib/utils";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";
import ReactMarkdown from "react-markdown";
// import styles from "./TaskPage.modules.css";
import "./TaskPage.modules.css";

// TODO: maxlength property for contenteditable fields
function TaskView({
  task,
  onTaskUpdate,
}: {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => Promise<void>;
}) {
  // const descriptionRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description);

  return (
    <>
      <a href="/">Back</a>
      <h3>{task.title}</h3>
      <TaskMetadata task={task} onTaskUpdate={onTaskUpdate} />
      <input
        id="edit-mode"
        type="checkbox"
        checked={!isEditing}
        onChange={() => setIsEditing(!isEditing)}
      />
      <label htmlFor="edit-mode">Edit Mode</label>
      {isEditing ? (
        <div>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
          />
          <button
            onClick={() => {
              setIsEditing(false);
              void onTaskUpdate({ ...task, description });
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <ReactMarkdown>{description}</ReactMarkdown>
      )}
    </>
  );
}

function TaskMetadata({
  task,
  onTaskUpdate,
}: {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => Promise<void>;
}) {
  const [stories, setStories] = useState<Story[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [error, setError] = useState(null);

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
        })
        .catch((e) => {
          setError(e.message);
        });
    })();
  }, [task]);

  function handleTaskMetadataChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    const updatedTask = { ...task, [name]: value };
    console.log(updatedTask, name, value);
    void onTaskUpdate(updatedTask);
  }

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
      <select
        name="status"
        value={taskStatus}
        onChange={handleTaskMetadataChange}
      >
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
      <select
        name="story_id"
        value={taskStoryId}
        onChange={handleTaskMetadataChange}
      >
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

  if (error !== null) return <ErrorBanner message={error} />;

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

function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [error, setError] = useState(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log("[CommentsSection] render count", renderCount.current);
  });

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
  }, [taskId]);

  if (error !== null) return <ErrorBanner message={error} />;

  function handleCreateComment() {
    void (async () => {
      if (inputRef.current?.value === undefined) return;
      if (inputRef.current?.value.trim() === "") return;
      const comment = await createComment(taskId, inputRef.current.value);
      setComments([...comments, comment]);
      inputRef.current.value = "";
      inputRef.current.focus();
    })();
  }

  return (
    <>
      {comments.map((comment) => {
        return (
          <div key={comment.id}>
            <p>{comment.id}</p>
            <p>{formatDate(new Date(comment.created_at))}</p>
            <ReactMarkdown>{comment.text}</ReactMarkdown>
          </div>
        );
      })}
      <div>
        <textarea
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") {
              handleCreateComment();
            }
          }}
          ref={inputRef}
          placeholder="Type new comment (ctrl+&#9166; to save)"
        ></textarea>
        <button onClick={handleCreateComment}>Post</button>
      </div>
    </>
  );
}

export default function TaskPage() {
  const path = window.location.pathname;
  const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState(null);

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log("[TaskPage] render count", renderCount.current);
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

  async function handleTaskUpdate(updatedTask: Task) {
    await updateTaskById(
      updatedTask.id,
      updatedTask.status,
      updatedTask.title,
      updatedTask.description,
      updatedTask.story_id
    );
    setTask(updatedTask);
  }

  if (error !== null) return <ErrorBanner message={error} />;

  if (task === null) return <Loading />;

  return (
    <div className="container">
      <TaskView task={task} onTaskUpdate={handleTaskUpdate} />
      <CommentsSection taskId={task.id} />
    </div>
  );
}
