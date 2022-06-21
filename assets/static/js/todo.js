(function (){
	getTasks();

	const tasks = document.querySelectorAll(".task");
	const buckets = document.querySelectorAll(".todo-app-bucket");
	const newTaskButton = document.querySelector(".task-creation-wrapper form button");
	const hoverClass = "droppable-hover";

	newTaskButton.onclick = _ => {
		const titleInput = document.querySelector('input [name="title"]');
		const descInput = document.querySelector('input [name="description"]');
		createTask(titleInput.value, descInput);
		// TODO: examine the order of operations here
		getTasks();
	};

	tasks.forEach(task => {
		task.addEventListener("dragstart", _ => {
			task.classList.add("dragging");
		});
		task.addEventListener("dragend", _ => {
			task.classList.remove("dragging");
			buckets.forEach(b => {b.classList.remove(hoverClass)});
		});
	});

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
		fetch("/get_tasks", { method: "GET" })
			.then(res => res.json())
			.then(data => {
				console.log(data);
				data.forEach(task => { renderTask(task); });
			})
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

	function renderTask(task){
		const taskDiv = document.createElement("div");
		taskDiv.classList.add("task");
		taskDiv.setAttribute("draggable", "true");

		const taskTitle = document.createElement("h4");
		taskTitle.classList.add("task-title");
		taskTitle.innerHTML = task.title;

		const taskId = document.createElement("p");
		taskId.classList.add("task-id");
		taskId.innerHTML = task.id;

		const taskDesc = document.createElement("p");
		taskDesc.classList.add("task-desc");
		taskDesc.innerHTML = task.description;

		const taskStatus = document.createElement("p");
		taskStatus.classList.add("task-status");
		taskStatus.innerHTML = task.status;

		const taskCreatedAt = document.createElement("p");
		taskCreatedAt.classList.add("task-created-at");
		taskCreatedAt.innerHTML = task.created_at;

		taskDiv.appendChild(taskTitle);
		taskDiv.appendChild(taskId);
		taskDiv.appendChild(taskDesc);
		taskDiv.appendChild(taskStatus);
		taskDiv.appendChild(taskCreatedAt);

		taskDiv.addEventListener("dragstart", _ => {
			taskDiv.classList.add("dragging");
		});
		taskDiv.addEventListener("dragend", _ => {
			taskDiv.classList.remove("dragging");
			buckets.forEach(b => {b.classList.remove(hoverClass)});
		});

		// TODO: this is not maintainable / extensible; html file
		// is tightly coupled with data model
		const bucket = document.querySelector(`[data-status="${task.status}"]`);
		bucket.appendChild(taskDiv);
	}

	function createTask(title, description) {
		if(!title || !desctiption){
			console.warn("task creation failed");
			return;
		}
		fetch("/create_task", {
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

})();
