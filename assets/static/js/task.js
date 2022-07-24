(async function (){
	const path = window.location.pathname;
	const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

	let serverConfig;

	await getConfig().then(config => {
		serverConfig = config;
	});

	getTaskById(taskIdFromPath).then(task => { renderTask(task) });
	getCommentsByTaskId(taskIdFromPath).then(comments => { renderCommentsFromJSON(comments) });

	const taskTitle = document.querySelector(".task-title");
	const taskId = document.querySelector(".task-id");
	const taskCreatedAt = document.querySelector(".task-created-at");
	const taskStatus = document.querySelector(".task-status");
	const taskDesc = document.querySelector(".task-desc");
	const taskStoryTitle = document.querySelector(".task-story-title");
	const taskComments = document.querySelector(".task-comments");
	const taskSave = document.querySelector(".task-save");

	const createCommentForm = document.querySelector(".new-comment form");
	const createCommentTextInput = createCommentForm.querySelector("textarea");
	const createCommentButton = createCommentForm.querySelector("button");

	STATUSES.forEach(status => {
		const option = document.createElement("option");
		option.setAttribute("value", status);
		option.textContent = status;
		taskStatus.appendChild(option);
	});

	taskSave.addEventListener("click", e => {
		updateTaskById(
			taskIdFromPath,
			taskStatus.value,
			taskTitle.innerHTML,
			taskDesc.innerHTML,
			taskStoryTitle.value,
		);
	});

	createCommentForm.addEventListener("submit", e => {
		e.preventDefault();
		createComment(taskIdFromPath, createCommentTextInput.value);
		setTimeout(_ => {
			clearInputValues(createCommentTextInput);
			getCommentsByTaskId(taskIdFromPath).then(comments => { renderCommentsFromJSON(comments) });
		}, 500);
	});

	createCommentTextInput.addEventListener("keydown", e => {
		if(e.keyCode === 13 && e.ctrlKey){
			e.preventDefault(); // prevent dialog not closing weirdness
			createCommentButton.click();
		}
	});

	createCommentTextInput.setAttribute("maxlength", serverConfig.comment_max_len);

	function renderTask(task){
		document.title = task.title;
		taskTitle.textContent = task.title;
		taskId.textContent = formatId(task.id);
		taskCreatedAt.textContent = formatDate(new Date(task.created_at));
		taskDesc.textContent = task.description;
		taskTitle.setAttribute("maxlength", serverConfig.task_title_max_len);
		taskDesc.setAttribute("maxlength", serverConfig.task_desc_max_len);
		while(taskStoryTitle.firstChild)
			taskStoryTitle.removeChild(taskStoryTitle.firstChild);
		getStories().then(stories => {
			stories.forEach(story => {
				const option = document.createElement("option");
				option.setAttribute("value", story.id);
				option.textContent = story.title;
				taskStoryTitle.appendChild(option);
				if(story.id === task.story_id) option.selected = true;
			});
		});
		for(let i = 0; i < taskStatus.options.length; i++){
			if(taskStatus.options[i].value === task.status){
				taskStatus.options[i].selected = true;
				break;
			}
		}
	}

	function renderCommentsFromJSON(comments){
		if(!comments){
			console.warn("no comments to render");
			return;
		}
		while(taskComments.firstChild) taskComments.removeChild(taskComments.firstChild);
		comments.forEach(comment => {
			const commentWrapper = document.createElement("div");
			commentWrapper.classList.add("comment-wrapper");

			const commentText = document.createElement("p");
			commentText.classList.add("comment-text");
			commentText.textContent = comment.text;

			const commentCreatedAt = document.createElement("p");
			commentCreatedAt.classList.add("comment-created-at");
			commentCreatedAt.textContent = formatDate(new Date(comment.created_at));

			const commentId = document.createElement("p");
			commentId.classList.add("comment-id");
			commentId.textContent = comment.id;

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

	function getStoryById(id) {
		return fetch(`${routes.getStoryById}?id=${id}`, { method: "GET" })
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
