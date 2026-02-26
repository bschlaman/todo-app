import { handleRawMDFormat } from "../ts/lib/common";

export default function FormatMarkdownButton({
  textareaRef,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <button
      type="button"
      aria-label="Format markdown"
      onClick={() => {
        if (!textareaRef.current) return;
        const formattedText = handleRawMDFormat(textareaRef.current.value);
        textareaRef.current.select(); // select all
        document.execCommand("insertText", false, formattedText);
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-200 focus:ring-2 focus:ring-zinc-400 focus:outline-none active:bg-zinc-300"
    >
      <span
        aria-hidden="true"
        className="font-mono leading-none tracking-tight select-none"
      >
        md
      </span>
    </button>
  );
}
