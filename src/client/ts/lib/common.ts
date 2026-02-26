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

export function handleRawMDFormat(content: string): string {
  return (
    content
      // per-line trailing tabs + spaces
      .replace(/[ \t]+$/gm, "")
      .trim()
      // latex macros
      .replace(/\\mathcal\{([A-Z])\}/g, "\\$1")
      .replace(/\\mathbb\{([ERPQ])\}/g, "\\$1$1")
      // inline $$...$$
      .replace(/\$\$[ \t]*(.+?)[ \t]*\$\$/g, "$$$$\n    $1\n$$$$")
  );
}
