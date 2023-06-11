// ----------
// DEPRECATED
// ----------
import "../css/styles.css";
import {
  createSprint,
  createStory,
  createStoryRelationship,
  createTag,
  createTagAssignment,
  createTask,
  destroyTagAssignment,
  getConfig,
  getSprints,
  getStories,
  getStoryRelationships,
  getTagAssignments,
  getTags,
  getTasks,
  setErrorMessageParentDiv,
  updateStoryById,
  updateTaskById,
} from "./lib/api";
import {
  hoverClass,
  NULL_STORY_IDENTIFIER,
  replaceDateTextsWithSpans,
  TAG_COLORS,
} from "./lib/common";
import {
  clearInputValues,
  formatDate,
  inProgress,
  sprintToString,
} from "./lib/utils";
import {
  Config,
  Sprint,
  Story,
  StoryRelationship,
  STORY_RELATIONSHIP,
  Tag,
  TagAssignment,
  Task,
} from "./model/entities";

import DOMPurify from "dompurify";
import { marked } from "marked";

const LOCAL_STORAGE_KEYS = {
  selectedSprintId: "viewing_sprint_id",
  selectedTagIds: "selected_tag_ids",
};

// used as a reference for length assertion
const BULK_TASK_PREFIX = "[mm.dd] ";

// tells common.ts where to place the error message
setErrorMessageParentDiv(
  document.querySelector(".error-message-parent") as HTMLDivElement
);

// TODO (2023.01.22): one way to get rid of this is
// to make it type Config | undefined and then add
// an undefined check after the get requests.  This still doesn't
// solve the problem fully for callbacks
let serverConfig: Config = {
  comment_max_len: 0,
  server_name: "",
  sprint_duration_seconds: 0,
  sprint_title_max_len: 0,
  story_desc_max_len: 0,
  story_title_max_len: 0,
  tag_desc_max_len: 0,
  tag_title_max_len: 0,
  task_desc_max_len: 0,
  task_title_max_len: 0,
}; // setting defaults to remove error
// stores story data by story_id
const storyDataCache = new Map<string, Story>();
// stores sprint data by sprint_id
const sprintDataCache = new Map<string, Sprint>();
// stores task data by task_id
const taskDataCache = new Map<string, Task>();
const tagDataCache = new Map<string, Tag>();
const tagAssignmentDataCache = new Map<number, TagAssignment>();
const storyRelationshipsDataCache = new Map<number, StoryRelationship>();

console.time("api_calls");
await Promise.all([
  getConfig().then((config) => {
    serverConfig = config;
  }),
  getStories().then((stories) => {
    stories.forEach((story) => {
      storyDataCache.set(story.id, story);
    });
  }),
  getSprints().then((sprints) => {
    sprints.forEach((sprint) => {
      sprintDataCache.set(sprint.id, sprint);
    });
  }),
  getTasks().then((tasks) => {
    tasks.forEach((task) => {
      taskDataCache.set(task.id, task);
    });
  }),
  getTags().then((tags) => {
    tags.forEach((tag) => {
      tagDataCache.set(tag.id, tag);
    });
  }),
  getTagAssignments().then((tagAssignments) => {
    tagAssignments.forEach((tagAssignment) => {
      tagAssignmentDataCache.set(tagAssignment.id, tagAssignment);
    });
  }),
  getStoryRelationships().then((storyRelationships) => {
    if (storyRelationships === null) return;
    storyRelationships.forEach((storyRelationship) => {
      storyRelationshipsDataCache.set(storyRelationship.id, storyRelationship);
    });
  }),
]);
// if (serverConfig === undefined) throw new Error("serverConfig is undefined")
console.timeEnd("api_calls");
console.table(serverConfig);

// render sprint selector (must be before task render)
const sprintSelect = document.querySelector(
  ".sprint-select-wrapper select"
) as HTMLSelectElement;
sprintSelect.addEventListener("change", (_) => {
  renderTasksFromJSON(Array.from(taskDataCache.values()));
  renderStories();
  localStorage.setItem(LOCAL_STORAGE_KEYS.selectedSprintId, sprintSelect.value);
});
[...sprintDataCache]
  // sprints are returned in chronological order typically, but this
  // is not guaranteed
  .sort(([_0, sprint0], [_1, sprint1]) => {
    return (
      new Date(sprint0.created_at).getTime() -
      new Date(sprint1.created_at).getTime()
    );
  })
  // take only the latest 5 sprints to de-clutter the UI
  .slice(-5)
  .forEach(([_, sprint]) => {
    const option = document.createElement("option");
    option.setAttribute("value", sprint.id);
    option.textContent = sprintToString(sprint);
    sprintSelect.appendChild(option);
    if (localStorage.getItem(LOCAL_STORAGE_KEYS.selectedSprintId) === sprint.id)
      option.selected = true;
  });

