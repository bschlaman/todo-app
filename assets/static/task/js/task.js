(function (){
	// GLOBALS
	const path = window.location.pathname;
	const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

	const routes = {
		getTaskById: `/get_task`,
		getCommentsByTaskId: `/get_comments_by_task_id`,
		createComment: `/create_comment`,
		updateTask: `/put_task`,
	};

	const STATUSES = ["BACKLOG", "DOING", "DONE", "DEPRIORITIZED", "ARCHIVE"];
	// ENDGLOBALS

	getTaskById(taskIdFromPath).then(task => { renderTask(task) });
	getCommentsByTaskId(taskIdFromPath).then(comments => { renderCommentsFromJSON(comments) });

	const taskTitle = document.querySelector(".task-title");
	const taskId = document.querySelector(".task-id");
	const taskStatus = document.querySelector(".task-status");
	const taskDesc = document.querySelector(".task-desc");
	// TODO: inner join here (see todo.js TODO)
	const taskStoryId = document.querySelector(".task-story-id");
	const taskComments = document.querySelector(".task-comments");
	const taskSave = document.querySelector(".task-save");

	const createCommentForm = document.querySelector(".new-comment form");
	const createCommentTextInput = createCommentForm.querySelector("textarea");
	const createCommentButton = createCommentForm.querySelector("button");

	STATUSES.forEach(status => {
		const option = document.createElement("option");
		option.setAttribute("value", status);
		option.innerHTML = status;
		taskStatus.appendChild(option);
	});

	taskSave.addEventListener("click", e => {
		updateTaskById(
			taskIdFromPath,
			taskStatus.value,
			taskTitle.innerHTML,
			taskDesc.innerHTML,
			taskStoryId.innerHTML,
		);
	});

	createCommentForm.addEventListener("submit", e => {
		e.preventDefault();
		createComment(taskIdFromPath, createCommentTextInput.value);
		setTimeout(_ => {
			// TODO: remember to use clearInputValues once I combine js files
			createCommentTextInput.value = "";
			getCommentsByTaskId(taskIdFromPath).then(comments => { renderCommentsFromJSON(comments) });
		}, 500);
	});

	createCommentTextInput.addEventListener("keydown", e => {
		if(e.keyCode === 13 && e.ctrlKey){
			e.preventDefault(); // prevent dialog not closing weirdness
			createCommentButton.click();
		}
	});

	function renderTask(task){
		taskTitle.innerHTML = task.title;
		taskId.innerHTML = task.id;
		taskDesc.innerHTML = task.description;
		taskStoryId.innerHTML = task.story_id;
		for(let i = 0; i < taskStatus.options.length; i++){
			if(taskStatus.options[i].value === task.status){
				taskStatus.options[i].selected = true;
				break;
			}
		}
	}

	function renderCommentsFromJSON(comments){
		if(!comments){
			console.warn("no comments to render!");
		}
		while(taskComments.firstChild) taskComments.removeChild(taskComments.firstChild);
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

	// API FUNCTIONS

	function getTaskById(id){
		return fetch(`${routes.getTaskById}?id=${id}`, { method: "GET" })
			.then(res => res.json())
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

	function getCommentsByTaskId(id){
		return fetch(`${routes.getCommentsByTaskId}?id=${id}`, { method: "GET" })
			.then(res => res.json())
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
			.catch(err => {
				console.warn("error occured:", err);
			});
	}

	// TODO: DRY!!! this func is copied from todo.js
	function updateTaskById(id, status, title, description, storyId) {
		if(!id || !status || !title || !description || !storyId){
			console.warn("could not update task");
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
				story_id:    storyId,
			}),
		})
		.then(res => { location.reload() }) // specific to task.js
		.catch(err => {
			console.warn("error occured:", err);
		});
	}

})();
