import React from "react";
import { STATUS, Story, Task } from "../../ts/model/entities";
import TaskCard from "./TaskCard";

interface BucketProps {
  status: STATUS;
  tasks: Task[];
  storiesById: Map<string, Story>;
}
export default function Bucket({ status, tasks, storiesById }: BucketProps) {
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
    >
      <p style={{ position: "absolute", top: 0 }}>{status}</p>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          storiesById={storiesById}
        ></TaskCard>
      ))}
    </div>
  );
}