// render tag selector
// wrapping in a function for now so I can call it from
// some kind of render() func later
(function () {
  const tagsWrapper = document.querySelector(".tags-wrapper") as HTMLDivElement;
  const localStorageSelectedTagIds = localStorage.getItem(
    LOCAL_STORAGE_KEYS.selectedTagIds
  );
  tagDataCache.forEach((tag, _) => {
    const tagCheckBox = document.createElement("input");
    tagCheckBox.setAttribute("type", "checkbox");
    tagCheckBox.setAttribute("name", tag.title);
    tagCheckBox.dataset["tag_id"] = tag.id;
    if (localStorageSelectedTagIds?.includes(tag.id) ?? false)
      tagCheckBox.checked = true;
    tagCheckBox.addEventListener("change", (_) => {
      setLocalStorageSelectedTags();
      renderTasksFromJSON(Array.from(taskDataCache.values()));
    });
    const tagCheckBoxLabel = document.createElement("label");
    tagCheckBoxLabel.onclick = (_) => {
      tagCheckBox.click();
    };
    tagCheckBoxLabel.setAttribute("for", tag.title);
    tagCheckBoxLabel.style.color =
      TAG_COLORS[tag.title as keyof typeof TAG_COLORS];
    tagCheckBoxLabel.textContent = tag.title;
    const tagContainer = document.createElement("span");
    tagContainer.appendChild(tagCheckBox);
    tagContainer.appendChild(tagCheckBoxLabel);
    tagsWrapper.appendChild(tagContainer);
  });

  // "All" and "None" links
  const allAnchor = document.createElement("a");
  allAnchor.textContent = "All";
  allAnchor.setAttribute("href", "#");
  const noneAnchor = document.createElement("a");
  noneAnchor.textContent = "None";
  noneAnchor.setAttribute("href", "#");
  allAnchor.onclick = (_) => {
    document.querySelectorAll(".tags-wrapper input").forEach((i) => {
      (i as HTMLInputElement).checked = true;
    });
    // TODO: would be better to fire an event here
    setLocalStorageSelectedTags();
    renderTasksFromJSON(Array.from(taskDataCache.values()));
  };
  noneAnchor.onclick = (_) => {
    document.querySelectorAll(".tags-wrapper input")?.forEach((i) => {
      (i as HTMLInputElement).checked = false;
    });
    setLocalStorageSelectedTags();
    renderTasksFromJSON(Array.from(taskDataCache.values()));
  };
  tagsWrapper.appendChild(allAnchor);
  tagsWrapper.appendChild(noneAnchor);
})();

// TODO: renderTasksFromJSON should take no arguments and use the map
renderTasksFromJSON(Array.from(taskDataCache.values()));
renderStories();

// CODE SECTION: CREATE TASK MODAL ============================
const createTaskButton = document.querySelector(
  ".create-task-button"
) as HTMLButtonElement;
const createTaskModal = document.querySelector(
  ".create-task-modal"
) as HTMLDialogElement;
const createTaskTitleInput = createTaskModal.querySelector(
  'input[name="title"]'
) as HTMLInputElement;
const createTaskDescInput = createTaskModal.querySelector(
  'textarea[name="description"]'
) as HTMLInputElement;
const createTaskTitleCharIndicator = createTaskModal.querySelector(
  ".title-char-indicator"
) as HTMLParagraphElement;
const createTaskDescCharIndicator = createTaskModal.querySelector(
  ".desc-char-indicator"
) as HTMLParagraphElement;
const createTaskSelectInput = createTaskModal.querySelector(
  'select[name="story"]'
) as HTMLSelectElement;
const createTaskSaveButton = createTaskModal.querySelector(
  ".modal-save"
) as HTMLButtonElement;
// Create button
createTaskButton.onclick = (_) => {
  createTaskModal.showModal();
  createTaskTitleInput.focus();
  while (createTaskSelectInput.firstChild != null)
    createTaskSelectInput.removeChild(createTaskSelectInput.firstChild);
  // add in the special NULL story; selected by default
  const option = document.createElement("option");
  // since the value can't literally be null, use the identifier as a standin
  option.setAttribute("value", NULL_STORY_IDENTIFIER);
  option.textContent = NULL_STORY_IDENTIFIER;
  option.selected = true;
  createTaskSelectInput.appendChild(option);
  // add in story option for each story in the sprint
  Array.from(storyDataCache.values())
    .filter((s) => {
      // if for some reason sprintSelect.value is blank, dont filter
      if (sprintSelect.value === "") return true;
      return s.sprint_id === sprintSelect.value;
    })
    .forEach((story) => {
      const option = document.createElement("option");
      option.setAttribute("value", story.id);
      option.textContent = story.title;
      createTaskSelectInput.appendChild(option);
    });
};
// Character limits
createTaskTitleInput.setAttribute(
  "maxlength",
  String(serverConfig.task_title_max_len)
);
createTaskDescInput.setAttribute(
  "maxlength",
  String(serverConfig.task_desc_max_len)
);
createTaskTitleInput.addEventListener("input", (_) => {
  createTaskTitleCharIndicator.textContent = `
			${createTaskTitleInput.value.length}
			/
			${serverConfig.task_title_max_len}
		`;
});
createTaskDescInput.addEventListener("input", (_) => {
  createTaskDescCharIndicator.textContent = `${createTaskDescInput.value.length}/${serverConfig.task_desc_max_len}`;
});
createTaskTitleInput.dispatchEvent(new Event("input")); // render once at startup
createTaskDescInput.dispatchEvent(new Event("input")); // render once at startup
// Close (x) button
(createTaskModal.querySelector(".modal-close") as HTMLButtonElement).onclick =
  () => {
    createTaskModal.close();
  };
