import React, { useState, useRef, useEffect } from "react";
import ErrorBanner from "../../components/banners";
import { getCommentsByTaskId, createComment } from "../../ts/lib/api";
import { formatDate } from "../../ts/lib/utils";
import { Config, TaskComment } from "../../ts/model/entities";
import ReactMarkdownCustom from "../../components/markdown";
import { makeTimedPageLoadApiCall } from "../../ts/lib/api_utils";

export default function CommentsSection({
  taskId,
  config,
}: {
  taskId: string;
  // Config | null because we want this to be best-effort
  config: Config | null;
}) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [createCommentText, setCreateCommentText] = useState("");
  const [errors, setErrors] = useState<Error[]>([]);
  // used to focus the element after comment creation
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // As of 2024.04.08, I switched to storing the textarea's value as state.
  // This causes a lot of re-rendering, so only console log every 100.
  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    if (renderCount.current % 100 !== 0) return;
    console.log("[CommentsSection] render count", renderCount.current);
  });

  useEffect(() => {
    void (async () => {
      await makeTimedPageLoadApiCall(
        // wrapping the api call since I need to pass in a param
        async () => await getCommentsByTaskId(taskId),
        setErrors,
        setComments,
        "setComments",
      );
    })();
  }, [taskId]);

  if (errors.length > 0) return <ErrorBanner errors={errors} />;

  function handleCreateComment() {
    void (async () => {
      if (createCommentText.trim() === "") return;
      const comment = await createComment(taskId, createCommentText);
      setComments([...comments, comment]);
      setCreateCommentText("");
      inputRef.current?.focus();
      // Small delay required make this work (perhaps something to do with render scheduling)
      setTimeout(() => {
        inputRef.current?.parentElement?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    })();
  }

  return (
    <>
      {comments.map((comment) => (
        // TODO (2023.05.15): using an integer id (as is also the case with tag_assignments)
        // is a bad idea, since it may conflict with other entities
        <Comment key={comment.id} comment={comment}></Comment>
      ))}
      <div className="relative mt-4 rounded-md bg-zinc-100 p-4 outline outline-2">
        <textarea
          className="my-4 w-full resize-none rounded-md p-4"
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") {
              handleCreateComment();
            }
          }}
          ref={inputRef}
          onChange={(e) => {
            setCreateCommentText(e.target.value);
          }}
          value={createCommentText}
          placeholder="Type new comment (ctrl+&#9166; to save)"
          maxLength={config?.comment_max_len}
          autoFocus
        />
        <button
          className="rounded-md bg-blue-500 p-1 text-slate-100"
          onClick={handleCreateComment}
        >
          Post
        </button>
        <p className="absolute bottom-2 right-4 font-thin">
          {createCommentText.length ?? 0} / {config?.comment_max_len}
        </p>
      </div>
    </>
  );
}

function Comment({ comment }: { comment: TaskComment }) {
  const [rawMode, setRawMode] = useState(false);

  return (
    <div className="relative mt-4 rounded-md p-4 pt-6 outline outline-2 outline-slate-700">
      <p className="absolute right-2 top-1 text-sm font-thin">{comment.id}</p>
      <p className="absolute bottom-1 right-2 text-sm font-thin">
        {formatDate(new Date(comment.created_at))}
      </p>
      <p
        className="absolute left-2 top-1 select-none text-sm font-thin italic"
        style={{
          textDecoration: rawMode ? "underline" : "none",
        }}
        onClick={() => {
          setRawMode((rm) => !rm);
        }}
      >
        Raw
      </p>
      {rawMode ? (
        <div className="whitespace-pre-wrap">{comment.text}</div>
      ) : (
        <ReactMarkdownCustom content={comment.text} />
      )}
    </div>
  );
}
