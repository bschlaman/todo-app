import React from "react";
import ReactDOM from "react-dom/client";
import "../../css/tmp.tailwind.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Story, { loader as storyLoader } from "../../routes/story";
import StoriesRoot from "./stories";
import { getStories } from "../../ts/lib/api";
import { TasksProvider } from "../../contexts/TasksContext";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <StoriesRoot />,
      // errorElement: <ErrorPage />,
      loader: async () => await getStories(),
      // action: rootAction,
      children: [
        {
          index: true,
          element: (
            <div className="text-stone-600">
              Click on one of the stories to edit
            </div>
          ),
        },
        {
          path: "/story/:story_sqid",
          element: <Story />,
          loader: storyLoader,
        },
      ],
    },
  ],
  { basename: "/stories" },
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TasksProvider>
      <RouterProvider router={router} />
    </TasksProvider>
  </React.StrictMode>,
);
