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
    <main className="flex h-dvh items-center justify-center">
      <form
        className="w-[30rem] rounded-lg p-10 shadow-lg outline outline-2 outline-emerald-500"
        action={routes.login.path}
        method={routes.login.method}
      >
        <label className="font-bold text-emerald-800" htmlFor="pass">
          Enter Password
        </label>
        <input
          className="my-4 block w-full rounded-md bg-zinc-200 p-4"
          autoFocus
          type="password"
          required
          name="pass"
        />
        <button className="rounded-md bg-emerald-800 p-4 font-bold text-white shadow-lg">
          Login
        </button>
      </form>
    </main>
  );
}
