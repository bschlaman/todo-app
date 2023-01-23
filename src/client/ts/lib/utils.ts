import { Sprint } from "../model/entities";

// UTIL FUNCTIONS

export function clearInputValues(...inputElements: Array<{ value: string }>) {
  inputElements.forEach((inputElement) => {
    inputElement.value = "";
  });
}

export function formatDate(date: Date) {
  return date.toDateString();
}

export function formatDateCompact(date: Date) {
  return `${date.getUTCMonth() + 1}.${date.getUTCDate()}`;
}

export function sprintToString(sprint: Sprint) {
  return `${sprint.title} (${formatDateCompact(
    new Date(sprint.start_date)
  )} - ${formatDateCompact(new Date(sprint.end_date))})`;
}

export function formatId(id: string) {
  // expect postgres style id
  if (id.split("-").length !== 5)
    console.error("id seems to be wrong format:", id);
  return String(id.split("-")[0]) + "...";
}
