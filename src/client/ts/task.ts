import "../css/styles.css";
import {
  createComment,
  getCommentsByTaskId,
  getConfig,
  getSprints,
  getStories,
  getTaskById,
  setErrorMessageParentDiv,
  updateTaskById,
} from "./lib/api";
import { NULL_STORY_IDENTIFIER, replaceDateTextsWithSpans } from "./lib/common";
import { clearInputValues, formatDate, formatId } from "./lib/utils";
import {
  Config,
  Sprint,
  Story,
  Task,
  TaskComment,
  STATUSES,
} from "./model/entities";

import DOMPurify from "dompurify";
import { marked } from "marked";

const path = window.location.pathname;
const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

// tells common.ts where to place the error message
setErrorMessageParentDiv(
  document.querySelector(".error-message-parent") as HTMLDivElement
);

// query DOM objects
const taskTitle = document.querySelector(".task-title") as HTMLHeadingElement;
const taskId = document.querySelector(".task-id") as HTMLParagraphElement;
const taskCreatedAt = document.querySelector(
  ".task-created-at"
) as HTMLParagraphElement;
const taskStatus = document.querySelector(".task-status") as HTMLSelectElement;
const taskDesc = document.querySelector(".task-desc") as HTMLDivElement;
const taskDescPreview = document.querySelector(
  ".task-desc-preview"
) as HTMLDivElement;
const taskStorySelector = document.querySelector(
  ".task-story-selector"
) as HTMLSelectElement;
const taskComments = document.querySelector(".task-comments") as HTMLDivElement;
const taskSave = document.querySelector(".task-save") as HTMLButtonElement;

const taskDescPreviewToggle = document.querySelector(
  ".task-desc-preview-toggle"
) as HTMLInputElement;
const taskDescPreviewLabel = taskDescPreviewToggle.querySelector(
  "label"
) as HTMLLabelElement;
const taskDescCheckBox = taskDescPreviewToggle.querySelector(
  "input"
) as HTMLInputElement;

const createCommentForm = document.querySelector(
  ".new-comment form"
) as HTMLFormElement;
const createCommentTextInput = createCommentForm.querySelector(
  "textarea"
) as HTMLTextAreaElement;
const createCommentCharIndicator = createCommentForm.querySelector(
  ".char-indicator"
) as HTMLParagraphElement;
const createCommentButton = createCommentForm.querySelector(
  "button"
) as HTMLButtonElement;

let serverConfig: Config = {}; // not exactly sure how to fix this in ts yet
// stores story data by story_id
const storyDataCache = new Map<string, Story>();
// stores sprint data by sprint_id
const sprintDataCache = new Map<string, Sprint>();

// renderTask depends on these being set
STATUSES.forEach((status) => {
  const option = document.createElement("option");
  option.setAttribute("value", status);
  option.textContent = status;
  taskStatus.appendChild(option);
});

console.time("api_calls");
await Promise.all([
  getConfig().then((config) => {
    serverConfig = config;
  }),
  getCommentsByTaskId(taskIdFromPath).then((comments) => {
    renderCommentsFromJSON(comments);
  }),
  getSprints().then((sprints) => {
    sprints.forEach((sprint) => {
      sprintDataCache.set(sprint.id, sprint);
    });
  }),
  getStories().then((stories) => {
    stories.forEach((story) => {
      storyDataCache.set(story.id, story);
    });
  }),
]);
// renderTask depends on:
// 1) serverConfig
// 2) storyDataCache and sprintDataCache
// 3) status selector options
await getTaskById(taskIdFromPath).then((task) => {
  renderTask(task);
});
console.timeEnd("api_calls");
console.table(serverConfig);

// configure the "preview" checkbox and div
taskDescCheckBox.checked = true; // checked on page load
taskDescPreviewLabel.onclick = (_) => {
  taskDescCheckBox.click();
};
taskDesc.style.display = "none";
taskDescPreview.style.display = "block";
taskDescCheckBox.addEventListener("change", (_) => {
  taskDescPreview.innerHTML = DOMPurify.sanitize(
    marked.parse(taskDesc.innerText)
  );
  if (taskDescCheckBox.checked) {
    taskDesc.style.display = "none";
    taskDescPreview.style.display = "block";
  } else {
    taskDesc.style.display = "block";
    taskDescPreview.style.display = "none";
  }
});

taskSave.addEventListener("click", (_) => {
  void updateTaskById(
    taskIdFromPath,
    taskStatus.value,
    taskTitle.innerText.trim(), // no newlines should be present
    taskDesc.innerText, // possible newlines
    taskStorySelector.value === NULL_STORY_IDENTIFIER
      ? null
      : taskStorySelector.value
  ).then((_) => {
    location.reload();
  });
});

// TODO (2022.09.29): ideally, I grab the whole url, but for now that is a security concern
const copyToClipboardButton = document.querySelector(
  ".copy-to-clipboard"
) as HTMLButtonElement;
copyToClipboardButton.onclick = (_) => {
  void navigator.clipboard.writeText(window.location.pathname);
};

