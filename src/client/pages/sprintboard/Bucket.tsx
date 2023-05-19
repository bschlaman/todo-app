import React, { ReactNode } from "react";
import { STATUS } from "../../ts/model/entities";
import { DRAG_TYPE } from "./drag";
import { useDrop } from "react-dnd";

interface BucketProps {
  status: STATUS;
  children?: ReactNode;
}
export default function Bucket({ status, children }: BucketProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DRAG_TYPE.CARD,
    // canDrop: (item, monitor) => item.status === status,
    drop: () => ({ status }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const active = isOver && canDrop;

  return (
    <div
      style={{
        position: "relative",
        background: active ? "darkgrey" : "lightgrey",
        boxShadow: "inset 0 0 3px",
        overflow: "hidden",
        width: "100%",
        padding: "2.5rem 1rem 1rem 1rem",
      }}
      ref={drop}
    >
      <p style={{ position: "absolute", top: 0 }}>{status}</p>
      {children}
    </div>
  );
}
