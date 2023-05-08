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
            await navigator.clipboard.writeText(value);
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
