import React, { useState, useRef, useEffect } from "react";
import ErrorBanner from "../../components/banners";
import { getCommentsByTaskId, createComment } from "../../ts/lib/api";
import { formatDate } from "../../ts/lib/utils";
import { TaskComment } from "../../ts/model/entities";
import "../../css/common.css";
import ReactMarkdownCustom from "../../components/markdown";
import { makeTimedPageLoadApiCall } from "../../ts/lib/api_utils";

export default function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
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
      if (inputRef.current?.value === undefined) return;
      if (inputRef.current?.value.trim() === "") return;
      const comment = await createComment(taskId, inputRef.current.value);
      setComments([...comments, comment]);
      inputRef.current.value = "";
      inputRef.current.focus();
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
          placeholder="Type new comment (ctrl+&#9166; to save)"
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
