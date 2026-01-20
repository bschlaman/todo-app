import { TASK_STATUS } from "../model/entities";

export const TAG_COLORS = {
  "Todo App": "crimson",
  Work: "blue",
  Music: "red",
  "Research Dashboard": "darkgoldenrod",
  Life: "purple",
  Piano: "darkgrey",
  Guitar: "brown",
  "Intellectual Pursuits": "darkblue",
  "Machine Learning": "darkred",
  "Career and Brand": "indigo",
  CQF: "darkgreen",
  "CVE Engine": "black",
  "Chess Engine": "lightgrey",
  "Grad School": "DarkSlateGray",
  "Data-Model Structure Research": "DarkOrange",
  Finances: "#1eaa3a",
} as const;

export const DEFAULT_TAG_COLOR = "Red";

export function statusColorMap(status: TASK_STATUS): string {
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

// since tasks may not have a parent story, we need something
// to display as a stand-in in UI elements such as task cards
// and the story selector during task creation.  Note that this
// value is also used as "value" in story selector options as a
// standin for null
export const NULL_STORY_IDENTIFIER = "NONE";

export const hoverClass = "droppable-hover";

// detect when user navigates back to page and check
// if the session is still valid
// document.addEventListener("visibilitychange", (_) => {
//   if (document.visibilityState === "visible") {
//     void checkSession().then((res) => {
//       console.log(
//         "session time remaining:",
//         formatSeconds(res.session_time_remaining_seconds)
//       );
//     });
//   }
// });

// must be called after the api calls!
export function replaceDateTextsWithSpans() {
  const isoDateRegex = /\d{4}[-.]\d{2}[-.]\d{2}/g;

  // since we cant change an element's parent's innerHTML
  // during tree traversal, we store a ref to it and update it
  // later.  We assume that no two text nodes share a parent

  const domUpdatesQueue = new Map<
    { elem: HTMLElement; match: string },
    string
  >();

  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  let node;
  while ((node = tw.nextNode()) !== null) {
    if (node.parentElement === null) continue;

    const matches = (node.textContent as string).match(isoDateRegex);
    if (matches === null) continue;
    // technically, we don't have to do this, since
    // storing updates in a map already guarantees
    // uniqueness of the (elem, match) tuple
    const uniqueMatches = new Set(matches);

    for (const match of uniqueMatches) {
      const span = document.createElement("span");
      span.setAttribute("data-iso-date", match);
      span.textContent = match;
      domUpdatesQueue.set(
        {
          elem: node.parentElement,
          match,
        },
        span.outerHTML,
      );
    }
  }

  for (const [{ elem, match }, spanContent] of domUpdatesQueue) {
    elem.innerHTML = elem.innerHTML.replace(match, spanContent);
  }
}
