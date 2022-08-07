(async function (){

	let serverConfig;
	// stores story data by story_id
	const storyDataCache = new Map();
	// stores sprint data by sprint_id
	const sprintDataCache = new Map();
	// stores task data by task_id
	const taskDataCache = new Map();
	const tagDataCache = new Map();
	const tagAssignmentDataCache = new Map();

	// should probably store this data elsewhere
	const tagColors = {
		"Todo App": "green",
		"Work": "blue",
		"Music": "red",
		"Chess Engine": "darkgoldenrod",
		"Life": "purple",
		"Piano": "darkgrey",
		"Guitar": "brown",
	}

	console.time("api_calls");
	await Promise.all([
		getConfig().then(config => {
			serverConfig = config;
		}),
		getStories().then(stories => {
			stories.forEach(story => {
				storyDataCache.set(story.id, story);
			});
		}),
		getSprints().then(sprints => {
			sprints.forEach(sprint => {
				sprintDataCache.set(sprint.id, sprint);
			});
		}),
		getTasks().then(tasks => {
			tasks.forEach(task => { taskDataCache.set(task.id, task); });
		}),
		getTags().then(tags => {
			tags.forEach(tag => { tagDataCache.set(tag.id, tag); });
		}),
		getTagAssignments().then(tagAssignments => {
			if(!tagAssignments) return;
			tagAssignments.forEach(tagAssignment => {
				tagAssignmentDataCache.set(tagAssignment.id, tagAssignment);
			});
		}),
	]);
	console.timeEnd("api_calls");
	console.log(tagAssignmentDataCache);

	// render sprint selector (must be before task render)
	const sprintSelect = document.querySelector(".sprint-select-wrapper select");
	sprintSelect.addEventListener("change", _ => {
		renderTasksFromJSON(Array.from(taskDataCache.values()));
		localStorage.setItem("viewing_sprint_id", sprintSelect.value);
	});
	sprintDataCache.forEach((sprint, _) => {
			const option = document.createElement("option");
			option.setAttribute("value", sprint.id);
			option.textContent = sprint.title;
			sprintSelect.appendChild(option);
			if(localStorage.getItem("viewing_sprint_id") === sprint.id)
				option.selected = true;
	});

	// TODO: renderTasksFromJSON should take no arguments and use the map
	renderTasksFromJSON(Array.from(taskDataCache.values()));
	renderStories();

	// CODE SECTION: CREATE TASK MODAL ============================
	const createTaskButton = document.querySelector(".create-task-button");
	const createTaskModal = document.querySelector(".create-task-modal");
	const createTaskTitleInput = createTaskModal.querySelector('input[name="title"]');
	const createTaskDescInput = createTaskModal.querySelector('textarea[name="description"]');
	const createTaskSelectInput = createTaskModal.querySelector('select[name="story"]');
	const createTaskSaveButton = createTaskModal.querySelector(".modal-save");
	// Create button
	createTaskButton.onclick = _ => {
		clearInputValues(createTaskTitleInput, createTaskDescInput, createTaskSelectInput); // page reload edge cases
		createTaskModal.showModal();
		createTaskTitleInput.focus();
		// Remove option from <select> and call /get_stories
		while(createTaskSelectInput.firstChild)
			createTaskSelectInput.removeChild(createTaskSelectInput.firstChild);
		Array.from(storyDataCache.values()).filter(s => {
				// if for some reason sprintSelect.value is falsey, dont filter
				if(!sprintSelect.value) return true;
				return s.sprint_id === sprintSelect.value;
		}).forEach(story => {
			const option = document.createElement("option");
			option.setAttribute("value", story.id);
			option.textContent = story.title;
			createTaskSelectInput.appendChild(option);
		});
	};
	createTaskTitleInput.setAttribute("maxlength", serverConfig.task_title_max_len);
	createTaskDescInput.setAttribute("maxlength", serverConfig.task_desc_max_len);
	// Close (x) button
	createTaskModal.querySelector(".modal-close").onclick = _ => { createTaskModal.close() };
	// CTRL-Enter to save
	createTaskModal.addEventListener("keydown", e => {
		if(e.keyCode === 13 && e.ctrlKey){
			e.preventDefault(); // prevent dialog not closing weirdness
			createTaskSaveButton.click();
		}
	});
	createTaskSaveButton.addEventListener("click", _ => {
		createTask(createTaskTitleInput.value, createTaskDescInput.value, createTaskSelectInput.value);
		// TODO: BAD!  createTask is async, so this may miss new tasks
		// also, not sure when to clearInputValues - i think this is a UX decision
		setTimeout(_ => {
			clearInputValues(createTaskTitleInput, createTaskDescInput, createTaskSelectInput);
			location.reload();
		}, 500);
	});
	// END CREATE TASK MODAL ============================

	// CODE SECTION: CREATE STORY MODAL ============================
	const createStoryButton = document.querySelector(".create-story-button");
	const createStoryModal = document.querySelector(".create-story-modal");
	const createStoryTitleInput = createStoryModal.querySelector('input[name="title"]');
	const createStoryDescInput = createStoryModal.querySelector('textarea[name="description"]');
	const createStorySelectInput = createStoryModal.querySelector('select[name="sprint"]');
	const createStorySaveButton = createStoryModal.querySelector(".modal-save");
	// Create button
	createStoryButton.onclick = _ => {
		clearInputValues(createStoryTitleInput, createStoryDescInput, createStorySelectInput); // page reload edge cases
		createStoryModal.showModal();
		createStoryTitleInput.focus();
		// Remove option from <select> and call /get_stories
		while(createStorySelectInput.firstChild) createStorySelectInput.removeChild(createStorySelectInput.firstChild);
		sprintDataCache.forEach((sprint, _) => {
			let option = document.createElement("option");
			option.setAttribute("value", sprint.id);
			option.textContent = sprint.title;
			createStorySelectInput.appendChild(option);
		});
	};
	createStoryTitleInput.setAttribute("maxlength", serverConfig.story_title_max_len);
	createStoryDescInput.setAttribute("maxlength", serverConfig.story_desc_max_len);
	// Close (x) button
	createStoryModal.querySelector(".modal-close").onclick = _ => { createStoryModal.close() };
	// CTRL-Enter to save
	createStoryModal.addEventListener("keydown", e => {
		if(e.keyCode === 13 && e.ctrlKey){
			e.preventDefault(); // prevent dialog not closing weirdness
			createStorySaveButton.click();
		}
	});
	createStorySaveButton.addEventListener("click", _ => {
		createStory(createStoryTitleInput.value, createStoryDescInput.value, createStorySelectInput.value);
		// TODO: BAD!  createStory is async, so this may miss new Storys
		setTimeout(_ => {
			clearInputValues(createStoryTitleInput, createStoryDescInput, createStorySelectInput);
			location.reload();
		}, 500);
	});
	// END CREATE STORY MODAL ============================

	// CODE SECTION: CREATE SPRINT MODAL ============================
	const createSprintButton = document.querySelector(".create-sprint-button");
	const createSprintModal = document.querySelector(".create-sprint-modal");
	const createSprintTitleInput = createSprintModal.querySelector('input[name="title"]');
	const createSprintStartdateInput = createSprintModal.querySelector('input[name="startdate"]');
	const createSprintEnddateInput = createSprintModal.querySelector('input[name="enddate"]');
	const createSprintSaveButton = createSprintModal.querySelector(".modal-save");
	// Create button
	createSprintButton.onclick = _ => {
		clearInputValues(createSprintTitleInput, createSprintStartdateInput, createSprintEnddateInput); // page reload edge cases
		createSprintModal.showModal();
		createSprintTitleInput.focus();
	};
	createSprintTitleInput.setAttribute("maxlength", serverConfig.sprint_title_max_len);
	// Close (x) button
	createSprintModal.querySelector(".modal-close").onclick = _ => { createSprintModal.close() };
	// CTRL-Enter to save
	createSprintModal.addEventListener("keydown", e => {
		if(e.keyCode === 13 && e.ctrlKey){
			e.preventDefault(); // prevent dialog not closing weirdness
			createSprintSaveButton.click();
		}
	});
	createSprintSaveButton.addEventListener("click", _ => {
		createSprint(createSprintTitleInput.value, createSprintStartdateInput.value, createSprintEnddateInput.value);
		// TODO: BAD!  createSprint is async, so this may miss new Sprints
		setTimeout(_ => {
			clearInputValues(createSprintTitleInput, createSprintStartdateInput, createSprintEnddateInput);
			location.reload();
		}, 500);
	});
	// END CREATE SPRINT MODAL ============================
	// CODE SECTION: CREATE TAG MODAL ============================
	const createTagButton = document.querySelector(".create-tag-button");
	const createTagModal = document.querySelector(".create-tag-modal");
	const createTagTitleInput = createTagModal.querySelector('input[name="title"]');
	const createTagDescInput = createTagModal.querySelector('textarea[name="description"]');
	const createTagSaveButton = createTagModal.querySelector(".modal-save");
	// Create button
	createTagButton.onclick = _ => {
		clearInputValues(createTagTitleInput, createTagDescInput); // page reload edge cases
		createTagModal.showModal();
		createTagTitleInput.focus();
	};
	createTagTitleInput.setAttribute("maxlength", serverConfig.tag_title_max_len);
	createTagDescInput.setAttribute("maxlength", serverConfig.tag_desc_max_len);
	// Close (x) button
	createTagModal.querySelector(".modal-close").onclick = _ => { createTagModal.close() };
	// CTRL-Enter to save
	createTagModal.addEventListener("keydown", e => {
		if(e.keyCode === 13 && e.ctrlKey){
			e.preventDefault(); // prevent dialog not closing weirdness
			createTagSaveButton.click();
		}
	});
	createTagSaveButton.addEventListener("click", _ => {
		createTag(createTagTitleInput.value, createTagDescInput.value);
		setTimeout(_ => {
			clearInputValues(createTagTitleInput, createTagDescInput);
			location.reload();
		}, 500);
	});
	// END CREATE TAG MODAL ============================


	const buckets = document.querySelectorAll(".todo-app-bucket");

	buckets.forEach(bucket => {
		bucket.addEventListener("dragover", e => {
			e.preventDefault();

			const dragging = document.querySelector(".task.dragging");
			// TODO: do I really need vertical sorting functionality?
			const belowTask = getClosestTaskBelowCursor(bucket, e.clientY);

			// hack: avoid using "dragenter" & "dragleave" events
			// which do not play nicely with child nodes
			buckets.forEach(b => {
				if(b !== bucket) b.classList.remove(hoverClass);
			});

			bucket.classList.add(hoverClass);

			if(belowTask === null){
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

	function getClosestTaskBelowCursor(bucket, y){
		const nonDraggingTasks = [...bucket.querySelectorAll(".task:not(.dragging)")];

		return nonDraggingTasks.reduce((closestTask, task) => {
			const box = task.getBoundingClientRect();
			const offset = y - box.top - box.height / 2;
			if(offset < 0 && offset > closestTask.offset)
				return { offset: offset, element: task };
			return closestTask;
		}, { offset: Number.NEGATIVE_INFINITY }).element;
	}

	function renderTasksFromJSON(tasks){
		if(!tasks){
			console.warn("no tasks to render!");
		}
		if(!sprintSelect.value){
			console.err("couldn't get sprint from dropdown, therefore cannot render tasksk");
			return;
		}
		// Clear out the task elements to avoid duplication
		document.querySelectorAll(".task").forEach(task => { task.remove(); });
		// Only take tasks which are in the selected sprint
		tasks.filter(t => {
			const story = storyDataCache.get(t.story_id);
			return story.sprint_id === sprintSelect.value;
		}).forEach(task => {
			const taskDiv = document.createElement("div");
			taskDiv.classList.add("task");

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
			taskDesc.textContent = task.description;

			const taskId = document.createElement("p");
			taskId.classList.add("task-id");
			taskId.textContent = task.id;

			const taskStatus = document.createElement("p");
			taskStatus.classList.add("task-status");
			taskStatus.textContent = task.status;

			const taskCreatedAt = document.createElement("p");
			taskCreatedAt.classList.add("task-created-at");
			taskCreatedAt.textContent = formatDate(new Date(task.created_at));

			const taskStoryTitle = document.createElement("p");
			taskStoryTitle.classList.add("task-story-title");
			taskStoryTitle.textContent = storyDataCache.get(task.story_id).title;

			taskDiv.appendChild(taskHandle);
			taskDiv.appendChild(taskEditLink);
			taskDiv.appendChild(taskTitle);
			taskDiv.appendChild(taskDesc);
			taskDiv.appendChild(taskCreatedAt);
			taskDiv.appendChild(taskStoryTitle);

			taskHandle.addEventListener("mousedown", e => {
				taskDiv.setAttribute("draggable", true);
			});
			taskHandle.addEventListener("mouseup", e => {
				taskDiv.setAttribute("draggable", false);
			});

			taskDiv.addEventListener("dragstart", _ => {
				taskDiv.classList.add("dragging");
			});
			taskDiv.addEventListener("dragend", _ => {
				// just in case not caught by mouseup
				taskDiv.setAttribute("draggable", false);
				taskDiv.classList.remove("dragging");
				buckets.forEach(b => { b.classList.remove(hoverClass) });
				const destinationStatus = taskDiv.parentNode.dataset.status;
				updateTaskById(task.id, destinationStatus, task.title, task.description, task.story_id);
			});

			// TODO: this is not maintainable / extensible; html file
			// is tightly coupled with data model.  Can I pull in this as config somehow?
			// e.g. /get_config -> {"status_buckets": ["BACKLOG", "DOING", ...]}
			const bucket = document.querySelector(`[data-status="${task.status}"]`);
			bucket.appendChild(taskDiv);
		});
	}

	function renderStories(){
		storyDataCache.forEach((story, _) => {
			const storyDiv = document.createElement("div");
			storyDiv.classList.add("story");

			const storyTitle = document.createElement("h4");
			storyTitle.classList.add("story-title");
			storyTitle.textContent = story.title;

			const storyDesc = document.createElement("p");
			storyDesc.classList.add("story-desc");
			storyDesc.textContent = story.description;

			const storyEditLink = document.createElement("a");
			storyEditLink.classList.add("story-edit-link");
			storyEditLink.textContent = "edit";
			storyEditLink.setAttribute("href", `/story/${story.id}`);

			const storyMetadataContainer = document.createElement("div");
			storyMetadataContainer.classList.add("story-metadata-container");

			const storySprintTitle = document.createElement("p");
			storySprintTitle.classList.add("story-sprint-title");
			storySprintTitle.textContent = sprintDataCache.get(story.sprint_id).title;

			const storyCreatedAt = document.createElement("p");
			storyCreatedAt.classList.add("story-created-at");
			storyCreatedAt.textContent = formatDate(new Date(story.created_at));

			const storyTags = document.createElement("div");
			storyTags.classList.add("story-tags");
			tagDataCache.forEach((tag, _) => {
				const tagCheckBox = document.createElement("input");
				tagCheckBox.setAttribute("type", "checkbox");
				tagCheckBox.setAttribute("name", tag.title);
				tagCheckBox.dataset.tag_id = tag.id;
				tagCheckBox.addEventListener("change", _ => {
					createTagAssignment(tag.id, story.id);
				});
				// this is an expensive O(n) operation, but I dont care
				tagAssignmentDataCache.forEach((ta, _) => {
					if(ta.story_id === story.id && ta.tag_id === tag.id)
						tagCheckBox.checked = true;
				});
				const tagCheckBoxLabel = document.createElement("label");
				tagCheckBoxLabel.setAttribute("for", tag.title);
				tagCheckBoxLabel.style.color = tagColors[tag.title];
				tagCheckBoxLabel.textContent = tag.title;
				storyTags.appendChild(tagCheckBox);
				storyTags.appendChild(tagCheckBoxLabel);
			});

			storyDiv.appendChild(storyTitle);
			storyDiv.appendChild(storyDesc);
			storyDiv.appendChild(storyEditLink);
			storyDiv.appendChild(storyTags);
			storyDiv.appendChild(storyMetadataContainer);
			storyMetadataContainer.appendChild(storyCreatedAt);
			storyMetadataContainer.appendChild(storySprintTitle);

			const storiesWrapper = document.querySelector(".stories-wrapper");
			storiesWrapper.appendChild(storyDiv);
		});
	}

})();
