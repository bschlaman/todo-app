# <div align="center" style="font-weight: 400; background: Maroon; padding: 1rem; border-radius: 1rem">Brendan Schlaman | `todo-app` v2.0 🚀</div>

## How to develop

1. set env `DEV_MODE=true`
1. run `npx webpack serve`
1. navigate to e.g. `localhost:8080/login` to set session
1. currently, UI does not redirect correctly, so navigate to desired url, e.g. `localhost:8080/sprintboard`

## Metrics

TODO: document metrics strategy

## Design quirks

- 2024.01.25: the functions in `src/server/middleware.go` aren't themselves middleware;
  rather, they _return_ middlewares (`utils.Middleware`).
  Nevertheless, I'll stick to the naming convention `xyzMiddleware` for simplicity
