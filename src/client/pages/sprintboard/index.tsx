import React from "react";
import ReactDOM from "react-dom/client";
import SprintboardPage from "./SprintboardPage";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <SprintboardPage />
    </LocalizationProvider>
  </React.StrictMode>,
);
