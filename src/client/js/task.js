import "../css/styles.css";
import {
	updateTaskById,
	getConfig,
	getCommentsByTaskId,
	createComment,
	clearInputValues,
	getSprints,
	getStories,
	STATUSES,
	getTaskById,
	formatId,
	formatDate,
	NULL_STORY_IDENTIFIER,
} from "./common.js";
import * as DOMPurify from "dompurify";
import { marked } from "marked";

(async function () {
	const path = window.location.pathname;
	const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

	// query DOM objects
	const taskTitle = document.querySelector(".task-title");
	const taskId = document.querySelector(".task-id");
	const taskCreatedAt = document.querySelector(".task-created-at");
	const taskStatus = document.querySelector(".task-status");
	const taskDesc = document.querySelector(".task-desc");
	const taskDescPreview = document.querySelector(".task-desc-preview");
	const taskStorySelector = document.querySelector(".task-story-selector");
	const taskComments = document.querySelector(".task-comments");
	const taskSave = document.querySelector(".task-save");

	const taskDescPreviewToggle = document.querySelector(
		".task-desc-preview-toggle"
	);
	const taskDescPreviewLabel = taskDescPreviewToggle.querySelector("label");
	const taskDescCheckBox = taskDescPreviewToggle.querySelector("input");

	const createCommentForm = document.querySelector(".new-comment form");
	const createCommentTextInput = createCommentForm.querySelector("textarea");
	const createCommentCharIndicator =
		createCommentForm.querySelector(".char-indicator");
	const createCommentButton = createCommentForm.querySelector("button");

	let serverConfig;
	// stores story data by story_id
	const storyDataCache = new Map();
	// stores sprint data by sprint_id
	const sprintDataCache = new Map();

	// renderTask depends on these being set
	STATUSES.forEach(status => {
		const option = document.createElement("option");
		option.setAttribute("value", status);
		option.textContent = status;
		taskStatus.appendChild(option);
	});

	console.time("api_calls");
	await Promise.all([
		getConfig().then(config => {
			serverConfig = config;
		}),
		getCommentsByTaskId(taskIdFromPath).then(comments => {
			renderCommentsFromJSON(comments);
		}),
		getSprints().then(sprints => {
			sprints.forEach(sprint => {
				sprintDataCache.set(sprint.id, sprint);
			});
		}),
		getStories().then(stories => {
			stories.forEach(story => {
				storyDataCache.set(story.id, story);
			});
		}),
	]);
	// renderTask depends on:
	// 1) serverConfig
	// 2) storyDataCache and sprintDataCache
	// 3) status selector options
	await getTaskById(taskIdFromPath).then(task => {
		renderTask(task);
	});
	console.timeEnd("api_calls");
	console.table(serverConfig);

	// configure the "preview" checkbox and div
	taskDescCheckBox.checked = true; // checked on page load
	taskDescPreviewLabel.onclick = _ => {
		taskDescCheckBox.click();
	};
	taskDesc.style.display = "none";
	taskDescPreview.style.display = "block";
	taskDescCheckBox.addEventListener("change", _ => {
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

	taskSave.addEventListener("click", async _ => {
		const res = await updateTaskById(
			taskIdFromPath,
			taskStatus.value,
			taskTitle.textContent, // no newlines should be present
			taskDesc.innerText, // possible newlines
			taskStorySelector.value === NULL_STORY_IDENTIFIER
				? null
				: taskStorySelector.value
		);
		if (!res) return;
		location.reload();
	});

	// TODO (2022.09.29): ideally, I grab the whole url, but for now that is a security concern
	const copyToClipboardButton = document.querySelector(".copy-to-clipboard");
	copyToClipboardButton.onclick = _ => {
		navigator.clipboard.writeText(window.location.pathname);
	};

	createCommentForm.addEventListener("submit", async e => {
		e.preventDefault(); // prevent submit default behavior
		const res = await createComment(
			taskIdFromPath,
			createCommentTextInput.value
		);
		if (!res) return;
		clearInputValues(createCommentTextInput);
		getCommentsByTaskId(taskIdFromPath).then(comments => {
			renderCommentsFromJSON(comments);
		});
	});

	createCommentTextInput.addEventListener("keydown", e => {
		if (e.keyCode === 13 && e.ctrlKey) {
			e.preventDefault(); // prevent dialog not closing weirdness
			createCommentButton.click();
		}
	});

	// Character limits
	createCommentTextInput.setAttribute(
		"maxlength",
		serverConfig.comment_max_len
	);
	createCommentTextInput.addEventListener("input", _ => {
		createCommentCharIndicator.textContent = `
			${createCommentTextInput.value.length}
			/
			${serverConfig.comment_max_len}
		`;
	});
	createCommentTextInput.dispatchEvent(new Event("input")); // render once at startup

	function renderTask(task) {
		document.title = task.title;
		taskTitle.textContent = task.title;
		taskId.textContent = formatId(task.id);
		taskCreatedAt.textContent = formatDate(new Date(task.created_at));
		taskDesc.textContent = task.description;
		taskDescPreview.innerHTML = DOMPurify.sanitize(
			marked.parse(task.description)
		);
		taskTitle.setAttribute("maxlength", serverConfig.task_title_max_len);
		taskDesc.setAttribute("maxlength", serverConfig.task_desc_max_len);
		// status selector
		for (let i = 0; i < taskStatus.options.length; i++) {
			if (taskStatus.options[i].value === task.status) {
				taskStatus.options[i].selected = true;
				break;
			}
		}
		// parent story selector
		while (taskStorySelector.firstChild)
			taskStorySelector.removeChild(taskStorySelector.firstChild);
		// add in the special NULL story; selected by default
		const option = document.createElement("option");
		// since the value can't literally be null, use the identifier as a standin
		option.setAttribute("value", NULL_STORY_IDENTIFIER);
		option.textContent = NULL_STORY_IDENTIFIER;
		option.selected = true;
		taskStorySelector.appendChild(option);

		// bucketize the stories by sprint
		const sprintBuckets = new Map();
		Array.from(storyDataCache.values()).forEach(story => {
			if (!sprintBuckets.has(story.sprint_id))
				sprintBuckets.set(story.sprint_id, []);
			sprintBuckets.get(story.sprint_id).push(story);
		});
		// loop through the sorted keys (sprintIds)
		Array.from(sprintBuckets.keys())
			.sort((sprintId0, sprintId1) => {
				return (
					new Date(sprintDataCache.get(sprintId1).start_date) -
					new Date(sprintDataCache.get(sprintId0).start_date)
				);
			})
			.forEach(sprintId => {
				const optGroup = document.createElement("optgroup");
				optGroup.setAttribute("label", sprintDataCache.get(sprintId).title);
				sprintBuckets.get(sprintId).forEach(story => {
					const option = document.createElement("option");
					option.setAttribute("value", story.id);
					const sprintTitle = sprintDataCache.get(story.sprint_id).title;
					option.textContent = story.title;
					optGroup.appendChild(option);
					if (story.id === task.story_id) option.selected = true;
				});
				taskStorySelector.appendChild(optGroup);
			});
	}

	function renderCommentsFromJSON(comments) {
		if (!comments) {
			console.warn("no comments to render");
			return;
		}
		while (taskComments.firstChild)
			taskComments.removeChild(taskComments.firstChild);
		comments
			.sort((c0, c1) => {
				return new Date(c0.created_at) - new Date(c1.created_at);
			})
			.forEach(comment => {
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
})();