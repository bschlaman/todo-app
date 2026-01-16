import { useState } from "react";
import { handleCopyToClipboardHTTP } from "../ts/lib/utils";

const successStyles = {
  borderColor: "#10b981",
  backgroundColor: "#dcfce7",
  color: "#166534",
};

export function CopyToClipboardButton({ value }: { value: string }) {
  const [copyStatus, setCopyStatus] = useState(false);
  return (
    <button
      className="rounded-sm border border-gray-300 bg-transparent px-2 py-1 text-xs text-gray-500 opacity-60 transition-all duration-300 ease-in-out hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:opacity-100 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      style={copyStatus ? successStyles : undefined}
      title={value}
      onClick={() => {
        handleCopyToClipboardHTTP(value);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 3000);
      }}
    >
      {copyStatus ? "✅" : "📋"}
    </button>
  );
}

export function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        handleCopyToClipboardHTTP(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }}
      className={`font-mono absolute right-2 top-2 cursor-pointer rounded border-0 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
        copied ? "bg-green-600" : "bg-gray-500"
      }`}
    >
      {copied ? "✓" : "⏍"}
    </button>
  );
}

export function CopyDateButton() {
  const [copied, setCopied] = useState(false);

  const isoDate = new Date().toISOString().split("T")[0]!.replaceAll("-", ".");

  return (
    <button
      className={`rounded px-2 py-1 text-xs transition-colors ${
        copied
          ? "bg-green-600 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
      onClick={() => {
        handleCopyToClipboardHTTP(isoDate);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }}
      type="button"
      title="Copy today's date in ISO format"
    >
      {copied ? (
        "✓ Copied"
      ) : (
        <>
          📅 copy <strong>{isoDate}</strong>
        </>
      )}
    </button>
  );
}
