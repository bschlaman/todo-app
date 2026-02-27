import type { Sprint, Task } from "../model/entities";

// UTIL FUNCTIONS

export function clearInputValues(...inputElements: Array<{ value: string }>) {
  inputElements.forEach((inputElement) => {
    inputElement.value = "";
  });
}

export function formatDate(date: Date) {
  return date.toDateString();
}

// Takes in a number of seconds and converts to a human readable time
export function formatSeconds(seconds: number) {
  const roundFn = seconds < 0 ? Math.ceil : Math.floor;
  return `${roundFn(seconds / 3600)}h ${roundFn((seconds % 3600) / 60)}m ${
    seconds % 60
  }s`;
}

function formatISODateCompact(date: string) {
  const [, month = "0", day = "0"] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}

export function sprintToString(sprint: Sprint) {
  return `${sprint.title} (${formatISODateCompact(
    sprint.start_date,
  )} - ${formatISODateCompact(sprint.end_date)})`;
}

export function formatId(id: string) {
  // expect postgres style id
  if (id.split("-").length !== 5)
    console.error("id seems to be wrong format:", id);
  return String(id.split("-")[0]) + "...";
}

export function inProgress(task: Task) {
  return ["BACKLOG", "DOING"].includes(task.status);
}

// this function is a workaround that provides
// copy-to-clipboard functionality without using the
// ClipboardAPI, which only works over HTTPS or localhost
export async function handleCopyToClipboardHTTP(content: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.textContent = content;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
