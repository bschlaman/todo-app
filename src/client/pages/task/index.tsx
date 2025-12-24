import React from "react";
import ReactDOM from "react-dom/client";
import TaskPage from "./TaskPage";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { TasksProvider } from "../../contexts/TasksContext";
import "../../css/tmp.tailwind.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TasksProvider>
      <ThemeProvider
        // required for automatic dark mode
        theme={createTheme({
          colorSchemes: {
            dark: true,
          },
        })}
      >
        <TaskPage />
      </ThemeProvider>
    </TasksProvider>
  </React.StrictMode>,
);
