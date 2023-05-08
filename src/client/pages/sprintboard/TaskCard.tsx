import React from "react";
import { Story, Task } from "../../ts/model/entities";
import CopyToClipboardButton from "../../components/copy_to_clipboard_button";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";

export default function TaskCard({
  task,
  storiesById,
}: {
  task: Task;
  storiesById: Map<string, Story>;
}) {
  const story = storiesById.get(task.story_id);
  const taskPageRef = `/task/${task.id}`;
  return (
    <div
      style={{
        borderRadius: "5px",
        outline: "2px solid grey",
        padding: "1rem",
        background: "var(--transp-white)",
      }}
    >
      <h3>{task.title}</h3>
      <CopyToClipboardButton value={taskPageRef}></CopyToClipboardButton>
      <a href={taskPageRef}>Edit</a>
      {!task.bulk_task && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {task.description}
        </ReactMarkdown>
      )}
      <a href={story?.id ?? "#"}>{story?.title ?? "-"}</a>
    </div>
  );
}
