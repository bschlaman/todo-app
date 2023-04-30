import React, { useEffect, useRef } from "react";

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
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  return (
    <div className="login-wrapper">
      <form action={routes.login.path} method={routes.login.method}>
        <label htmlFor="pass">Enter Password:</label>
        <input type="password" required name="pass" ref={passwordInputRef} />
        <button>Login</button>
      </form>
    </div>
  );
}
