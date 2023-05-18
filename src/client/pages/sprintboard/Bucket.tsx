import React, { ReactNode } from "react";
import { STATUS } from "../../ts/model/entities";
import { DRAG_TYPE } from "./drag";
import { useDrop } from "react-dnd";

interface BucketProps {
  status: STATUS;
  children?: ReactNode;
}
export default function Bucket({ status, children }: BucketProps) {
  const [, drop] = useDrop(() => ({
    accept: DRAG_TYPE.CARD,
    drop: () => ({ status }),
  }));

  return (
    <div
      style={{
        position: "relative",
        background: "lightgrey",
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
