import React from "react";
import ReactDOM from "react-dom/client";
import "../../css/tmp.tailwind.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Story, { loader as storyLoader } from "../../routes/story";
import StoriesRoot from "./stories";
import { getStories } from "../../ts/lib/api";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <StoriesRoot />,
      // errorElement: <ErrorPage />,
      loader: async () => await getStories(),
      // action: rootAction,
      children: [
        { index: true, element: <div>click on the stories below</div> },
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
    <RouterProvider router={router} />
  </React.StrictMode>,
);
