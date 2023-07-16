import React from "react";
import { TASK_CREATE_ATTRIBUTES } from "../ts/model/constants";

export default function DownloadCSVButton() {
  return (
    <button
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
      Batch Task CSV
    </button>
  );
}