// CTRL-Enter to save
createTaskModal.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault(); // prevent dialog not closing weirdness
    createTaskSaveButton.click();
  }
});
createTaskSaveButton.addEventListener("click", (_) => {
  void createTask(
    createTaskTitleInput.value,
    createTaskDescInput.value,
    createTaskSelectInput.value === NULL_STORY_IDENTIFIER
      ? null
      : createTaskSelectInput.value
  ).then(() => {
    clearInputValues(createTaskTitleInput, createTaskDescInput);
    location.reload();
  });
});
// END CREATE TASK MODAL ============================

// CODE SECTION: CREATE STORY MODAL ============================
const createStoryButton = document.querySelector(
  ".create-story-button"
) as HTMLButtonElement;
const createStoryModal = document.querySelector(
  ".create-story-modal"
) as HTMLDialogElement;
const createStoryTitleInput = createStoryModal.querySelector(
  'input[name="title"]'
) as HTMLInputElement;
const createStoryDescInput = createStoryModal.querySelector(
  'textarea[name="description"]'
) as HTMLInputElement;
const createStoryTitleCharIndicator = createStoryModal.querySelector(
  ".title-char-indicator"
) as HTMLParagraphElement;
const createStoryDescCharIndicator = createStoryModal.querySelector(
  ".desc-char-indicator"
) as HTMLParagraphElement;
const createStorySelectSprintInput = createStoryModal.querySelector(
  'select[name="sprint"]'
) as HTMLSelectElement;
const createStoryContinuesStoryCheckboxLabel = createStoryModal.querySelector(
  'label[for="continues-story"]'
) as HTMLLabelElement;
const createStoryContinuesStoryCheckbox = createStoryModal.querySelector(
  'input[name="continues-story"]'
) as HTMLInputElement;
const createStoryTags = createStoryModal.querySelector(
  ".story-tags"
) as HTMLDivElement;
const createStorySaveButton = createStoryModal.querySelector(
  ".modal-save"
) as HTMLButtonElement;
// Create button
createStoryButton.onclick = (_) => {
  createStoryModal.showModal();
  createStoryTitleInput.focus();
  // Remove option from <select> and update from cache
  while (createStorySelectSprintInput.firstChild != null)
    createStorySelectSprintInput.removeChild(
      createStorySelectSprintInput.firstChild
    );
  sprintDataCache.forEach((sprint, _) => {
    const option = document.createElement("option");
    option.setAttribute("value", sprint.id);
    option.textContent = sprint.title;
    // select the latest sprint by default
    if (
      createStorySelectSprintInput.value === "" ||
      new Date(sprint.start_date) >
        new Date(
          sprintDataCache.get(createStorySelectSprintInput.value)?.start_date ??
            0
        )
    ) {
      option.selected = true;
    }
    createStorySelectSprintInput.appendChild(option);
  });
  // continues story disabled and unselected by default
  createStoryContinuesStoryCheckbox.disabled = true;
  createStoryContinuesStoryCheckbox.checked = false;
  createStoryContinuesStoryCheckbox.dataset["story_id"] = undefined;
  createStoryContinuesStoryCheckboxLabel.innerHTML = "";
};
// Character limits
createStoryTitleInput.setAttribute(
  "maxlength",
  String(serverConfig.story_title_max_len)
);
createStoryDescInput.setAttribute(
  "maxlength",
  String(serverConfig.story_desc_max_len)
);
createStoryTitleInput.addEventListener("input", (_) => {
  createStoryTitleCharIndicator.textContent = `
			${createStoryTitleInput.value.length}
			/
			${serverConfig.story_title_max_len}
		`;
});
createStoryDescInput.addEventListener("input", (_) => {
  createStoryDescCharIndicator.textContent = `
			${createStoryDescInput.value.length}
			/
			${serverConfig.story_desc_max_len}
		`;
});
createStoryTitleInput.dispatchEvent(new Event("input")); // render once at startup
createStoryDescInput.dispatchEvent(new Event("input")); // render once at startup
// Close (x) button
(createStoryModal.querySelector(".modal-close") as HTMLButtonElement).onclick =
  (_) => {
    createStoryModal.close();
  };
