import { useEffect, useState, type Ref } from "react";
import {
  TASK_STATUS,
  type Story,
  type Tag,
  type Task,
} from "../../ts/model/entities";
import { CopyToClipboardButton } from "../../components/copy_to_clipboard_components";
import { useTaskCopyValue } from "../../components/copy_mode_toggle";
import { DRAG_TYPE } from "./drag";
import { useDrag } from "react-dnd";
import { TagBadgesForStoryId, TagCircles } from "../../components/tags";
import ReactMarkdownCustom from "../../components/markdown";
import CommentIcon from "@mui/icons-material/Comment";

// Replace ISO dates (e.g. 2024-01-15, 2024.01.15) with <span class="iso-date">
export function renderTextWithISOSpan(text: string) {
  const isoDateRegxp = /(\d{4}[-.]\d{2}[-.]\d{2})/g;
  return text.split(isoDateRegxp).map((part, i) =>
    isoDateRegxp.test(part) ? (
      <span
        key={i}
        className="m-1 inline-block rounded-md bg-blue-950 p-1 align-middle font-mono text-sm text-zinc-300 inset-shadow-sm inset-shadow-indigo-500"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// TODO 2023.11.11: if switching to dnd-kit, remember to use setActivatorNodeRef
export default function TaskCard({
  task,
  storiesById,
  tagsById,
  assocTagIdsByStoryId,
  moveTask,
}: {
  task: Task;
  storiesById: Map<string, Story>;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
  moveTask: (taskId: string, status: TASK_STATUS) => void;
}) {
  const taskPageRef = `/task/${task.sqid}`;

  // workaround for strict mode messing up drag previews.
  // react-dnd is not maintained, see https://github.com/react-dnd/react-dnd/issues/3452
  const [called, setCalled] = useState(false);
  useEffect(() => {
    if (!called) {
      setCalled(true);
    }
  }, [called]);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: DRAG_TYPE.CARD,
      item: task,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end: (draggedItem, monitor) => {
        const dropRes = monitor.getDropResult<{ status: TASK_STATUS }>();
        if (dropRes !== null) moveTask(draggedItem.id, dropRes.status);
      },
    }),
    [],
  );

  // Call hook before any early returns to avoid Rules of Hooks violation
  // TODO: I think this could be alleviated by creating a CopyTaskToClipboardButton
  // which gets passed the task and the copy mode.  Then we can probably get rid of useSyncExternalStore in src/client/components/copy_mode_indicator.tsx.
  const copyValue = useTaskCopyValue(task);

  function renderHandle() {
    return (
      <p
        className="absolute top-2.5 left-1/2 m-0 -translate-x-1/2 -translate-y-1/2 cursor-grab text-center text-gray-500 select-none active:cursor-grabbing"
        ref={drag as unknown as Ref<HTMLDivElement>}
      >
        &#8801;
      </p>
    );
  }

  // workaround for strict mode messing up drag previews
  if (!called) return null;

  return (
    <div
      className="relative mb-4 rounded-md bg-zinc-50 p-5 shadow-md outline-2 outline-zinc-700 outline-solid dark:bg-zinc-800 dark:text-zinc-50"
      style={{
        opacity: isDragging ? 0.7 : 1,
        ...(task.status === TASK_STATUS.DONE
          ? { borderLeft: "6px solid green" }
          : {}),
        ...(task.bulk_task ? { borderLeft: "12px solid lightblue" } : {}),
      }}
      // TODO (2023.05.21): check this issue: https://github.com/react-dnd/react-dnd/issues/3452
      ref={preview as unknown as Ref<HTMLDivElement>}
    >
      <h3 className="mb-4 border-b border-b-zinc-400 text-xl font-bold dark:text-zinc-200">
        {renderTextWithISOSpan(task.title)}
      </h3>
      <div className="absolute right-3 bottom-3">
        <CopyToClipboardButton value={copyValue}></CopyToClipboardButton>
      </div>
      {renderHandle()}
      <a
        className="absolute top-3 right-3 opacity-60"
        href={taskPageRef}
        title="Edit"
      >
        📝
      </a>
      {!task.bulk_task && task.status !== TASK_STATUS.DONE && (
        <div className="dark:text-zinc-400">
          <ReactMarkdownCustom content={task.description} />
        </div>
      )}
      {task.story_id && (
        <div className="mt-4 mb-2">
          {task.status === TASK_STATUS.DONE ? (
            <TagCircles
              storyId={task.story_id}
              tagsById={tagsById}
              assocTagIdsByStoryId={assocTagIdsByStoryId}
            />
          ) : (
            <TagBadgesForStoryId
              storyId={task.story_id}
              tagsById={tagsById}
              assocTagIdsByStoryId={assocTagIdsByStoryId}
            />
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        {task.story_id ? (
          <a
            className="text-xs text-zinc-600 underline"
            href={"#" + (storiesById.get(task.story_id)?.id ?? "")}
          >
            {storiesById.get(task.story_id)?.title ?? "? ERROR!"}
          </a>
        ) : (
          <p className="text-xs text-zinc-600 underline">-</p>
        )}
        {!!task.comment_count && (
          <span className="text-xs text-zinc-600" title="Comments">
            <CommentIcon /> {task.comment_count}
          </span>
        )}
      </div>
    </div>
  );
}
