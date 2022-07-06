(function (){
	const path = window.location.pathname;
	const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

	const taskTitle = document.querySelector(".task-title");
	const taskId = document.querySelector(".task-id");
	const taskStatus = document.querySelector(".task-status");
	const taskDesc = document.querySelector(".task-desc");
	const taskComments = document.querySelector(".task-comments");

	getTaskById(taskIdFromPath);
	getCommentsByTaskId(taskIdFromPath);

	function renderTask(task){
		taskTitle.innerHTML = task.title;
		taskId.innerHTML = task.id;
		taskStatus.innerHTML = task.status;
		taskDesc.innerHTML = task.description;
	}

	function renderComments(comments){
		comments.forEach(comment => {
			const commentWrapper = document.createElement("div");
			commentWrapper.classList.add("comment-wrapper");

			const commentText = document.createElement("p");
			commentText.classList.add("comment-text");
			commentText.innerHTML = comment.text;

			const commentCreatedAt = document.createElement("p");
			commentCreatedAt.classList.add("comment-created-at");
			commentCreatedAt.innerHTML = comment.created_at;

			const commentId = document.createElement("p");
			commentId.classList.add("comment-id");
			commentId.innerHTML = comment.id;

			commentWrapper.appendChild(commentId);
			commentWrapper.appendChild(commentText);
			commentWrapper.appendChild(commentCreatedAt);
			taskComments.appendChild(commentWrapper);
		});
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

	function getCommentsByTaskId(id){
		fetch(`/get_comments_by_task_id?id=${id}`, { method: "GET" })
			.then(res => res.json())
			.then(data => {
				renderComments(data);
			})
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

})();
