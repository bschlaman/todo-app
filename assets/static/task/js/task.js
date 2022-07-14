(function (){
	const path = window.location.pathname;
	const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

	const routes = {
		getTaskById: `/get_task`,
		getCommentsByTaskId: `/get_comments_by_task_id`,
		createComment: `/create_comment`,
	};

	const taskTitle = document.querySelector(".task-title");
	const taskId = document.querySelector(".task-id");
	const taskStatus = document.querySelector(".task-status");
	const taskDesc = document.querySelector(".task-desc");
	const taskComments = document.querySelector(".task-comments");

	const createCommentForm = document.querySelector(".new-comment form");
	createCommentForm.addEventListener("submit", e => {
		e.preventDefault();
		const textInput = document.querySelector(".new-comment form textarea");
		createComment(taskIdFromPath, textInput.value);
		textInput.value = "";
	});

	getTaskById(taskIdFromPath);
	getCommentsByTaskId(taskIdFromPath);

	function renderTask(task){
		taskTitle.innerHTML = task.title;
		taskId.innerHTML = task.id;
		taskStatus.innerHTML = task.status;
		taskDesc.innerHTML = task.description;
	}

	function renderComments(comments){
		if(comments === null) return;
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
		fetch(`${routes.getTaskById}/${id}`, { method: "GET" })
			.then(res => res.json())
			.then(data => {
				renderTask(data);
			})
			.catch(err => {
				// TODO: DRY - create simple err handle func
				console.warn("error occured:", err);
			});
	}

	function getCommentsByTaskId(id){
		fetch(`${routes.getCommentsByTaskId}?id=${id}`, { method: "GET" })
			.then(res => res.json())
			.then(data => {
				renderComments(data);
			})
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

	function createComment(taskId, text){
		fetch(`${routes.createComment}`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				text:    text,
				task_id: taskId,
			})})
			.then(res => {
				res.json();
			})
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

})();
