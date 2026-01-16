import { useEffect, useRef, useState } from "react";
import ErrorBanner from "../../components/banners";
import type { Config, Task } from "../../ts/model/entities";
import {
  checkSession,
  getConfig,
  getTaskById,
  updateTaskById,
} from "../../ts/lib/api";
import Loading from "../../components/loading";
import CommentsSection from "./CommentsSection";
import {
  CopyToClipboardButton,
  CopyDateButton,
} from "../../components/copy_to_clipboard_components";
import ReactMarkdownCustom from "../../components/markdown";
import TaskMetadata from "./task_metadata";
import { SessionTimeRemainingIndicator } from "../../components/session";
import CopyModeToggle, {
  useTaskCopyValue,
} from "../../components/copy_mode_toggle";
import {
  type TimedApiResult,
  makeTimedPageLoadApiCall,
} from "../../ts/lib/api_utils";
import type { CheckSessionRes } from "../../ts/model/responses";

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
      <div className="flex items-center justify-between gap-8">
        <a className="rounded-md border-2 border-blue-500 pr-2" href="/">
          〈Back
        </a>
        {isEditingTitle ? (
          <div className="grow">
            <textarea
              className="w-full resize-none rounded-md p-2 dark:bg-zinc-950"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={config?.task_title_max_len}
            />
            <div className="flex items-center gap-2">
              <button
                className="m-4 rounded-xs px-2 outline-solid outline-2 dark:bg-zinc-950"
                onClick={() => {
                  setIsEditingTitle(false);
                  void onTaskUpdate({ ...task, title });
                }}
              >
                Save
              </button>
              <CopyDateButton />
            </div>
          </div>
        ) : (
          <h2
            className="text-lg font-bold dark:text-zinc-200"
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h2>
        )}
        <CopyModeToggle />
        <CopyToClipboardButton
          value={useTaskCopyValue(task)}
        ></CopyToClipboardButton>
      </div>
      <TaskMetadata task={task} onTaskUpdate={onTaskUpdate} />
      <div className="relative mt-4 rounded-md bg-zinc-100 p-8 dark:bg-zinc-600">
        {isEditingDesc ? (
          <>
            <textarea
              className="h-56 w-full resize-none rounded-xs dark:bg-zinc-900"
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
              className="absolute right-28 top-1 rounded-xs outline-solid outline-2"
              onClick={() => {
                setIsEditingDesc(false);
                void onTaskUpdate({ ...task, description });
              }}
            >
              Save
            </button>
          </>
        ) : (
          <ReactMarkdownCustom content={description} />
        )}
        <button
          className="absolute right-2 top-2 cursor-pointer select-none text-sm font-thin italic text-zinc-600 hover:underline dark:text-zinc-400"
          onClick={() => setIsEditingDesc(!isEditingDesc)}
        >
          {isEditingDesc ? "Cancel" : "Edit"}
        </button>
        {isEditingDesc && (
          <p className="absolute bottom-2 right-4 font-thin">
            {description.length ?? 0} / {config?.task_desc_max_len}
          </p>
        )}
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
    <div className="min-h-dvh bg-zinc-200 dark:bg-zinc-900">
      <main className="mx-auto w-[80vw] max-w-3xl items-center pt-4 dark:text-white">
        <TaskView task={task} config={config} onTaskUpdate={handleTaskUpdate} />
        <SessionTimeRemainingIndicator
          sessionTimeRemainingSeconds={
            checkSessionRes.session_time_remaining_seconds
          }
        />
        <CommentsSection taskId={task.id} config={config} />
      </main>
    </div>
  );
}
