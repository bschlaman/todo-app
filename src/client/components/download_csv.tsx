import React from "react";
import { TASK_CREATE_ATTRIBUTES } from "../ts/model/constants";
import { Button } from "@mui/material";

export default function DownloadCSVButton({
  style,
}: {
  style: React.CSSProperties;
}) {
  return (
    <Button
      variant="contained"
      color="secondary"
      style={style}
      onClick={() => {
        const csvContent =
          "data:text/csv;charset=utf-8," + TASK_CREATE_ATTRIBUTES.join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tasks.csv");

        link.click();
      }}
    >
      Download CSV Template
    </Button>
  );
}
