import React, { useEffect, useState } from "react";
import ErrorBanner from "../../components/banners";
import { Task } from "../../ts/model/entities";
import { getTaskById } from "../../ts/lib/api";

const path = window.location.pathname;
const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

function TaskView({ task }: { task?: Task | undefined }) {
  const taskMetadata = [
    ["Id", "id"],
    ["Created", "created"],
    ["Status", null],
    ["Parent Story", "parent story"],
  ];

  function renderMetadata(metadata: Array<Array<string | null>>) {
    return metadata.map(([label, value]) => (
      <div key={label}>
        <strong>{label}:</strong> {value ?? "loading..."}
      </div>
    ));
  }

  if (task === null) return <div>ASDF!!</div>;

  return <>{renderMetadata(taskMetadata)}</>;
}
function CommentsSection() {
  return <div>Comments!!!</div>;
}
export default function TaskPage() {
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [error, setError] = useState();

  useEffect(() => {
    void (async () => {
      await getTaskById(taskIdFromPath)
        .then((task) => {
          setTask(task);
        })
        .catch((e) => {
          setError(e.message);
        });
    })();
  }, []);

  if (error !== undefined) return <ErrorBanner message={error} />;

  return (
    <>
      <TaskView task={task} />
      <CommentsSection />
    </>
  );
}
