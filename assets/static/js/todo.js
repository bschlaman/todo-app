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
	const TAG_COLORS = {
		"Todo App": "green",
		"Work": "blue",
		"Music": "red",
		"Chess Engine": "darkgoldenrod",
		"Life": "purple",
		"Piano": "darkgrey",
		"Guitar": "brown",
		"Intellectual Pursuits": "darkblue",
	}

	const LOCAL_STORAGE_KEYS = {
		selectedSprintId: "viewing_sprint_id",
		selectedTagIds: "selected_tag_ids",
	};

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
	console.table(serverConfig);

	// render sprint selector (must be before task render)
	const sprintSelect = document.querySelector(".sprint-select-wrapper select");
	sprintSelect.addEventListener("change", _ => {
		renderTasksFromJSON(Array.from(taskDataCache.values()));
		renderStories();
		localStorage.setItem(LOCAL_STORAGE_KEYS.selectedSprintId, sprintSelect.value);
	});
	sprintDataCache.forEach((sprint, _) => {
			const option = document.createElement("option");
			option.setAttribute("value", sprint.id);
			option.textContent = sprintToString(sprint);
			sprintSelect.appendChild(option);
			if(localStorage.getItem(LOCAL_STORAGE_KEYS.selectedSprintId) === sprint.id)
				option.selected = true;
	});

	// render tag selector
	// wrapping in a function for now so I can call it from
	// some kind of render() func later
	(function(){
		const tagsWrapper = document.querySelector(".tags-wrapper");
		const localStorageSelectedTagIds = localStorage.getItem(
			LOCAL_STORAGE_KEYS.selectedTagIds,
		);
		tagDataCache.forEach((tag, _) => {
			const tagCheckBox = document.createElement("input");
			tagCheckBox.setAttribute("type", "checkbox");
			tagCheckBox.setAttribute("name", tag.title);
			tagCheckBox.dataset.tag_id = tag.id;
			if(localStorageSelectedTagIds?.includes(tag.id))
				tagCheckBox.checked = true;
			tagCheckBox.addEventListener("change", _ => {
				setLocalStorageSelectedTags();
				renderTasksFromJSON(Array.from(taskDataCache.values()));
			});
			const tagCheckBoxLabel = document.createElement("label");
			tagCheckBoxLabel.setAttribute("for", tag.title);
			tagCheckBoxLabel.style.color = TAG_COLORS[tag.title];
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
		allAnchor.onclick = _ => {
			document.querySelectorAll(".tags-wrapper input")?.forEach(i => {
				i.checked = true;
			});
			// TODO: would be better to fire an event here
			setLocalStorageSelectedTags();
			renderTasksFromJSON(Array.from(taskDataCache.values()));
		};
		noneAnchor.onclick = _ => {
			document.querySelectorAll(".tags-wrapper input")?.forEach(i => {
				i.checked = false;
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
	const createTaskButton = document.querySelector(".create-task-button");
	const createTaskModal = document.querySelector(".create-task-modal");
	const createTaskTitleInput = createTaskModal.querySelector('input[name="title"]');
	const createTaskDescInput = createTaskModal.querySelector('textarea[name="description"]');
	const createTaskSelectInput = createTaskModal.querySelector('select[name="story"]');
	const createTaskSaveButton = createTaskModal.querySelector(".modal-save");
	// Create button
	createTaskButton.onclick = _ => {
		createTaskModal.showModal();
		createTaskTitleInput.focus();
		// TODO: this isn't really necessary anymore since I reload page
		// after new stories are created.  This makes it more difficult to save
		// the last input that was selected - would have to do that by
		// saving to local storage
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
	createTaskSaveButton.addEventListener("click", async _ => {
		const res = await createTask(
			createTaskTitleInput.value, createTaskDescInput.value, createTaskSelectInput.value
		);
		if(!res) return;
		clearInputValues(createTaskTitleInput, createTaskDescInput);
		location.reload();
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
	createStorySaveButton.addEventListener("click", async _ => {
		const res = await createStory(
			createStoryTitleInput.value, createStoryDescInput.value, createStorySelectInput.value
		);
		if(!res) return;
		clearInputValues(createStoryTitleInput, createStoryDescInput);
		location.reload();
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
	createSprintSaveButton.addEventListener("click", async _ => {
		const res = await createsprint(
			createSprintTitleInput.value, createSprintStartdateInput.value, createSprintEnddateInput.value
		);
		if(!res) return;
		clearInputValues(createSprintTitleInput);
		location.reload();
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
	createTagSaveButton.addEventListener("click", async _ => {
		const res = await createTag(createTagTitleInput.value, createTagDescInput.value);
		if(!res) return;
		clearInputValues(createTagTitleInput, createTagDescInput);
		location.reload();
	});
	// END CREATE TAG MODAL ============================

	// CODE SECTION: BULK CREATE TASK MODAL ============================
	const bulkCreateTaskButton = document.querySelector(".bulk-create-task-button");
	const bulkCreateTaskModal = document.querySelector(".bulk-create-task-modal");
	const bulkCreateTaskTitleInput = bulkCreateTaskModal.querySelector('input[name="title"]');
	const bulkCreateTaskDescInput = bulkCreateTaskModal.querySelector('textarea[name="description"]');
	const bulkCreateTaskSelectInput = bulkCreateTaskModal.querySelector('select[name="story"]');
	const bulkCreateTaskSaveButton = bulkCreateTaskModal.querySelector(".modal-save");
	// Create button
	bulkCreateTaskButton.onclick = _ => {
		bulkCreateTaskModal.showModal();
		bulkCreateTaskTitleInput.focus();
		// Remove option from <select> and call /get_stories
		while(bulkCreateTaskSelectInput.firstChild)
			bulkCreateTaskSelectInput.removeChild(bulkCreateTaskSelectInput.firstChild);
		Array.from(storyDataCache.values()).filter(s => {
				// if for some reason sprintSelect.value is falsey, dont filter
				if(!sprintSelect.value) return true;
				return s.sprint_id === sprintSelect.value;
		}).forEach(story => {
			const option = document.createElement("option");
			option.setAttribute("value", story.id);
			option.textContent = story.title;
			bulkCreateTaskSelectInput.appendChild(option);
		});
	};
	bulkCreateTaskTitleInput.setAttribute("maxlength", serverConfig.task_title_max_len);
	bulkCreateTaskDescInput.setAttribute("maxlength", serverConfig.task_desc_max_len);
	// Close (x) button
	bulkCreateTaskModal.querySelector(".modal-close").onclick = _ => { bulkCreateTaskModal.close() };
	// CTRL-Enter to save
	bulkCreateTaskModal.addEventListener("keydown", e => {
		if(e.keyCode === 13 && e.ctrlKey){
			e.preventDefault(); // prevent dialog not closing weirdness
			bulkCreateTaskSaveButton.click();
		}
	});
	bulkCreateTaskSaveButton.addEventListener("click", async _ => {
		// TODO: partial success handling
		await bulkCreateTasks(bulkCreateTaskTitleInput.value, bulkCreateTaskDescInput.value, bulkCreateTaskSelectInput.value);
		location.reload();
	});
	// END BULK CREATE TASK MODAL ============================


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
			console.err("couldn't get sprint from dropdown, therefore cannot render tasks");
			return;
		}
		// Clear out the task elements to avoid duplication
		document.querySelectorAll(".task").forEach(task => { task.remove(); });

		const selectedTagIds = new Set();
		document.querySelectorAll(".tags-wrapper input").forEach(tagCheckBox => {
			if(tagCheckBox.checked) selectedTagIds.add(tagCheckBox.dataset.tag_id);
		});
		tasks.filter(t => {
			const story = storyDataCache.get(t.story_id);
			if(story.sprint_id !== sprintSelect.value) return false;
			// inefficient
			for(const ta of tagAssignmentDataCache.values()){
				if(ta.story_id === t.story_id && selectedTagIds.has(ta.tag_id)) return true;
			}
			return false;
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
			taskDesc.innerHTML = DOMPurify.sanitize(marked.parse(task.description));

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

			const taskTags = document.createElement("div");
			taskTags.classList.add("task-tags");
			tagAssignmentDataCache.forEach((ta, _) => {
				if(ta.story_id !== task.story_id) return;
				const tag = tagDataCache.get(ta.tag_id);
				const taskTag = document.createElement("span");
				taskTag.style.background = TAG_COLORS[tag.title];
				taskTag.textContent = tag.title;
				taskTags.appendChild(taskTag);
			});

			taskDiv.appendChild(taskHandle);
			taskDiv.appendChild(taskEditLink);
			taskDiv.appendChild(taskTitle);
			taskDiv.appendChild(taskDesc);
			taskDiv.appendChild(taskTags);
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
			bucket?.appendChild(taskDiv);
		});
	}

	function renderStories(){
		if(!sprintSelect.value){
			console.err("couldn't get sprint from dropdown, therefore cannot render stories");
			return;
		}

		// Clear out the story elements to avoid duplication
		document.querySelectorAll(".story").forEach(story => { story.remove(); });

		Array.from(storyDataCache.values()).filter(story => {
			return story.sprint_id === sprintSelect.value;
		}).forEach((story, _) => {
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

			storyMetadataContainer.appendChild(storyCreatedAt);
			storyMetadataContainer.appendChild(storySprintTitle);

			const storyTags = document.createElement("div");
			storyTags.classList.add("story-tags");
			tagDataCache.forEach((tag, _) => {
				const tagCheckBox = document.createElement("input");
				tagCheckBox.setAttribute("type", "checkbox");
				tagCheckBox.setAttribute("name", tag.title);
				tagCheckBox.dataset.tag_id = tag.id;
				tagCheckBox.addEventListener("change", _ => {
					if(tagCheckBox.checked){
						createTagAssignment(tag.id, story.id);
					} else {
						destroyTagAssignment(tag.id, story.id);
					}
				});
				// this is an expensive O(n) operation, but I dont care
				tagAssignmentDataCache.forEach((ta, _) => {
					if(ta.story_id === story.id && ta.tag_id === tag.id)
						tagCheckBox.checked = true;
				});
				const tagCheckBoxLabel = document.createElement("label");
				tagCheckBoxLabel.setAttribute("for", tag.title);
				tagCheckBoxLabel.style.color = TAG_COLORS[tag.title];
				tagCheckBoxLabel.textContent = tag.title;
				storyTags.appendChild(tagCheckBox);
				storyTags.appendChild(tagCheckBoxLabel);
			});

			const storySprintSelect = document.createElement("select");
			sprintDataCache.forEach((sprint, _) => {
				let option = document.createElement("option");
				option.setAttribute("value", sprint.id);
				option.textContent = sprintToString(sprint);
				if(story.sprint_id === sprint.id) option.selected = true;
				storySprintSelect.appendChild(option);
			});
			storySprintSelect.addEventListener("change", async _ => {
				const res = await updateStoryById(
					story.id,
					story.status,
					story.title,
					story.description,
					storySprintSelect.value,
				);
				if(!res) return;
				location.reload();
			});

			const openTasksListWrapper = document.createElement("div");
			const openTasksListTitle = document.createElement("h4");
			openTasksListTitle.textContent = "Tasks in this sprint";
			const openTasksList = document.createElement("ul");
			openTasksListWrapper.appendChild(openTasksListTitle);
			openTasksListWrapper.appendChild(openTasksList);
			Array.from(taskDataCache.values()).filter(task => {
				if(task.story_id !== story.id) return false;
				return true;
			}).forEach(task => {
				const li = document.createElement("li");
				li.textContent = `(${task.status}) ${task.title}`;
				openTasksList.appendChild(li);
			})


			storyDiv.appendChild(storyTitle);
			storyDiv.appendChild(storyDesc);
			storyDiv.appendChild(storyEditLink);
			storyDiv.appendChild(storyTags);
			storyDiv.appendChild(storySprintSelect);
			storyDiv.appendChild(openTasksListWrapper);
			// don't need to display this info for now, the sprint is
			// already captured by the sprint select
			// storyDiv.appendChild(storyMetadataContainer);

			const storiesWrapper = document.querySelector(".stories-wrapper");
			storiesWrapper.appendChild(storyDiv);
		});
	}

	function setLocalStorageSelectedTags(){
		const selectedTagIds = [...document.querySelectorAll(".tags-wrapper input")]
			.filter(tagCheckBox => {
			return tagCheckBox.checked;
		}).map(e => {
			return e.dataset.tag_id;
		});

		localStorage.setItem(LOCAL_STORAGE_KEYS.selectedTagIds, selectedTagIds);
	}

	async function bulkCreateTasks(commonTitle, commonDescription, storyId){
		const story = storyDataCache.get(storyId);
		const sprint = sprintDataCache.get(story.sprint_id);
		const sprintStart = new Date(sprint.start_date);
		const sprintEnd = new Date(sprint.end_date);
		for(let d = sprintStart; d <= sprintEnd; d.setUTCDate(d.getUTCDate() + 1)){
			const monthString = String(d.getUTCMonth() + 1).padStart(2, "0");
			const dateString = String(d.getUTCDate()).padStart(2, "0");
			const prefix = `[${monthString}.${dateString}] `;
			await createTask(prefix + commonTitle, commonDescription, storyId).then(_ => {
				console.log("Created task", prefix + commonTitle);
			});
		}
	}

})();
