import { useState } from "react";
import { handleCopyToClipboardHTTP } from "../ts/lib/utils";

const buttonStyles = {
  button: {
    border: "2px solid darkgrey",
    borderRadius: "4px",
    width: "100px",
  },
  greenBorder: {
    animation: "greenBorder 3s forwards",
  },
  // TODO: not currently working
  // need to make this a css module or not use keyframes
  greenBorderKeyframes: `
      @keyframes greenBorder {
        0% {
          border-color: transparent;
        }
        25% {
          border-top-color: limegreen;
        }
        50% {
          border-right-color: limegreen;
          border-top-color: limegreen;
        }
        75% {
          border-bottom-color: limegreen;
          border-right-color: limegreen;
          border-top-color: limegreen;
        }
        100% {
          border-color: limegreen;
        }
      }
    `,
};

export default function CopyToClipboardButton({ value }: { value: string }) {
  const [copyStatus, setCopyStatus] = useState(false);
  return (
    <button
      style={{
        ...buttonStyles.button,
        ...(copyStatus ? buttonStyles.greenBorder : {}),
      }}
      title={value}
      onClick={() => {
        void (async () => {
          try {
            handleCopyToClipboardHTTP(value);
            setCopyStatus(true);
            setTimeout(() => {
              setCopyStatus(false);
            }, 3000);
          } catch (e) {
            console.error(e);
          }
        })();
      }}
    >
      {copyStatus ? "✅" : "Copy to 📋"}
    </button>
  );
}

export function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    handleCopyToClipboardHTTP(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute right-2 top-2 cursor-pointer rounded border-0 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
        copied ? "bg-green-600" : "bg-gray-500"
      }`}
    >
      {copied ? "✓" : "📋"}
    </button>
  );
}
