import React from "react";

const createButtonStyles: React.CSSProperties = {
  outline: "1px solid lightgreen",
  borderRadius: "4px",
};

export function CreateTaskButton() {
  return <button style={createButtonStyles}>+ Task</button>;
}

export function CreateStoryButton() {
  return <button style={createButtonStyles}>+ Story</button>;
}

export function CreateSprintButton() {
  return <button style={createButtonStyles}>+ Sprint</button>;
}

export function CreateBulkTaskButton() {
  return <button style={createButtonStyles}>+ Bulk Task</button>;
}
