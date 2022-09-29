(async function (){
	const path = window.location.pathname;
	const taskIdFromPath = path.substring(path.lastIndexOf("/") + 1);

	let serverConfig;

	await getConfig().then(config => {
		serverConfig = config;
	});

	getTaskById(taskIdFromPath).then(task => { renderTask(task) });
	getCommentsByTaskId(taskIdFromPath).then(comments => { renderCommentsFromJSON(comments) });

	// detect when user navigates back to page and check
	// if the session is still valid
	document.addEventListener("visibilitychange", _ => {
		if(document.visibilityState === "visible")
			checkSession().then(res => {
				console.log("session time remaining (s):", res.session_time_remaining_seconds);
			});
	});

	const taskTitle = document.querySelector(".task-title");
	const taskId = document.querySelector(".task-id");
	const taskCreatedAt = document.querySelector(".task-created-at");
	const taskStatus = document.querySelector(".task-status");
	const taskDesc = document.querySelector(".task-desc");
	const taskDescPreview = document.querySelector(".task-desc-preview");
	const taskStoryTitle = document.querySelector(".task-story-title");
	const taskComments = document.querySelector(".task-comments");
	const taskSave = document.querySelector(".task-save");

	const taskDescPreviewToggle = document.querySelector(".task-desc-preview-toggle");
	const taskDescPreviewLabel = taskDescPreviewToggle.querySelector("label");
	const taskDescCheckBox = taskDescPreviewToggle.querySelector("input");

	const createCommentForm = document.querySelector(".new-comment form");
	const createCommentTextInput = createCommentForm.querySelector("textarea");
	const createCommentButton = createCommentForm.querySelector("button");

	// configure the "preview" checkbox and div
	taskDescCheckBox.checked = true; // checked on page load
	taskDescPreviewLabel.onclick = _ => {
		taskDescCheckBox.click();
	};
	taskDesc.style.display = "none";
	taskDescPreview.style.display = "block";
	taskDescCheckBox.addEventListener("change", _ => {
		taskDescPreview.innerHTML = DOMPurify.sanitize(marked.parse(taskDesc.innerText));
		if(taskDescCheckBox.checked){
			taskDesc.style.display = "none";
			taskDescPreview.style.display = "block";
		} else {
			taskDesc.style.display = "block";
			taskDescPreview.style.display = "none";
		}
	});

	STATUSES.forEach(status => {
		const option = document.createElement("option");
		option.setAttribute("value", status);
		option.textContent = status;
		taskStatus.appendChild(option);
	});

	taskSave.addEventListener("click", async _ => {
		const res = await updateTaskById(
			taskIdFromPath,
			taskStatus.value,
			taskTitle.textContent, // no newlines should be present
			taskDesc.innerText, // possible newlines
			taskStoryTitle.value,
		);
		if(!res) return;
		location.reload();
	});

	createCommentForm.addEventListener("submit", async e => {
		e.preventDefault(); // prevent submit default behavior
		const res = await createComment(taskIdFromPath, createCommentTextInput.value);
		if(!res) return;
		clearInputValues(createCommentTextInput);
		getCommentsByTaskId(taskIdFromPath).then(comments => { renderCommentsFromJSON(comments) });
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
		taskDescPreview.innerHTML = DOMPurify.sanitize(marked.parse(task.description));
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
			commentText.innerHTML = DOMPurify.sanitize(marked.parse(comment.text));

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

})();
