import React from "react";
import ReactDOM from "react-dom/client";
import SprintboardPage from "./SprintboardPage";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import "../../css/tmp.tailwind.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider
        // required for automatic dark mode
        theme={createTheme({
          colorSchemes: {
            dark: true,
          },
        })}
      >
        <SprintboardPage />
      </ThemeProvider>
    </LocalizationProvider>
  </React.StrictMode>,
);
