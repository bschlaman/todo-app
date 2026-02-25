import { useState, useRef, useEffect } from "react";
import ErrorBanner from "../../components/banners";
import {
  getCommentsByTaskId,
  createComment,
  updateCommentById,
  uploadImage,
} from "../../ts/lib/api";
import { formatDate, handleCopyToClipboardHTTP } from "../../ts/lib/utils";
import type { Config, TaskComment } from "../../ts/model/entities";
import ReactMarkdownCustom, { ErrorBoundary } from "../../components/markdown";
import { makeTimedPageLoadApiCall } from "../../ts/lib/api_utils";
import { CopyIcon } from "../../components/copy_to_clipboard_components";
import { handleRawMDFormat } from "../../ts/lib/common";

export default function CommentsSection({
  taskId,
  taskMarkup,
  config,
}: {
  taskId: string;
  taskMarkup: string;
  // Config | null because we want this to be best-effort
  config: Config | null;
}) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [createCommentText, setCreateCommentText] = useState("");
  const [errors, setErrors] = useState<Error[]>([]);
  const [uploading, setUploading] = useState(false);
  // used to focus the element after comment creation
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // React does not know about window.location.hash,
  // so have to store this as state and pass it down to Comment components
  const [hash, setHash] = useState(window.location.hash);

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

  useEffect(() => {
    const handleHashChange = () => {
      // note that this triggers a whole page re-render, which can be felt
      // as a slight delay before page scroll
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Handle initial scroll when comments are loaded and there's a hash
  useEffect(() => {
    if (comments.length === 0) return;
    if (!hash) return;

    const commentId = hash.replace("#", "");
    if (!comments.some((comment) => comment.id.toString() === commentId))
      return;

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const element = document.getElementById(commentId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
  }, [comments, hash]);

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

  function handleUpdateComment(commentId: number, newText: string) {
    void (async () => {
      await updateCommentById(commentId, newText);
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
        <Comment
          key={comment.id}
          comment={comment}
          commentMarkup={`${taskMarkup}#${comment.id}`}
          onUpdate={handleUpdateComment}
          selected={hash === `#${comment.id}`}
          config={config}
        />
      ))}
      <div className="relative mt-4 rounded-md bg-zinc-100 p-4 outline-2 outline-solid dark:bg-zinc-600">
        <textarea
          className="my-4 h-48 w-full resize-y rounded-md p-4 dark:bg-zinc-900"
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") {
              handleCreateComment();
              return;
            }
            if (e.key === "Tab") {
              // preserving undo buffer currently has no alternative, see
              // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
              // so this is considered an acceptable use of deprecated API.
              e.preventDefault();
              document.execCommand("insertText", false, "    ");
            }
          }}
          onPaste={(e) => {
            for (const item of e.clipboardData.items) {
              if (!item.type.startsWith("image/")) continue;
              e.preventDefault();
              const file = item.getAsFile();
              if (!file) continue;
              setUploading(true);
              void (async () => {
                try {
                  const { url } = await uploadImage(file);
                  const mdImage = `![image](${url})`;
                  setCreateCommentText((prev) =>
                    prev ? `${prev}\n${mdImage}` : mdImage,
                  );
                } catch (err) {
                  console.error("image upload failed:", err);
                } finally {
                  setUploading(false);
                }
              })();
              break;
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
        <div className="flex gap-2">
          <button
            className="rounded-md bg-blue-500 p-1 text-zinc-100"
            onClick={handleCreateComment}
          >
            Post
          </button>
          <ImageUploadButton
            uploading={uploading}
            setUploading={setUploading}
            onUpload={(url) => {
              const mdImage = `![image](${url})`;
              setCreateCommentText((prev) =>
                prev ? `${prev}\n${mdImage}` : mdImage,
              );
            }}
          />
        </div>
        <p className="absolute right-4 bottom-2 font-thin">
          {createCommentText.length ?? 0} / {config?.comment_max_len}
        </p>
      </div>
    </>
  );
}

function Comment({
  comment,
  commentMarkup,
  selected,
  onUpdate,
  config,
}: {
  comment: TaskComment;
  commentMarkup: string;
  selected: boolean;
  onUpdate: (commentId: number, newText: string) => void;
  config: Config | null;
}) {
  const [rawMode, setRawMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

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
    <div
      id={comment.id.toString()}
      className={`relative mt-4 rounded-md p-4 pt-6 outline-2 transition-all duration-200 outline-solid ${
        selected
          ? "border-l-4 border-blue-500 bg-blue-50/80 ring-2 ring-blue-300/60 outline-blue-500 dark:bg-blue-900/30 dark:ring-blue-700/50 dark:outline-blue-400"
          : "outline-zinc-700"
      }`}
    >
      <button
        className={`absolute top-1 right-2 rounded px-2 py-0.5 text-sm font-thin text-zinc-600 transition-all duration-150 select-none ${
          copied
            ? "bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-200"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
        }`}
        title="Copy link to this comment"
        onClick={() => {
          handleCopyToClipboardHTTP(commentMarkup);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        type="button"
      >
        {copied ? "copied!" : comment.id}
      </button>
      <p className="absolute right-2 bottom-1 text-sm font-thin text-zinc-600 select-none">
        {formatDate(new Date(comment.created_at))}
        {comment.edited && " (edited)"}
      </p>
      <div className="group absolute top-1 left-2">
        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <p
            className="cursor-pointer text-sm font-thin italic select-none"
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
              className="cursor-pointer text-sm font-thin italic select-none hover:underline"
              onClick={() => {
                setIsEditing(true);
              }}
            >
              Edit
            </p>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="mt-4">
          <textarea
            className="h-48 w-full resize-y rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={config?.comment_max_len}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                handleSaveEdit();
                return;
              }
              if (e.key === "Tab") {
                // preserving undo buffer currently has no alternative, see
                // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
                // so this is considered an acceptable use of deprecated API.
                e.preventDefault();
                document.execCommand("insertText", false, "    ");
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
            <button
              className="rounded-md bg-blue-500 px-2 py-1 text-sm text-zinc-100"
              onClick={() => {
                if (!editTextareaRef.current) return;
                const formattedText = handleRawMDFormat(
                  editTextareaRef.current.value,
                );
                editTextareaRef.current.select(); // select all
                document.execCommand("insertText", false, formattedText);
              }}
            >
              Format
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

function ImageUploadButton({
  uploading,
  setUploading,
  onUpload,
}: {
  uploading: boolean;
  setUploading: (v: boolean) => void;
  onUpload: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    void (async () => {
      try {
        const { url } = await uploadImage(file);
        onUpload(url);
      } catch (err) {
        console.error("image upload failed:", err);
      } finally {
        setUploading(false);
        // Reset so re-selecting the same file triggers onChange again
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    })();
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        className="rounded-md bg-zinc-500 p-1 text-zinc-100"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        type="button"
      >
        {uploading ? "Uploading…" : "📎 Image 🖼"}
      </button>
    </>
  );
}
