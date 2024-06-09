import React from "react";
import ReactDOM from "react-dom/client";
import TaskPage from "./TaskPage";
import "../../css/tmp.tailwind.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TaskPage />
  </React.StrictMode>,
);
