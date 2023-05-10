import React, { useState } from "react";

const buttonStyles = {
  button: {
    border: "2px solid lightgrey",
    borderRadius: "4px",
    width: "100px",
  },
  greenBorder: {
    animation: "greenBorder 3s forwards",
  },
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

// this function is a workaround that provides
// copy-to-clipboard functionality without using the
// ClipboardAPI, which only works over HTTPS
function handleCopyHTTP(content: string) {
  const textarea = document.createElement("textarea");
  textarea.textContent = content;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function CopyToClipboardButton({ value }: { value: string }) {
  const [copyStatus, setCopyStatus] = useState(false);
  return (
    <button
      style={{
        ...buttonStyles.button,
        ...(copyStatus ? buttonStyles.greenBorder : {}),
      }}
      onClick={() => {
        void (async () => {
          try {
            // TODO: workaround!  Remove when possible
            if (navigator.clipboard !== undefined) {
              await navigator.clipboard.writeText(value);
            } else {
              handleCopyHTTP(value);
            }
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
