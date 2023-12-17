import React, { useEffect, useRef, useState } from "react";
import ErrorBanner from "../../components/banners";
import { Task } from "../../ts/model/entities";
import { getTaskById, updateTaskById } from "../../ts/lib/api";
import Loading from "../../components/loading";
import styles from "./TaskPage.module.css";
import CommentsSection from "./CommentsSection";
import "../../css/common.css";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import ReactMarkdownCustom from "../../components/markdown";
import TaskMetadata from "./task_metadata";

function TaskView({
  task,
  onTaskUpdate,
}: {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => Promise<void>;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(task.description);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus the textarea when editing, and place the cursor at the end of the content
  useEffect(() => {
    if (!isEditingDesc) return;
    if (descriptionRef.current == null) return;
    descriptionRef.current.focus();
    descriptionRef.current.selectionStart = descriptionRef.current.value.length;
    descriptionRef.current.selectionEnd = descriptionRef.current.value.length;
  }, [isEditingDesc]);

  return (
    <>
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <a
          style={{
            border: "2px solid var(--color3)",
            paddingRight: "10px",
            borderRadius: "5px",
            background: "var(--color1)",
          }}
          href="/"
        >
          〈Back
        </a>
        {isEditingTitle ? (
          <div>
            <textarea
              style={{
                fontSize: "1.8rem",
                resize: "none",
              }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              onClick={() => {
                setIsEditingTitle(false);
                void onTaskUpdate({ ...task, title });
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <h2 onClick={() => setIsEditingTitle(true)}>{title}</h2>
        )}
        <CopyToClipboardButton
          value={window.location.pathname}
        ></CopyToClipboardButton>
      </div>
      <TaskMetadata task={task} onTaskUpdate={onTaskUpdate} />
      <div
        style={{
          background: "var(--color1)",
          padding: "1rem",
          fontSize: "1.5rem",
          borderRadius: "5px",
          position: "relative",
        }}
      >
        {isEditingDesc ? (
          <>
            <textarea
              style={{
                width: "100%",
                borderRadius: "5px",
                resize: "none",
                margin: "1rem 0",
                background: "var(--color1)",
                height: "180px",
                fontSize: "1rem",
              }}
              value={description}
              ref={descriptionRef}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === "Enter") {
                  setIsEditingDesc(false);
                  void onTaskUpdate({ ...task, description });
                }
              }}
            />
            <button
              style={{
                position: "absolute",
                top: 5,
                right: 200,
                fontSize: "1rem",
                borderRadius: "5px",
              }}
              onClick={() => {
                setIsEditingDesc(false);
                void onTaskUpdate({ ...task, description });
              }}
            >
              Save
            </button>
          </>
        ) : (
          <div onClick={() => setIsEditingDesc(true)}>
            <ReactMarkdownCustom content={description} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            fontSize: "1rem",
          }}
        >
          <input
            id="preview-md"
            type="checkbox"
            checked={!isEditingDesc}
            onChange={() => setIsEditingDesc(!isEditingDesc)}
          />
          <label htmlFor="preview-md">Rendered</label>
        </div>
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
    renderCount.current++;
    console.log("[TaskPage] render count", renderCount.current);
  });

  useEffect(() => {
    void (async () => {
      await getTaskById(taskIdFromPath)
        .then((task) => {
          setTask(task);
        })
        .catch((e) => {
          setError(e.message);
        });
    })();
  }, [taskIdFromPath]);

  useEffect(() => {
    if (task === null) return;
    document.title = task.title;
  }, [task]);

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
    <div className={styles.container}>
      <div className={styles.content}>
        <TaskView task={task} onTaskUpdate={handleTaskUpdate} />
        <CommentsSection taskId={task.id} />
      </div>
    </div>
  );
}
