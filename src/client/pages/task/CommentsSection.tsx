import React, { useState, useRef, useEffect } from "react";
import ErrorBanner from "../../components/banners";
import { getCommentsByTaskId, createComment } from "../../ts/lib/api";
import { formatDate } from "../../ts/lib/utils";
import { Config, TaskComment } from "../../ts/model/entities";
import "../../css/common.css";
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
        "setComments"
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
      // TODO (2024.04.08): currently not working well; can't get the whole element in view.
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    })();
  }

  return (
    <>
      {comments.map((comment) => (
        // TODO (2023.05.15): using an integer id (as is also the case with tag_assignments)
        // is a bad idea, since it may conflict with other entities
        <Comment key={comment.id} comment={comment}></Comment>
      ))}
      <div style={commentBox}>
        <textarea
          style={{
            width: "100%",
            borderRadius: "8px",
            resize: "none",
            padding: "1rem",
            margin: "1rem 0",
          }}
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
          style={{
            color: "var(--transp-white)",
            fontSize: "1.3rem",
            borderRadius: "6px",
            background: "var(--color3)",
            padding: "0.3rem 0.6rem",
          }}
          onClick={handleCreateComment}
        >
          Post
        </button>
        <p
          style={{
            fontWeight: "lighter",
            fontSize: "1.2rem",
            position: "absolute",
            bottom: "0.5rem",
            right: "1rem",
          }}
        >
          {createCommentText.length ?? 0} / {config?.comment_max_len}
        </p>
      </div>
    </>
  );
}

// for comments and new comment div
const commentBox: React.CSSProperties = {
  position: "relative",
  outline: "2px solid grey",
  borderRadius: "8px",
  padding: "1rem",
  margin: "1rem 0",
  fontSize: "1.5rem",
  background: "var(--transp-white)",
};

const commentMetadataStyle: React.CSSProperties = {
  position: "absolute",
  color: "lightgrey",
  right: "1rem",
  margin: "0.4rem",
  fontSize: "1rem",
};

function Comment({ comment }: { comment: TaskComment }) {
  const [rawMode, setRawMode] = useState(false);

  return (
    <div style={commentBox}>
      <div
        style={{
          display: "flex",
        }}
      >
        <p style={{ ...commentMetadataStyle, top: "0.5rem" }}>{comment.id}</p>
        <p style={{ ...commentMetadataStyle, bottom: "0.5rem" }}>
          {formatDate(new Date(comment.created_at))}
        </p>
        <p
          style={{
            ...commentMetadataStyle,
            left: "0.5rem",
            top: "0.5rem",
            fontStyle: "italic",
            userSelect: "none",
            textDecoration: rawMode ? "underline" : "none",
          }}
          onClick={() => {
            setRawMode((rm) => !rm);
          }}
        >
          Raw
        </p>
      </div>
      {rawMode ? (
        <div style={{ whiteSpace: "pre-wrap", margin: "2rem 0" }}>
          {comment.text}
        </div>
      ) : (
        <ReactMarkdownCustom content={comment.text} />
      )}
    </div>
  );
}
