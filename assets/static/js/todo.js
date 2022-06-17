(function (){
	const tasks = document.querySelectorAll(".task");
	const buckets = document.querySelectorAll(".todo-app-bucket");
	const hoverClass = "droppable-hover";

	tasks.forEach(task => {
		task.addEventListener("dragstart", _ => {
			task.classList.add("dragging");
		});
		task.addEventListener("dragend", _ => {
			task.classList.remove("dragging");
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

		bucket.addEventListener("drop", _ => {
			bucket.classList.remove(hoverClass);
		});
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
})();
