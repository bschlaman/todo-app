import React from "react";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "#ffcccb",
        borderRadius: "0.5rem",
        padding: "1rem",
        border: "2px solid red",
        fontSize: "1rem",
        marginBottom: "1rem",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}
