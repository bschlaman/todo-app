(function (){
	const buckets = document.querySelectorAll(".todo-app-bucket");
	const openCreateTaskModalButton = document.querySelector("button.modal-open");
	const closeCreateTaskModalButton = document.querySelector("button.modal-close");
	const newTaskSaveButton = document.querySelector(".create-task-modal .task-save");
	const hoverClass = "droppable-hover";
	const modal = document.querySelector(".create-task-modal");
	// TODO: for development purposes only
	const routesPrefix = "";
	const routes = {
		getTasks: `${routesPrefix}/get_tasks`,
		createTask: `${routesPrefix}/create_task`,
		updateTask: `${routesPrefix}/put_task`,
	};

	document.querySelectorAll(".task").forEach(task => { task.remove(); });
	getTasks();

	newTaskSaveButton.onclick = _ => {
		const titleInput = document.querySelector('input[name="title"]');
		const descInput = document.querySelector('textarea[name="description"]');
		createTask(titleInput.value, descInput.value);
		// TODO: examine the order of operations here
		document.querySelectorAll(".task").forEach(task => { task.remove(); });
		getTasks();
	}

	openCreateTaskModalButton.onclick = _ => {
		modal.showModal();
	};

	closeCreateTaskModalButton.onclick = _ => {
		modal.close();
	}

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

	function getTasks(){
		fetch(routes.getTasks, { method: "GET" })
			.then(res => res.json())
			.then(data => {
				data.forEach(task => { renderTaskFromJSON(task); });
			})
			.catch(err => {
				// TODO: this catches when res is undefined.  is there a more graceful way?
				console.warn("error occured:", err);
			});
	}

	function renderTaskFromJSON(task){
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

		taskTitle.onblur = taskDesc.onblur = _ => {
			updateTaskById(task.id, taskStatus.innerHTML, taskTitle.innerHTML, taskDesc.innerHTML);
		};

		taskDiv.appendChild(taskEditLink);
		taskDiv.appendChild(taskTitle);
		taskDiv.appendChild(taskDesc);
		// taskDiv.appendChild(taskStatus);
		taskDiv.appendChild(taskCreatedAt);
		taskDiv.appendChild(taskId);

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
	}

	function createTask(title, description) {
		if(!title || !description){
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

})();
