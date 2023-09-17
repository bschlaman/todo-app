import React from "react";

enum HttpMethod {
  POST = "POST",
  GET = "GET",
}

interface Route {
  path: string;
  method: HttpMethod;
}

const routes: { login: Route } = {
  login: { path: "/api/login", method: HttpMethod.POST },
};

export default function LoginPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        style={{
          borderRadius: "8px",
          // TODO: consider using --color3 or making this --color3
          boxShadow: "rgba(72, 135, 202, 0.8) 0 0 10px 3px",
          fontSize: "3rem",
          padding: "3rem",
          transform: "translateY(-8rem)",
        }}
        action={routes.login.path}
        method={routes.login.method}
      >
        <label htmlFor="pass">Enter Password</label>
        <input
          style={{
            display: "block",
            margin: "1rem 0",
            padding: "0.8rem",
            borderRadius: "8px",
          }}
          autoFocus
          type="password"
          required
          name="pass"
        />
        <button
          style={{
            background: "rgb(72, 135, 202)",
            color: "var(--transp-white)",
            padding: "1rem 1.5rem",
            borderRadius: "5px",
            border: "none",
            boxShadow: "0 0 6px rgba(0, 0, 0, 0.2)",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
