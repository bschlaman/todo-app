import React, { useEffect, useRef, useState } from "react";
import ErrorBanner from "../../components/banners";
import { Config, Task } from "../../ts/model/entities";
import {
  checkSession,
  getConfig,
  getTaskById,
  updateTaskById,
} from "../../ts/lib/api";
import Loading from "../../components/loading";
import CommentsSection from "./CommentsSection";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import ReactMarkdownCustom from "../../components/markdown";
import TaskMetadata from "./task_metadata";
import { SessionTimeRemainingIndicator } from "../../components/session";
import {
  TimedApiResult,
  makeTimedPageLoadApiCall,
} from "../../ts/lib/api_utils";
import { CheckSessionRes } from "../../ts/model/responses";

function TaskView({
  task,
  config,
  onTaskUpdate,
}: {
  task: Task;
  config: Config | null;
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
    if (descriptionRef.current === null) return;
    descriptionRef.current.focus();
    descriptionRef.current.selectionStart = descriptionRef.current.value.length;
    descriptionRef.current.selectionEnd = descriptionRef.current.value.length;
  }, [isEditingDesc]);

  return (
    <>
      <div className="flex items-center gap-8">
        <a className="rounded-md border-2 border-blue-500 pr-2" href="/">
          〈Back
        </a>
        {isEditingTitle ? (
          <div>
            <textarea
              className="resize-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={config?.task_title_max_len}
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
          <h2
            className="text-lg font-bold"
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h2>
        )}
        <CopyToClipboardButton
          value={window.location.pathname}
        ></CopyToClipboardButton>
      </div>
      <TaskMetadata task={task} onTaskUpdate={onTaskUpdate} />
      <div className="relative mt-4 rounded-md bg-zinc-100 p-8">
        {isEditingDesc ? (
          <>
            <textarea
              className="h-56 w-full resize-none rounded-sm"
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
              maxLength={config?.task_desc_max_len}
            />
            <button
              className="absolute right-28 top-1 rounded-sm outline outline-2"
              onClick={() => {
                setIsEditingDesc(false);
                void onTaskUpdate({ ...task, description });
              }}
            >
              Save
            </button>
          </>
        ) : (
          <div onDoubleClick={() => setIsEditingDesc(true)}>
            <ReactMarkdownCustom content={description} />
          </div>
        )}
        {isEditingDesc && (
          <p className="absolute bottom-2 right-4 font-thin">
            {description.length ?? 0} / {config?.task_desc_max_len}
          </p>
        )}
        <div className="absolute right-1 top-1">
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
  const [config, setConfig] = useState<Config | null>(null);
  const [checkSessionRes, setCheckSessionRes] = useState<CheckSessionRes>({
    session_time_remaining_seconds: 0,
  });
  const [errors, setErrors] = useState<Error[]>([]);

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.log("[TaskPage] render count", renderCount.current);
  });

  useEffect(() => {
    // use unique timers to avoid conflicts on repeated page mount
    const timerId = `api_calls#${Date.now() % 1e3}`;
    console.time(timerId);

    void (async () => {
      await Promise.allSettled([
        makeTimedPageLoadApiCall(
          // wrapping the api call since I need to pass in a param
          async () => await getTaskById(taskIdFromPath),
          setErrors,
          setTask,
          "getTaskById",
        ),
        makeTimedPageLoadApiCall(
          checkSession,
          setErrors,
          setCheckSessionRes,
          "checkSession",
        ),
        makeTimedPageLoadApiCall(getConfig, setErrors, setConfig, "getConfig"),
      ]).then((results) => {
        console.table(
          results
            .map((res) => (res as PromiseFulfilledResult<TimedApiResult>).value)
            .map(({ apiIdentifier, succeeded, duration }) => ({
              apiIdentifier,
              succeeded,
              duration,
            })),
        );
        console.timeEnd(timerId);
      });
    })();
  }, [taskIdFromPath]);

  useEffect(() => {
    if (task === null) return;
    document.title = task.title;
    window.history.replaceState({}, "", `/task/${task.sqid}`);
  }, [task]);

  // this function should be a mirror of handleStoryUpdate.
  // consider moving to a util along with updateTaskStatusById
  async function handleTaskUpdate(updatedTask: Task) {
    if (task === null) return;
    if (Object.keys(updatedTask).length !== Object.keys(task).length)
      throw Error("updated task has incorrect number of keys");

    // return early if there is nothing to update
    let diff = false;
    for (const key in task) {
      if (
        task[key as keyof typeof task] ===
        updatedTask[key as keyof typeof updatedTask]
      )
        continue;
      diff = true;
      break;
    }
    if (!diff) return;

    await updateTaskById(
      updatedTask.id,
      updatedTask.status,
      updatedTask.title,
      updatedTask.description,
      updatedTask.story_id,
    );
    setTask(updatedTask);
  }

  if (errors.length > 0) return <ErrorBanner errors={errors} />;

  if (task === null) return <Loading />;

  return (
    <main className="mx-auto mt-4 w-[80vw] max-w-3xl items-center">
      <TaskView task={task} config={config} onTaskUpdate={handleTaskUpdate} />
      <SessionTimeRemainingIndicator
        sessionTimeRemainingSeconds={
          checkSessionRes.session_time_remaining_seconds
        }
      />
      <CommentsSection taskId={task.id} config={config} />
    </main>
  );
}
