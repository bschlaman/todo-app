import React from "react";
import { STATUS, Story, Tag, Task } from "../../ts/model/entities";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import { DRAG_TYPE } from "./drag";
import { useDrag } from "react-dnd";
import styles from "./TaskCard.module.css";
import { renderTagBadgesForStoryId } from "../../components/tag_badge";

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
  const taskPageRef = `/task/${task.id}`;

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: DRAG_TYPE.CARD,
      item: { taskId: task.id },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
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
        className={styles.grabable}
        ref={drag}
      >
        &#8801;
      </p>
    );
  }

  function specialStyles(task: Task) {
    // done status takes precedence over bulk task
    if (task.status === STATUS.DONE)
      return { borderLeft: "6px solid var(--color4)" };
    if (task.bulk_task) return { borderLeft: "12px solid lightblue" };
    return {};
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "5px",
        outline: "2px solid grey",
        padding: "1.2rem 1rem 1rem 1rem",
        background: "var(--transp-white)",
        marginBottom: "1rem",
        opacity: isDragging ? 0.5 : 1,
        boxShadow: "3px 3px 2px darkgrey",
        ...specialStyles(task),
      }}
      // TODO (2023.05.21): check this issue: https://github.com/react-dnd/react-dnd/issues/3452
      ref={preview}
    >
      <h3>{task.title}</h3>
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
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
      {!task.bulk_task && task.status !== STATUS.DONE && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {task.description}
        </ReactMarkdown>
      )}
      <div style={{ marginBottom: "1rem" }}>
        {renderTagBadgesForStoryId(
          task.story_id,
          tagsById,
          assocTagIdsByStoryId
        )}
      </div>
      <a
        style={{
          fontSize: "0.8rem",
          textDecoration: "underline",
          color: "grey",
        }}
        href={"#" + (story?.id ?? "")}
      >
        {story?.title ?? "-"}
      </a>
    </div>
  );
}
