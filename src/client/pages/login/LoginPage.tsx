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
    <>
      <form action={routes.login.path} method={routes.login.method}>
        <label htmlFor="pass">Enter Password:</label>
        <input autoFocus type="password" required name="pass" />
        <button>Login</button>
      </form>
    </>
  );
}
