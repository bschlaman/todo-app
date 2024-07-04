import React, { ReactNode } from "react";
import { TASK_STATUS, Task } from "../../ts/model/entities";
import { DRAG_TYPE } from "./drag";
import { useDrop } from "react-dnd";

interface BucketProps {
  status: TASK_STATUS;
  children?: ReactNode;
}
export default function Bucket({ status, children }: BucketProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DRAG_TYPE.CARD,
    canDrop: (_, monitor) => monitor.getItem<Task>().status !== status,
    drop: () => ({ status }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const active = isOver && canDrop;

  return (
    <div
      className="relative w-full overflow-hidden p-4 pt-8 shadow-inner"
      style={{
        background: active ? "darkgrey" : "lightgrey",
      }}
      ref={drop}
    >
      <p className="absolute top-1">{status}</p>
      {children}
      {active && (
        <div className="mb-4 h-40 rounded-md bg-yellow-200 opacity-50 shadow-[0_0_10px_10px_rgba(200,200,50,0.5)]" />
      )}
    </div>
  );
}
