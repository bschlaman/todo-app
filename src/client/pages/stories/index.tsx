import React from "react";
import ReactDOM from "react-dom/client";
import "../../css/tmp.tailwind.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Story, { loader as storyLoader } from "../../routes/story";
import Stories, { loader as storiesLoader, StoriesRoot } from "./stories";

const router = createBrowserRouter([
  {
    path: "/stories",
    element: <StoriesRoot />,
    // errorElement: <ErrorPage />,
    loader: storiesLoader,
    // action: rootAction,
    children: [
      { index: true, element: <Stories /> },
      {
        path: "/stories/story/:story_id",
        element: <Story />,
        loader: storyLoader,
      },
    ],
    // children: [
    //   { index: true, element: <Index /> },
    //   {
    //     path: "stories/:story_id/edit",
    //     element: <EditStory />,
    //     loader: storyLoader,
    //     action: editAction,
    //   },
    // ]
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
