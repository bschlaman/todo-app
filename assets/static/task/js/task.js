(function (){
	const path = window.location.pathname;
	const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

	const taskTitle = document.querySelector(".task-title");
	const taskId = document.querySelector(".task-id");
	const taskStatus = document.querySelector(".task-status");
	const taskDesc = document.querySelector(".task-desc");
	const taskComments = document.querySelector(".task-comments");

	getTaskById(taskIdFromPath);

	function renderTask(task){
		taskTitle.innerHTML = task.title;
		taskId.innerHTML = task.id;
		taskStatus.innerHTML = task.status;
		taskDesc.innerHTML = task.description;
	}

	function getTaskById(id){
		fetch(`/get_task/${id}`, { method: "GET" })
			.then(res => res.json())
			.then(data => {
				renderTask(data);
			})
			.catch(err => {
				console.warn("error occured:", err);
			});
	}
})();
