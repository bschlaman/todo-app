import React, { CSSProperties } from "react";
import { useDrag } from "react-dnd";

export interface CardProps {
  name: string;
  type: string;
  isDropped: boolean;
}

const style: CSSProperties = {
  border: "2px solid grey",
  padding: "1rem",
  cursor: "move",
  float: "left",
};

export default function Card({ name, type, isDropped }: CardProps) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type,
      item: { name },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    []
  );
  return (
    <div ref={dragRef} style={{ ...style, opacity }}>
      {isDropped ? <s>{name}</s> : name}
    </div>
  );
}
