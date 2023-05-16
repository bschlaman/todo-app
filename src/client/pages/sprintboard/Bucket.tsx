import React from "react";
import { STATUS, Story, Tag, Task } from "../../ts/model/entities";
import TaskCard from "./TaskCard";

interface BucketProps {
  status: STATUS;
  tasks: Task[];
  storiesById: Map<string, Story>;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
}
export default function Bucket({
  status,
  tasks,
  storiesById,
  tagsById,
  assocTagIdsByStoryId,
}: BucketProps) {
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
          tagsById={tagsById}
          assocTagIdsByStoryId={assocTagIdsByStoryId}
        ></TaskCard>
      ))}
    </div>
  );
}
