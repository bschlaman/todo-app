import React from "react";
import { STATUS, Story, Tag, Task } from "../../ts/model/entities";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import { TAG_COLORS } from "../../ts/lib/common";
import { DRAG_TYPE } from "./drag";
import { useDrag } from "react-dnd";

function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      style={{
        background: TAG_COLORS[tag.title as keyof typeof TAG_COLORS],
        color: "white",
        borderRadius: "0.4rem",
        fontSize: "0.7rem",
        fontWeight: "bold",
        padding: "0.3rem",
        margin: "0.2rem",
      }}
    >
      {tag.title}
    </span>
  );
}

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
  moveTask: (taskId: string, status: STATUS) => void;
}) {
  const story = storiesById.get(task.story_id);
  const taskPageRef = `/task_v2/${task.id}`;

  const [, dragRef] = useDrag(
    () => ({
      type: DRAG_TYPE.CARD,
      item: { taskId: task.id },
      collect: (_monitor) => ({
        // opacity: monitor.isDragging() ? 0.5 : 1,
      }),
      end: (draggedItem, monitor) => {
        const dropRes = monitor.getDropResult<{ status: STATUS }>();
        if (dropRes !== null) moveTask(draggedItem.taskId, dropRes.status);
      },
    }),
    []
  );

  function renderHandle() {
    return (
      <p
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "grey",
          margin: "0",
          cursor: "grab",
        }}
      >
        &#8801;
      </p>
    );
  }

  function renderTagBadges() {
    const tagBadges: JSX.Element[] = [];
    assocTagIdsByStoryId.get(task.story_id)?.forEach((tagId) => {
      const tag = tagsById.get(tagId);
      if (tag === undefined) throw new Error("tag not found: " + tagId);
      tagBadges.push(<TagBadge key={tagId} tag={tag}></TagBadge>);
    });
    return <>{tagBadges}</>;
  }

  return (
    <div
      ref={dragRef}
      style={{
        position: "relative",
        borderRadius: "5px",
        outline: "2px solid grey",
        padding: "1.2rem 1rem 1rem 1rem",
        background: "var(--transp-white)",
        marginBottom: "1rem",
      }}
    >
      <h3>{task.title}</h3>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
        }}
      >
        <CopyToClipboardButton value={taskPageRef}></CopyToClipboardButton>
      </div>
      {renderHandle()}
      <a
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
        }}
        href={taskPageRef}
      >
        Edit
      </a>
      {!task.bulk_task && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {task.description}
        </ReactMarkdown>
      )}
      {renderTagBadges()}
      <a href={story?.id ?? "#"}>{story?.title ?? "-"}</a>
    </div>
  );
}
