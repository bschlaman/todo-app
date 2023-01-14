import { checkSession } from "./api";

// TODO 2022.11.19: make this an enum or type
export const STATUSES = [
  "BACKLOG",
  "DOING",
  "DONE",
  "DEPRIORITIZED",
  "ARCHIVE",
  "DUPLICATE",
  "DEADLINE PASSED",
];

export const TAG_COLORS = {
  "Todo App": "green",
  Work: "blue",
  Music: "red",
  "Chess Engine": "darkgoldenrod",
  Life: "purple",
  Piano: "darkgrey",
  Guitar: "brown",
  "Intellectual Pursuits": "darkblue",
  "Machine Learning": "darkred",
} as const;

// since tasks may not have a parent story, we need something
// to display as a stand-in in UI elements such as task cards
// and the story selector during task creation.  Note that this
// value is also used as "value" in story selector options as a
// standin for null
export const NULL_STORY_IDENTIFIER = "NONE";

export const hoverClass = "droppable-hover";

// detect when user navigates back to page and check
// if the session is still valid
document.addEventListener("visibilitychange", (_) => {
  if (document.visibilityState === "visible") {
    void checkSession().then((res) => {
      console.log(
        "session time remaining (s):",
        res.session_time_remaining_seconds
      );
    });
  }
});
