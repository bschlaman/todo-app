import { checkSession } from "./api";

export const TAG_COLORS = {
  "Todo App": "green",
  Work: "blue",
  Music: "red",
  "Research Dashboard": "darkgoldenrod",
  Life: "purple",
  Piano: "darkgrey",
  Guitar: "brown",
  "Intellectual Pursuits": "darkblue",
  "Machine Learning": "darkred",
  "Career and Brand": "indigo",
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
        span.outerHTML
      );
    }
  }

  for (const [{ elem, match }, spanContent] of domUpdatesQueue) {
    elem.innerHTML = elem.innerHTML.replace(match, spanContent);
  }
}