// story tag check boxes
tagDataCache.forEach((tag, _) => {
  const tagCheckBox = document.createElement("input");
  tagCheckBox.setAttribute("type", "checkbox");
  tagCheckBox.setAttribute("name", tag.title);
  tagCheckBox.dataset["tag_id"] = tag.id;
  const tagCheckBoxLabel = document.createElement("label");
  tagCheckBoxLabel.onclick = (_) => {
    tagCheckBox.click();
  };
  tagCheckBoxLabel.setAttribute("for", tag.title);
  tagCheckBoxLabel.style.color =
    TAG_COLORS[tag.title as keyof typeof TAG_COLORS];
  tagCheckBoxLabel.textContent = tag.title;
  const tagContainer = document.createElement("span");
  tagContainer.appendChild(tagCheckBox);
  tagContainer.appendChild(tagCheckBoxLabel);
  createStoryTags.appendChild(tagContainer);
});
// CTRL-Enter to save
createStoryModal.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault(); // prevent dialog not closing weirdness
    createStorySaveButton.click();
  }
});
createStorySaveButton.addEventListener("click", (_) => {
  void createStory(
    createStoryTitleInput.value,
    createStoryDescInput.value,
    createStorySelectSprintInput.value
  )
    .then(async (res) => {
      // story relationship
      if (!createStoryContinuesStoryCheckbox.checked) return res;
      const continuedStoryId =
        createStoryContinuesStoryCheckbox.dataset["story_id"];
      if (continuedStoryId === undefined) throw new Error("story_id not set");
      if (!storyDataCache.has(continuedStoryId)) return res;
      await createStoryRelationship(
        continuedStoryId,
        res.id,
        STORY_RELATIONSHIP.ContinuedBy
      );
      console.log("Created story relationship", continuedStoryId, res.id);
      for (const task of taskDataCache.values()) {
        if (task.story_id !== continuedStoryId) continue;
        if (!inProgress(task)) continue;
        await updateTaskById(
          task.id,
          task.status,
          task.title,
          task.description,
          res.id
        );
        console.log("moved task", task.title);
      }
      return res;
    })
    .then(async (res) => {
      // tag checkboxes
      for (const tagCheckBox of Array.from(
        createStoryTags.querySelectorAll("input")
      ).filter((tcb) => tcb.checked)) {
        if (tagCheckBox.dataset["tag_id"] === undefined)
          throw new Error("tag_id not set in tag checkbox dataset");
        await createTagAssignment(tagCheckBox.dataset["tag_id"], res.id);
        console.log(
          "Created tag assignment",
          tagCheckBox.dataset["tag_id"],
          res.id
        );
      }
    })
    .then((_) => {
      clearInputValues(createStoryTitleInput, createStoryDescInput);
      location.reload();
    });
});
// END CREATE STORY MODAL ============================

// CODE SECTION: CREATE SPRINT MODAL ============================
const createSprintButton = document.querySelector(
  ".create-sprint-button"
) as HTMLButtonElement;
const createSprintModal = document.querySelector(
  ".create-sprint-modal"
) as HTMLDialogElement;
const createSprintTitleInput = createSprintModal.querySelector(
  'input[name="title"]'
) as HTMLInputElement;
const createSprintTitleCharIndicator = createSprintModal.querySelector(
  ".title-char-indicator"
) as HTMLParagraphElement;
const createSprintStartdateInput = createSprintModal.querySelector(
  'input[name="startdate"]'
) as HTMLInputElement;
const createSprintEnddateInput = createSprintModal.querySelector(
  'input[name="enddate"]'
) as HTMLInputElement;
const createSprintSaveButton = createSprintModal.querySelector(
  ".modal-save"
) as HTMLButtonElement;
// Create button
createSprintButton.onclick = (_) => {
  createSprintModal.showModal();
  createSprintTitleInput.focus();
};
// Character limits
createSprintTitleInput.setAttribute(
  "maxlength",
  String(serverConfig.sprint_title_max_len)
);
createSprintTitleInput.addEventListener("input", (_) => {
  createSprintTitleCharIndicator.textContent = `${createSprintTitleInput.value.length}/${serverConfig.sprint_title_max_len}`;
});
createSprintTitleInput.dispatchEvent(new Event("input")); // render once at startup
// Close (x) button
(createSprintModal.querySelector(".modal-close") as HTMLButtonElement).onclick =
  (_) => {
    createSprintModal.close();
  };
// CTRL-Enter to save
createSprintModal.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault(); // prevent dialog not closing weirdness
    createSprintSaveButton.click();
  }
});
createSprintSaveButton.addEventListener("click", (_) => {
  void createSprint(
    createSprintTitleInput.value,
    new Date(createSprintStartdateInput.value),
    new Date(createSprintEnddateInput.value)
  ).then(() => {
    clearInputValues(createSprintTitleInput);
    location.reload();
  });
});
// END CREATE SPRINT MODAL ============================

// CODE SECTION: CREATE TAG MODAL ============================
const createTagButton = document.querySelector(
  ".create-tag-button"
) as HTMLButtonElement;
const createTagModal = document.querySelector(
  ".create-tag-modal"
) as HTMLDialogElement;
const createTagTitleInput = createTagModal.querySelector(
  'input[name="title"]'
) as HTMLInputElement;
const createTagDescInput = createTagModal.querySelector(
  'textarea[name="description"]'
) as HTMLInputElement;
const createTagTitleCharIndicator = createTagModal.querySelector(
  ".title-char-indicator"
) as HTMLInputElement;
const createTagDescCharIndicator = createTagModal.querySelector(
  ".desc-char-indicator"
) as HTMLParagraphElement;
const createTagSaveButton = createTagModal.querySelector(
  ".modal-save"
) as HTMLButtonElement;
// Create button
createTagButton.onclick = (_) => {
  createTagModal.showModal();
  createTagTitleInput.focus();
};
// Character limits
createTagTitleInput.setAttribute(
  "maxlength",
  String(serverConfig.tag_title_max_len)
);
createTagDescInput.setAttribute(
  "maxlength",
  String(serverConfig.tag_desc_max_len)
);
createTagTitleInput.addEventListener("input", (_) => {
  createTagTitleCharIndicator.textContent = `${createTagTitleInput.value.length}/${serverConfig.tag_title_max_len}`;
});
createTagDescInput.addEventListener("input", (_) => {
  createTagDescCharIndicator.textContent = `${createTagDescInput.value.length}/${serverConfig.tag_desc_max_len}`;
});
createTagTitleInput.dispatchEvent(new Event("input")); // render once at startup
createTagDescInput.dispatchEvent(new Event("input")); // render once at startup
// Close (x) button
(createTagModal.querySelector(".modal-close") as HTMLButtonElement).onclick = (
  _
) => {
  createTagModal.close();
};
// CTRL-Enter to save
createTagModal.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault(); // prevent dialog not closing weirdness
    createTagSaveButton.click();
  }
});
createTagSaveButton.addEventListener("click", (_) => {
  void createTag(createTagTitleInput.value, createTagDescInput.value).then(
    () => {
      clearInputValues(createTagTitleInput, createTagDescInput);
      location.reload();
    }
  );
});
// END CREATE TAG MODAL ============================

