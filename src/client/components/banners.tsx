import React from "react";

export default function ErrorBanner({ errors }: { errors: Error[] }) {
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
      <ul>
        {errors.map((e) => (
          <li key={e.message}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}
