import { TASK_STATUS, type Sprint, type Task } from "../model/entities";

// UTIL FUNCTIONS

export function statusColorMap(status: TASK_STATUS): string {
  // Made colors less bright/more muted
  switch (status) {
    case TASK_STATUS.DONE:
      return "#1a682a"; // Darker green
    case TASK_STATUS.DOING:
      return "#084d92"; // Darker blue
    case TASK_STATUS.BACKLOG:
      return "#5a6169"; // Slightly darker gray
    case TASK_STATUS.DEPRIORITIZED:
      return "#cc9a00"; // Darker yellow
    case TASK_STATUS.ARCHIVE:
      return "#138496"; // Darker teal
    case TASK_STATUS.DUPLICATE:
      return "#342176";
    case TASK_STATUS["DEADLINE PASSED"]:
      return "#b02a37"; // Darker red
    default:
      return "#5a6169";
  }
}

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

export function formatDateCompact(date: Date) {
  return `${date.getUTCMonth() + 1}.${date.getUTCDate()}`;
}

export function sprintToString(sprint: Sprint) {
  return `${sprint.title} (${formatDateCompact(
    new Date(sprint.start_date),
  )} - ${formatDateCompact(new Date(sprint.end_date))})`;
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

export function isDarkMode() {
  return !!window.matchMedia("(prefers-color-scheme: dark)").matches;
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
