(function (){
	const routes = {
		getTasks: `/get_tasks`,
		createTask: `/create_task`,
		updateTask: `/put_task`,
		getStories: `/get_stories`,
		getSprints: `/get_sprints`,
		createStory: `/create_story`,
		createSprint: `/create_sprint`,
	};

	// TODO: should the action of clearing state, fetching data,
	// and rendering be one function?
	getTasks().then(tasks => { renderTasksFromJSON(tasks) });
	getStories();

	const hoverClass = "droppable-hover";

	const buckets = document.querySelectorAll(".todo-app-bucket");

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
		while(createTaskSelectInput.firstChild) createTaskSelectInput.removeChild(createTaskSelectInput.firstChild);
		// TODO: this is bad, catch should be at the end
		getStories().then(stories => {
			stories.forEach(story => {
				let option = document.createElement("option");
				option.setAttribute("value", story.id);
				option.innerHTML = story.title;
				createTaskSelectInput.appendChild(option);
			});
		});
	};
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
		setTimeout(_ => {
			clearInputValues(createTaskTitleInput, createTaskDescInput, createTaskSelectInput);
			getTasks().then(tasks => { renderTasksFromJSON(tasks) });
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
		// TODO: this is bad, catch should be at the end
		getSprints().then(sprints => {
			sprints.forEach(sprint => {
				let option = document.createElement("option");
				option.setAttribute("value", sprint.id);
				option.innerHTML = sprint.title;
				createStorySelectInput.appendChild(option);
			});
		});
	};
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
		}, 500);
	});
	// END CREATE SPRINT MODAL ============================


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
		// Clear out the task elements to avoid duplication
		document.querySelectorAll(".task").forEach(task => { task.remove(); });
		tasks.forEach(task => {
			const taskDiv = document.createElement("div");
			taskDiv.classList.add("task");
			taskDiv.setAttribute("draggable", "true");

			const taskTitle = document.createElement("h4");
			taskTitle.classList.add("task-title");
			taskTitle.innerHTML = task.title;

			const taskEditLink = document.createElement("a");
			taskEditLink.classList.add("task-edit-link");
			taskEditLink.innerHTML = "edit";
			taskEditLink.setAttribute("href", `/task/${task.id}`);
			taskEditLink.setAttribute("target", "_blank");

			const taskDesc = document.createElement("p");
			taskDesc.classList.add("task-desc");
			taskDesc.innerHTML = task.description;

			const taskId = document.createElement("p");
			taskId.classList.add("task-id");
			taskId.innerHTML = task.id;

			const taskStatus = document.createElement("p");
			taskStatus.classList.add("task-status");
			taskStatus.innerHTML = task.status;

			const taskCreatedAt = document.createElement("p");
			taskCreatedAt.classList.add("task-created-at");
			taskCreatedAt.innerHTML = task.created_at;

			const taskStoryId = document.createElement("p");
			taskCreatedAt.classList.add("task-story-id");
			taskCreatedAt.innerHTML = "story: " + task.story_id;

			taskDiv.appendChild(taskEditLink);
			taskDiv.appendChild(taskTitle);
			taskDiv.appendChild(taskDesc);
			// taskDiv.appendChild(taskStatus);
			taskDiv.appendChild(taskCreatedAt);
			taskDiv.appendChild(taskStoryId);

			taskDiv.addEventListener("dragstart", _ => {
				taskDiv.classList.add("dragging");
			});
			taskDiv.addEventListener("dragend", _ => {
				taskDiv.classList.remove("dragging");
				buckets.forEach(b => { b.classList.remove(hoverClass) });
				const destinationStatus = taskDiv.parentNode.dataset.status;
				// TODO: it may be a problem to only use the original task data for later updates
				updateTaskById(task.id, destinationStatus, task.title, task.description);
			});

			// TODO: this is not maintainable / extensible; html file
			// is tightly coupled with data model
			const bucket = document.querySelector(`[data-status="${task.status}"]`);
			bucket.appendChild(taskDiv);
		});
	}

	function getTasks(){
		return fetch(routes.getTasks, { method: "GET" })
			.then(res => res.json())
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

	function getStories() {
		return fetch(routes.getStories, { method: "GET" })
			.then(res => res.json())
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

	function getSprints() {
		return fetch(routes.getSprints, { method: "GET" })
			.then(res => res.json())
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

	function createTask(title, description, storyId) {
		if(!title || !description || !storyId){
			console.warn("task creation failed");
			return;
		}
		fetch(routes.createTask, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title:       title,
				description: description,
				story_id:    storyId,
			}),
		});
	}

	function createStory(title, description, sprintId) {
		if(!title || !description || !sprintId){
			console.warn("story creation failed");
			return;
		}
		fetch(routes.createStory, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title:       title,
				description: description,
				sprint_id:   sprintId,
			}),
		});
	}

	function createSprint(title, startdate, enddate) {
		if(!title || !startdate || !enddate){
			console.warn("story creation failed");
			return;
		}
		fetch(routes.createSprint, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title:      title,
				start_date: new Date(startdate),
				end_date:   new Date(enddate),
			}),
		});
	}

	function updateTaskById(id, status, title, description) {
		if(!id){
			console.warn("task update failed");
			return;
		}
		fetch(routes.updateTask, {
			method: "PUT",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id:          id,
				status:      status,
				title:       title,
				description: description,
			}),
		})
		.catch(err => {
			console.warn("error occured:", err);
		});
	}

	function clearInputValues(...inputElements) {
		inputElements.forEach(inputElement => {
			inputElement.value = "";
		});
	}

})();
