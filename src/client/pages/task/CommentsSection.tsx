import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import ErrorBanner from "../../components/banners";
import { getCommentsByTaskId, createComment } from "../../ts/lib/api";
import { formatDate } from "../../ts/lib/utils";
import { TaskComment } from "../../ts/model/entities";
import "../../css/common.css";

export default function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [error, setError] = useState(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log("[CommentsSection] render count", renderCount.current);
  });

  useEffect(() => {
    void (async () => {
      await getCommentsByTaskId(taskId)
        .then((comments) => {
          setComments(comments);
        })
        .catch((e) => {
          setError(e.message);
        });
    })();
  }, [taskId]);

  if (error !== null) return <ErrorBanner message={error} />;

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
        <Comment key={comment.id} comment={comment}></Comment>
      ))}
      <div>
        <textarea
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") {
              handleCreateComment();
            }
          }}
          ref={inputRef}
          placeholder="Type new comment (ctrl+&#9166; to save)"
        ></textarea>
        <button onClick={handleCreateComment}>Post</button>
      </div>
    </>
  );
}

const commentMetadataStyle: React.CSSProperties = {
  color: "lightgrey",
  position: "absolute",
  right: "1rem",
  margin: "0.4rem",
  fontSize: "1rem",
};

function Comment({ comment }: { comment: TaskComment }) {
  return (
    <div
      style={{
        outline: "2px solid grey",
        borderRadius: "8px",
        padding: "1rem",
        position: "relative",
        margin: "1rem 0",
        fontSize: "1.5rem",
        background: "var(--transp-white)",
      }}
    >
      <div
        style={{
          display: "flex",
        }}
      >
        <p style={{ ...commentMetadataStyle, top: "1rem" }}>{comment.id}</p>
        <p style={{ ...commentMetadataStyle, bottom: "1rem" }}>
          {formatDate(new Date(comment.created_at))}
        </p>
      </div>
      <ReactMarkdown className="rendered-markdown">
        {comment.text}
      </ReactMarkdown>
    </div>
  );
}
