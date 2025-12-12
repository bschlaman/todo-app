import type { Sprint, Task } from "../model/entities";

// UTIL FUNCTIONS (PURE)

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