// CODE SECTION: BULK CREATE TASK MODAL ============================
const bulkCreateTaskButton = document.querySelector(
  ".bulk-create-task-button"
) as HTMLButtonElement;
const bulkCreateTaskModal = document.querySelector(
  ".bulk-create-task-modal"
) as HTMLDialogElement;
const bulkCreateTaskTitleInput = bulkCreateTaskModal.querySelector(
  'input[name="title"]'
) as HTMLInputElement;
const bulkCreateTaskDescInput = bulkCreateTaskModal.querySelector(
  'textarea[name="description"]'
) as HTMLInputElement;
const bulkCreateTaskTitleCharIndicator = bulkCreateTaskModal.querySelector(
  ".title-char-indicator"
) as HTMLInputElement;
const bulkCreateTaskDescCharIndicator = bulkCreateTaskModal.querySelector(
  ".desc-char-indicator"
) as HTMLInputElement;
const bulkCreateTaskSelectInput = bulkCreateTaskModal.querySelector(
  'select[name="story"]'
) as HTMLInputElement;
const bulkCreateTaskSaveButton = bulkCreateTaskModal.querySelector(
  ".modal-save"
) as HTMLButtonElement;
// Create button
bulkCreateTaskButton.onclick = (_) => {
  bulkCreateTaskModal.showModal();
  bulkCreateTaskTitleInput.focus();
  // Remove option from <select> and call /get_stories
  while (bulkCreateTaskSelectInput.firstChild != null)
    bulkCreateTaskSelectInput.removeChild(bulkCreateTaskSelectInput.firstChild);
  Array.from(storyDataCache.values())
    .filter((s) => {
      // if for some reason sprintSelect.value is blank, dont filter
      if (sprintSelect.value === "") return true;
      return s.sprint_id === sprintSelect.value;
    })
    .forEach((story) => {
      const option = document.createElement("option");
      option.setAttribute("value", story.id);
      option.textContent = story.title;
      bulkCreateTaskSelectInput.appendChild(option);
    });
};
// Character limits
bulkCreateTaskTitleInput.setAttribute(
  "maxlength",
  String(serverConfig.task_title_max_len)
);
bulkCreateTaskDescInput.setAttribute(
  "maxlength",
  String(serverConfig.task_desc_max_len)
);
bulkCreateTaskTitleInput.addEventListener("input", (_) => {
  bulkCreateTaskTitleCharIndicator.textContent = `
			${bulkCreateTaskTitleInput.value.length}
			/
			${serverConfig.task_title_max_len - BULK_TASK_PREFIX.length}
		`;
});
bulkCreateTaskDescInput.addEventListener("input", (_) => {
  bulkCreateTaskDescCharIndicator.textContent = `
			${bulkCreateTaskDescInput.value.length}
			/
			${serverConfig.task_desc_max_len}
		`;
});
bulkCreateTaskTitleInput.dispatchEvent(new Event("input")); // render once at startup
bulkCreateTaskDescInput.dispatchEvent(new Event("input")); // render once at startup
// Close (x) button
(
  bulkCreateTaskModal.querySelector(".modal-close") as HTMLButtonElement
).onclick = (_) => {
  bulkCreateTaskModal.close();
};
// CTRL-Enter to save
bulkCreateTaskModal.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault(); // prevent dialog not closing weirdness
    bulkCreateTaskSaveButton.click();
  }
});
bulkCreateTaskSaveButton.addEventListener("click", (_) => {
  // TODO: partial success handling
  void bulkCreateTasks(
    bulkCreateTaskTitleInput.value,
    bulkCreateTaskDescInput.value,
    bulkCreateTaskSelectInput.value
  ).then(() => {
    location.reload();
  });
});
// END BULK CREATE TASK MODAL ============================

const buckets = document.querySelectorAll(".todo-app-bucket");

buckets.forEach((bucket) => {
  bucket.addEventListener("dragover", (e) => {
    e.preventDefault();

    const dragging = document.querySelector(".task.dragging") as HTMLDivElement;

    // return if the element we are dragging is not a task
    if (dragging === null) return;

    // TODO: do I really need vertical sorting functionality?
    const belowTask = getClosestTaskBelowCursor(
      bucket as HTMLDivElement,
      (e as DragEvent).clientY
    );

    // hack: avoid using "dragenter" & "dragleave" events
    // which do not play nicely with child nodes
    buckets.forEach((b) => {
      if (b !== bucket) b.classList.remove(hoverClass);
    });

    bucket.classList.add(hoverClass);

    if (belowTask === undefined) {
      bucket.appendChild(dragging);
    } else {
      bucket.insertBefore(dragging, belowTask);
    }
  });

  // no longer needed; handled in "dragend"
  // bucket.addEventListener("drop", _ => {
  // 	bucket.classList.remove(hoverClass);
  // });
});