createCommentForm.addEventListener("submit", (e) => {
  e.preventDefault(); // prevent submit default behavior
  void createComment(taskIdFromPath, String(createCommentTextInput.value)).then(
    (_) => {
      clearInputValues(createCommentTextInput);
      void getCommentsByTaskId(taskIdFromPath).then((comments) => {
        renderCommentsFromJSON(comments);
      });
    }
  );
});

createCommentTextInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault(); // prevent dialog not closing weirdness
    createCommentButton.click();
  }
});

// Character limits
createCommentTextInput.setAttribute(
  "maxlength",
  String(serverConfig.comment_max_len)
);
createCommentTextInput.addEventListener("input", (_) => {
  createCommentCharIndicator.textContent = `
		${createCommentTextInput.value.length}
		/
		${serverConfig.comment_max_len}
	`;
});
createCommentTextInput.dispatchEvent(new Event("input")); // render once at startup

// parse ISO dates (must be done at the end)
replaceDateTextsWithSpans();

function renderTask(task: Task) {
  document.title = task.title;
  taskTitle.textContent = task.title;
  taskId.textContent = formatId(task.id);
  taskCreatedAt.textContent = formatDate(new Date(task.created_at));
  taskDesc.textContent = task.description;
  taskDescPreview.innerHTML = DOMPurify.sanitize(
    marked.parse(task.description)
  );
  taskTitle.setAttribute("maxlength", String(serverConfig.task_title_max_len));
  taskDesc.setAttribute("maxlength", String(serverConfig.task_desc_max_len));
  // status selector
  for (const option of taskStatus.options) {
    if (option.value === task.status) {
      option.selected = true;
      break;
    }
  }
  // for (let i = 0; i < taskStatus.options.length; i++) {
  // 	if (taskStatus.options[i]?.value === task.status) {
  // 		taskStatus.options[i].selected = true;
  // 		break;
  // 	}
  // }
  // parent story selector
  while (taskStorySelector.firstChild != null)
    taskStorySelector.removeChild(taskStorySelector.firstChild);
  // add in the special NULL story; selected by default
  const option = document.createElement("option");
  // since the value can't literally be null, use the identifier as a standin
  option.setAttribute("value", NULL_STORY_IDENTIFIER);
  option.textContent = NULL_STORY_IDENTIFIER;
  option.selected = true;
  taskStorySelector.appendChild(option);

  // bucketize the stories by sprint
  const sprintBuckets = new Map<string, Story[]>();
  Array.from(storyDataCache.values()).forEach((story) => {
    if (!sprintBuckets.has(story.sprint_id))
      sprintBuckets.set(story.sprint_id, []);
    sprintBuckets.get(story.sprint_id)?.push(story);
  });
  // only render 3 sprints once the task is found to de-clutter the UI
  let taskSprintFound = false;
  let sprintsToRenderAfterTaskInSelect = 3;
  // loop through the sorted keys (sprintIds)
  Array.from(sprintBuckets.keys())
    .sort((sprintId0, sprintId1) => {
      return (
        new Date(sprintDataCache.get(sprintId1)?.start_date ?? 0).getTime() -
        new Date(sprintDataCache.get(sprintId0)?.start_date ?? 0).getTime()
      );
    })
    .forEach((sprintId) => {
      if (sprintsToRenderAfterTaskInSelect === 0) return;
      if (taskSprintFound) sprintsToRenderAfterTaskInSelect -= 1;
      const optGroup = document.createElement("optgroup");
      optGroup.setAttribute(
        "label",
        sprintDataCache.get(sprintId)?.title ?? ""
      );
      sprintBuckets.get(sprintId)?.forEach((story) => {
        const option = document.createElement("option");
        option.setAttribute("value", story.id);
        option.textContent = story.title;
        optGroup.appendChild(option);
        if (story.id === task.story_id) {
          option.selected = true;
          taskSprintFound = true;
          sprintsToRenderAfterTaskInSelect--;
        }
      });
      taskStorySelector.appendChild(optGroup);
    });
}

function renderCommentsFromJSON(comments: TaskComment[]) {
  // TODO (2022.11.22) this should be one or the other.  Right now,
  // the API is returning null, but an empty array may be better
  if (comments.length === 0) {
    console.warn("no comments to render");
    return;
  }
  while (taskComments.firstChild != null)
    taskComments.removeChild(taskComments.firstChild);
  comments
    .sort((c0, c1) => {
      return (
        new Date(c0.created_at).getTime() - new Date(c1.created_at).getTime()
      );
    })
    .forEach((comment) => {
      const commentWrapper = document.createElement("div");
      commentWrapper.classList.add("comment-wrapper");

      const commentText = document.createElement("p");
      commentText.classList.add("comment-text");
      commentText.classList.add("rendered-markdown");
      commentText.innerHTML = DOMPurify.sanitize(marked.parse(comment.text));

      const commentCreatedAt = document.createElement("p");
      commentCreatedAt.classList.add("comment-created-at");
      commentCreatedAt.textContent = formatDate(new Date(comment.created_at));

      const commentId = document.createElement("p");
      commentId.classList.add("comment-id");
      commentId.textContent = comment.id;

      commentWrapper.appendChild(commentId);
      commentWrapper.appendChild(commentText);
      commentWrapper.appendChild(commentCreatedAt);
      taskComments.appendChild(commentWrapper);
    });
}
