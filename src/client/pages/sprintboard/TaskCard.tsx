import React, { useEffect, useState } from "react";
import { TASK_STATUS, Story, Tag, Task } from "../../ts/model/entities";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import { DRAG_TYPE } from "./drag";
import { useDrag } from "react-dnd";
import { renderTagBadgesForStoryId } from "../../components/tag_badge";
import ReactMarkdownCustom from "../../components/markdown";

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
  const story = storiesById.get(task.story_id);
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
      item: { taskId: task.id },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
      end: (draggedItem, monitor) => {
        const dropRes = monitor.getDropResult<{ status: TASK_STATUS }>();
        if (dropRes !== null) moveTask(draggedItem.taskId, dropRes.status);
      },
    }),
    [],
  );

  function renderHandle() {
    return (
      <p
        className="absolute left-1/2 top-2.5 m-0 -translate-x-1/2 -translate-y-1/2 cursor-grab select-none text-center text-gray-500 active:cursor-grabbing"
        ref={drag}
      >
        &#8801;
      </p>
    );
  }

  // workaround for strict mode messing up drag previews
  if (!called) return null;

  return (
    <div
      className="relative mb-4 rounded-md bg-slate-50 p-5 shadow-md outline outline-2 outline-slate-700"
      style={{
        opacity: isDragging ? 0.7 : 1,
        ...(task.status === TASK_STATUS.DONE
          ? { borderLeft: "6px solid green" }
          : {}),
        ...(task.bulk_task ? { borderLeft: "12px solid lightblue" } : {}),
      }}
      // TODO (2023.05.21): check this issue: https://github.com/react-dnd/react-dnd/issues/3452
      ref={preview}
    >
      <h3 className="mb-4 border-b border-b-slate-400 text-xl font-bold">
        {task.title}
      </h3>
      <div className="absolute bottom-3 right-3">
        <CopyToClipboardButton value={taskPageRef}></CopyToClipboardButton>
      </div>
      {renderHandle()}
      <a className="absolute right-3 top-3" href={taskPageRef} title="Edit">
        📝
      </a>
      {!task.bulk_task && task.status !== TASK_STATUS.DONE && (
        <ReactMarkdownCustom content={task.description} />
      )}
      <div className="my-4">
        {renderTagBadgesForStoryId(
          task.story_id,
          tagsById,
          assocTagIdsByStoryId,
        )}
      </div>
      <a
        className="text-sm text-slate-600 underline"
        href={"#" + (story?.id ?? "")}
      >
        {story?.title ?? "-"}
      </a>
    </div>
  );
}