// parse ISO dates (must be done at the end)
replaceDateTextsWithSpans();

function getClosestTaskBelowCursor(bucket: HTMLDivElement, y: number) {
  const nonDraggingTasks = [...bucket.querySelectorAll(".task:not(.dragging)")];

  return nonDraggingTasks.reduce(
    (closestTask, task) => {
      const box = task.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closestTask.offset)
        return { offset, element: task };
      return closestTask;
    },
    {
      offset: Number.NEGATIVE_INFINITY,
      // unused; just satisfies the type checker
      element: nonDraggingTasks[-1],
    }
  ).element;
}

function renderTasksFromJSON(tasks: Task[]) {
  if (tasks.length === 0) {
    console.warn("no tasks to render!");
    return;
  }
  if (sprintSelect.value === "") {
    console.error(
      "couldn't get sprint from dropdown, therefore cannot render tasks"
    );
    return;
  }
  // Clear out the task elements to avoid duplication
  document.querySelectorAll(".task").forEach((task) => {
    task.remove();
  });

  const selectedTagIds = new Set<string>();
  const tagCheckBoxes: NodeListOf<HTMLInputElement> = document.querySelectorAll(
    ".tags-wrapper input"
  );
  tagCheckBoxes.forEach((tagCheckBox) => {
    if (!tagCheckBox.checked) return;
    if (tagCheckBox.dataset["tag_id"] === undefined)
      throw new Error("tag_id not set in tag checkbox dataset");
    selectedTagIds.add(tagCheckBox.dataset["tag_id"]);
  });
  tasks
    .filter((t) => {
      // if there is no parent story, render it always
      if (t.story_id === null) return true;

      // only render tasks whose story is in the selected sprint
      const story = storyDataCache.get(t.story_id);
      if (story?.sprint_id !== sprintSelect.value) return false;

      // only render tasks whose story is tagged with a selected tag
      // TODO: this is inefficient; is there a better way?
      for (const ta of tagAssignmentDataCache.values()) {
        if (ta.story_id === t.story_id && selectedTagIds.has(ta.tag_id))
          return true;
      }

      // default: don't render the task
      return false;
    })
    .sort((t0, t1) => {
      if (t0.bulk_task && t1.bulk_task)
        return (
          new Date(t0.created_at).getTime() - new Date(t1.created_at).getTime()
        );
      return t0.bulk_task ? 1 : 0;
    })
    .forEach((task) => {
      const taskDiv = document.createElement("div");
      taskDiv.classList.add("task");
      if (task.bulk_task) taskDiv.classList.add("bulk-task");

      const taskHandle = document.createElement("p");
      taskHandle.classList.add("task-handle");
      taskHandle.innerHTML = "&#8801;";

      const taskTitle = document.createElement("h4");
      taskTitle.classList.add("task-title");
      taskTitle.textContent = task.title;

      const taskEditLink = document.createElement("a");
      taskEditLink.classList.add("task-edit-link");
      taskEditLink.textContent = "edit";
      taskEditLink.setAttribute("href", `/task/${task.id}`);

      const taskDesc = document.createElement("p");
      taskDesc.classList.add("task-desc");
      taskDesc.classList.add("rendered-markdown");
      taskDesc.innerHTML = DOMPurify.sanitize(marked.parse(task.description));

      const taskCreatedAt = document.createElement("p");
      taskCreatedAt.classList.add("task-created-at");
      taskCreatedAt.textContent = formatDate(new Date(task.created_at));

      const taskStoryTitle = document.createElement("a");
      taskStoryTitle.classList.add("task-story-title");
      taskStoryTitle.textContent =
        task.story_id === null
          ? NULL_STORY_IDENTIFIER
          : storyDataCache.get(task.story_id)?.title ?? null;
      taskStoryTitle.href = `#${task.story_id}`;

      const taskTags = document.createElement("div");
      taskTags.classList.add("task-tags");
      tagAssignmentDataCache.forEach((ta, _) => {
        if (ta.story_id !== task.story_id) return;
        const tag = tagDataCache.get(ta.tag_id) as Tag;
        const taskTag = document.createElement("span");
        taskTag.style.background =
          TAG_COLORS[tag.title as keyof typeof TAG_COLORS];
        taskTag.textContent = tag?.title ?? null;
        taskTags.appendChild(taskTag);
      });

      const taskBulkTaskIndicator = document.createElement("p");
      taskBulkTaskIndicator.classList.add("task-bulk-task-indicator");
      taskBulkTaskIndicator.textContent = "Bulk task";
      taskBulkTaskIndicator.style.display = task.bulk_task ? "visible" : "none";

      taskDiv.appendChild(taskHandle);
      taskDiv.appendChild(taskEditLink);
      taskDiv.appendChild(taskTitle);
      taskDiv.appendChild(taskDesc);
      taskDiv.appendChild(taskTags);
      taskDiv.appendChild(taskStoryTitle);
      taskDiv.appendChild(taskCreatedAt);
      taskDiv.appendChild(taskBulkTaskIndicator);

      taskHandle.addEventListener("mousedown", (_) => {
        taskDiv.setAttribute("draggable", String(true));
      });
      taskHandle.addEventListener("mouseup", (_) => {
        taskDiv.setAttribute("draggable", String(false));
      });
      // not currently working, since drag api doesn't work with touch
      taskHandle.addEventListener("touchstart", (_) => {
        taskDiv.setAttribute("draggable", String(true));
      });
      taskHandle.addEventListener("touchend", (_) => {
        taskDiv.setAttribute("draggable", String(false));
      });

      taskDiv.addEventListener("dragstart", (_) => {
        taskDiv.classList.add("dragging");
      });
      taskDiv.addEventListener("dragend", (_) => {
        // just in case not caught by mouseup
        taskDiv.setAttribute("draggable", String(false));
        taskDiv.classList.remove("dragging");
        buckets.forEach((b) => {
          b.classList.remove(hoverClass);
        });
        const destinationStatus = (taskDiv.parentNode as HTMLDivElement)
          .dataset["status"];
        if (destinationStatus === undefined)
          throw new Error("status not set in bucket dataset");
        void updateTaskById(
          task.id,
          destinationStatus,
          task.title,
          task.description,
          task.story_id
        );
      });

      // TODO: this is not maintainable / extensible; html file
      // is tightly coupled with data model.  Can I pull in this as config somehow?
      // e.g. /get_config -> {"status_buckets": ["BACKLOG", "DOING", ...]}
      const bucket = document.querySelector(`[data-status="${task.status}"]`);
      bucket?.appendChild(taskDiv);
    });
}

