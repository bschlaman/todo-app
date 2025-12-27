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
      className="w-28 rounded border-2 border-gray-400 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition-all duration-300 ease-in-out hover:border-gray-500 hover:bg-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-400 dark:hover:bg-gray-600"
      style={copyStatus ? successStyles : undefined}
      title={value}
      onClick={() => {
        handleCopyToClipboardHTTP(value);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 3000);
      }}
    >
      {copyStatus ? "✅" : "Copy to 📋"}
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
      className={`absolute right-2 top-2 cursor-pointer rounded border-0 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
        copied ? "bg-green-600" : "bg-gray-500"
      }`}
    >
      {copied ? "✓" : "📋"}
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
