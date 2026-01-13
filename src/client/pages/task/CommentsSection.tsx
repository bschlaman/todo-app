import { useState, useRef, useEffect } from "react";
import ErrorBanner from "../../components/banners";
import {
  getCommentsByTaskId,
  createComment,
  updateCommentById,
} from "../../ts/lib/api";
import { formatDate } from "../../ts/lib/utils";
import type { Config, TaskComment } from "../../ts/model/entities";
import ReactMarkdownCustom, { ErrorBoundary } from "../../components/markdown";
import { makeTimedPageLoadApiCall } from "../../ts/lib/api_utils";
import { CopyIcon } from "../../components/copy_to_clipboard_components";

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

  function handleUpdateComment(commentId: string, newText: string) {
    void (async () => {
      await updateCommentById(parseInt(commentId), newText);
      // Update the comment locally in state instead of fetching all comments
      setComments((comments) =>
        comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, text: newText, edited: "true" }
            : comment,
        ),
      );
    })();
  }

  return (
    <>
      {comments.map((comment) => (
        // TODO (2023.05.15): using an integer id (as is also the case with tag_assignments)
        // is a bad idea, since it may conflict with other entities
        <Comment
          key={comment.id}
          comment={comment}
          onUpdate={handleUpdateComment}
          config={config}
        />
      ))}
      <div className="relative mt-4 rounded-md bg-zinc-100 p-4 outline outline-2 dark:bg-zinc-600">
        <textarea
          className="my-4 w-full resize-y rounded-md p-4 dark:bg-zinc-900"
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
          className="rounded-md bg-blue-500 p-1 text-zinc-100"
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

function Comment({
  comment,
  onUpdate,
  config,
}: {
  comment: TaskComment;
  onUpdate: (commentId: string, newText: string) => void;
  config: Config | null;
}) {
  const [rawMode, setRawMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus the textarea when editing, and place the cursor at the end of the content
  useEffect(() => {
    if (!isEditing) return;
    if (editTextareaRef.current === null) return;
    editTextareaRef.current.focus();
    editTextareaRef.current.selectionStart =
      editTextareaRef.current.value.length;
    editTextareaRef.current.selectionEnd = editTextareaRef.current.value.length;
  }, [isEditing]);

  function handleSaveEdit() {
    if (editText.trim() === "") return;
    onUpdate(comment.id, editText);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditText(comment.text);
    setIsEditing(false);
  }

  return (
    <div className="relative mt-4 rounded-md p-4 pt-6 outline outline-2 outline-zinc-700">
      <p className="absolute right-2 top-1 select-none text-sm font-thin">
        {comment.id}
      </p>
      <p className="absolute bottom-1 right-2 select-none text-sm font-thin">
        {formatDate(new Date(comment.created_at))}
        {comment.edited && " (edited)"}
      </p>
      <div className="absolute left-2 top-1 flex gap-2">
        <p
          className="cursor-pointer select-none text-sm font-thin italic"
          style={{
            textDecoration: rawMode ? "underline" : "none",
          }}
          onClick={() => {
            setRawMode((rm) => !rm);
          }}
        >
          Raw
        </p>
        {!isEditing && (
          <p
            className="cursor-pointer select-none text-sm font-thin italic hover:underline"
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Edit
          </p>
        )}
      </div>
      {isEditing ? (
        <div className="mt-4">
          <textarea
            className="h-32 w-full resize-y rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={config?.comment_max_len}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                handleSaveEdit();
              }
            }}
            ref={editTextareaRef}
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-md bg-green-500 px-2 py-1 text-sm text-zinc-100"
              onClick={handleSaveEdit}
            >
              Save
            </button>
            <button
              className="rounded-md bg-gray-500 px-2 py-1 text-sm text-zinc-100"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
          <p className="mt-1 text-right text-sm font-thin">
            {editText.length} / {config?.comment_max_len}
          </p>
        </div>
      ) : (
        <>
          {rawMode ? (
            <div className="group relative">
              <div className="whitespace-pre-wrap">{comment.text}</div>
              <CopyIcon text={comment.text} />
            </div>
          ) : (
            <ErrorBoundary>
              <ReactMarkdownCustom content={comment.text} />
            </ErrorBoundary>
          )}
        </>
      )}
    </div>
  );
}