function renderStories() {
  if (sprintSelect.value === "") {
    console.error(
      "couldn't get sprint from dropdown, therefore cannot render stories"
    );
    return;
  }

  // Clear out the story elements to avoid duplication
  document.querySelectorAll(".story").forEach((story) => {
    story.remove();
  });

  Array.from(storyDataCache.values())
    .filter((story) => {
      return story.sprint_id === sprintSelect.value;
    })
    .forEach((story, _) => {
      const storyDiv = document.createElement("div");
      storyDiv.classList.add("story");
      // storyURIFragment
      storyDiv.id = story.id;

      const storyTitle = document.createElement("h4");
      storyTitle.classList.add("story-title");
      storyTitle.textContent = story.title;

      const storyDesc = document.createElement("p");
      storyDesc.classList.add("story-desc");
      storyDesc.classList.add("rendered-markdown");
      storyDesc.innerHTML = DOMPurify.sanitize(marked.parse(story.description));

      const storyEditLink = document.createElement("a");
      storyEditLink.classList.add("story-edit-link");
      storyEditLink.textContent = "edit";
      storyEditLink.setAttribute("href", `/story/${story.id}`);

      const storyMetadataContainer = document.createElement("div");
      storyMetadataContainer.classList.add("story-metadata-container");

      const storySprintTitle = document.createElement("p");
      storySprintTitle.classList.add("story-sprint-title");
      storySprintTitle.textContent =
        sprintDataCache.get(story.sprint_id)?.title ?? null;

      const storyCreatedAt = document.createElement("p");
      storyCreatedAt.classList.add("story-created-at");
      storyCreatedAt.textContent = formatDate(new Date(story.created_at));

      storyMetadataContainer.appendChild(storyCreatedAt);
      storyMetadataContainer.appendChild(storySprintTitle);

      const storyTags = document.createElement("div");
      storyTags.classList.add("story-tags");
      tagDataCache.forEach((tag, _) => {
        const tagCheckBox = document.createElement("input");
        tagCheckBox.setAttribute("type", "checkbox");
        tagCheckBox.setAttribute("name", tag.title);
        tagCheckBox.dataset["tag_id"] = tag.id;
        tagCheckBox.addEventListener("change", (_) => {
          if (tagCheckBox.checked) {
            void createTagAssignment(tag.id, story.id);
          } else {
            void destroyTagAssignment(tag.id, story.id);
          }
        });
        // this is an expensive O(n) operation, but I dont care
        tagAssignmentDataCache.forEach((ta, _) => {
          if (ta.story_id === story.id && ta.tag_id === tag.id)
            tagCheckBox.checked = true;
        });
        const tagCheckBoxLabel = document.createElement("label");
        tagCheckBoxLabel.onclick = (_) => {
          tagCheckBox.click();
        };
        tagCheckBoxLabel.setAttribute("for", tag.title);
        tagCheckBoxLabel.style.color =
          TAG_COLORS[tag.title as keyof typeof TAG_COLORS];
        tagCheckBoxLabel.textContent = tag.title;
        const tagContainer = document.createElement("span");
        tagContainer.appendChild(tagCheckBox);
        tagContainer.appendChild(tagCheckBoxLabel);
        storyTags.appendChild(tagContainer);
      });

      const storySprintSelect = document.createElement("select");
      sprintDataCache.forEach((sprint, _) => {
        const option = document.createElement("option");
        option.setAttribute("value", sprint.id);
        option.textContent = sprintToString(sprint);
        if (story.sprint_id === sprint.id) option.selected = true;
        storySprintSelect.appendChild(option);
      });
      storySprintSelect.addEventListener("change", (_) => {
        void updateStoryById(
          story.id,
          story.status,
          story.title,
          story.description,
          storySprintSelect.value
        ).then(() => {
          location.reload();
        });
      });

      const openTasksListWrapper = document.createElement("div");
      const openTasksListTitle = document.createElement("h4");
      openTasksListTitle.textContent = "Tasks in this sprint";
      const openTasksList = document.createElement("ul");
      openTasksListWrapper.appendChild(openTasksListTitle);
      openTasksListWrapper.appendChild(openTasksList);
      Array.from(taskDataCache.values())
        .filter((task) => {
          if (task.story_id !== story.id) return false;
          return true;
        })
        .forEach((task) => {
          const li = document.createElement("li");
          li.textContent = `(${task.status}) ${task.title}`;
          openTasksList.appendChild(li);
        });

      // button that opens a new story modal and
      // copies the title and desc into the inputs
      // and selects the associated tags
      const copyToNewButton = document.createElement("button");
      copyToNewButton.textContent = "Copy to new story";
      copyToNewButton.onclick = (_) => {
        createStoryButton.click();
        createStoryTitleInput.value = story.title;
        createStoryDescInput.value = story.description;
        Array.from(storyTags.querySelectorAll("input"))
          .filter((tagCheckBox) => tagCheckBox.checked)
          .forEach((tagCheckBox) => {
            (
              createStoryTags.querySelector(
                `[data-tag_id="${tagCheckBox.dataset["tag_id"] ?? ""}"]`
              ) as HTMLInputElement
            ).checked = true;
          });
        createStoryContinuesStoryCheckbox.disabled = false;
        createStoryContinuesStoryCheckbox.checked = true;
        const boldText = document.createElement("strong");
        boldText.textContent = story.title;
        createStoryContinuesStoryCheckboxLabel.innerHTML = DOMPurify.sanitize(
          `This story will be a continuation of: ${boldText.outerHTML}`
        );
        createStoryContinuesStoryCheckbox.dataset["story_id"] = story.id;
      };

      const storyRelationshipsTable = document.createElement("table");
      const createTrWithInnerHTMLs = (...innerHTMLs: string[]) => {
        const tr = document.createElement("tr");
        for (const ih of innerHTMLs) {
          const td = document.createElement("td");
          td.innerHTML = ih;
          tr.appendChild(td);
        }
        return tr;
      };
      storyRelationshipsDataCache.forEach((sr, _) => {
        if (sr.relation !== STORY_RELATIONSHIP.ContinuedBy) return;
        if (sr.story_id_b === story.id) {
          const otherStory = storyDataCache.get(sr.story_id_a);
          if (otherStory === undefined)
            throw new Error("couldn't find story: " + sr.story_id_a);
          const otherStorySprint = sprintDataCache.get(otherStory.sprint_id);
          if (otherStorySprint === undefined)
            throw new Error("couldn't find sprint: " + otherStory.sprint_id);
          storyRelationshipsTable.appendChild(
            createTrWithInnerHTMLs(
              "Continues",
              `<strong>${otherStory.title}</strong>`,
              "from sprint",
              `<strong>${otherStorySprint.title}</strong>`
            )
          );
        } else if (sr.story_id_a === story.id) {
          const otherStory = storyDataCache.get(sr.story_id_b);
          if (otherStory === undefined)
            throw new Error("couldn't find story: " + sr.story_id_b);
          const otherStorySprint = sprintDataCache.get(otherStory.sprint_id);
          if (otherStorySprint === undefined)
            throw new Error("couldn't find sprint: " + otherStory.sprint_id);
          storyRelationshipsTable.appendChild(
            createTrWithInnerHTMLs(
              "Continued by",
              `<strong>${otherStory.title}</strong>`,
              "in sprint",
              `<strong>${otherStorySprint.title}</strong>`
            )
          );
        }
      });

      storyDiv.appendChild(storyTitle);
      storyDiv.appendChild(storyDesc);
      storyDiv.appendChild(storyEditLink);
      storyDiv.appendChild(storyTags);
      storyDiv.appendChild(storySprintSelect);
      storyDiv.appendChild(openTasksListWrapper);
      storyDiv.appendChild(copyToNewButton);
      storyDiv.appendChild(storyRelationshipsTable);
      // don't need to display this info for now, the sprint is
      // already captured by the sprint select
      // storyDiv.appendChild(storyMetadataContainer);

      const storiesWrapper = document.querySelector(
        ".stories-wrapper"
      ) as HTMLDivElement;
      storiesWrapper.appendChild(storyDiv);
    });
}

