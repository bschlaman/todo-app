import React, { CSSProperties } from "react";
import { useDrag } from "react-dnd";
import { STATUS, Task } from "../../ts/model/entities";

export enum DRAG_TYPE {
  CARD = "card",
}

interface CardProps {
  isDropped: boolean;
  task: Task;
  moveTask: (taskId: string, status: STATUS) => void;
}

const style: CSSProperties = {
  border: "2px solid grey",
  padding: "1rem",
  margin: "0.3rem",
  cursor: "move",
  float: "left",
  background: "lightgreen",
  borderRadius: "4px",
};

export default function Card({ isDropped, task, moveTask }: CardProps) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: DRAG_TYPE.CARD,
      item: { taskId: task.id },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
      end: (draggedItem, monitor) => {
        const dropRes = monitor.getDropResult<{ status: STATUS }>();
        if (dropRes !== null) moveTask(draggedItem.taskId, dropRes.status);
      },
    }),
    []
  );
  return (
    <div ref={dragRef} style={{ ...style, opacity }}>
      {isDropped ? <s>{task.title}</s> : task.title}
    </div>
  );
}