function setLocalStorageSelectedTags() {
  const selectedTagIds = (
    [...document.querySelectorAll(".tags-wrapper input")] as HTMLInputElement[]
  )
    .filter((tagCheckBox) => tagCheckBox.checked)
    .map((e) => {
      return e.dataset["tag_id"];
    });

  localStorage.setItem(
    LOCAL_STORAGE_KEYS.selectedTagIds,
    selectedTagIds.toString()
  );
}

async function bulkCreateTasks(
  commonTitle: string,
  commonDescription: string,
  storyId: string
) {
  const story = storyDataCache.get(storyId) as Story;
  const sprint = sprintDataCache.get(story.sprint_id) as Sprint;
  const sprintStart = new Date(sprint.start_date);
  const sprintEnd = new Date(sprint.end_date);
  for (
    const d = sprintStart;
    // eslint-disable-next-line no-unmodified-loop-condition
    d <= sprintEnd;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const monthString = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dateString = String(d.getUTCDate()).padStart(2, "0");
    const prefix = `[${monthString}.${dateString}] `;
    console.assert(prefix.length === BULK_TASK_PREFIX.length);
    await createTask(
      prefix + commonTitle,
      commonDescription,
      storyId,
      true
    ).then((_) => {
      console.log("Created task", prefix + commonTitle);
    });
  }
}
