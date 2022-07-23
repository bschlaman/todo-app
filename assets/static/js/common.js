// GLOBAL CONSTS

const routes = {
	getConfig:           `/api/get_config`,

	getTasks:            `/api/get_tasks`,
	createTask:          `/api/create_task`,
	updateTask:          `/api/put_task`,
	getStories:          `/api/get_stories`,
	getSprints:          `/api/get_sprints`,
	createStory:         `/api/create_story`,
	createSprint:	       `/api/create_sprint`,

	getTaskById:         `/api/get_task`,
	getCommentsByTaskId: `/api/get_comments_by_task_id`,
	createComment:       `/api/create_comment`,
	updateTask:          `/api/put_task`,
	getStoryById:        `/api/get_story`,
};

const STATUSES = ["BACKLOG", "DOING", "DONE", "DEPRIORITIZED", "ARCHIVE"];

const hoverClass = "droppable-hover";

// API

function getConfig(){
	return fetch(routes.getConfig, { method: "GET" })
		.then(res => res.json())
		.catch(err => {
			console.warn("error occured:", err);
		});
}

function getTasks(){
	return fetch(routes.getTasks, { method: "GET" })
		.then(res => res.json())
		// TODO: DRY - create simple err handle func
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
	.catch(err => {
		console.warn("error occured:", err);
	});
}

// UTIL FUNCTIONS

function clearInputValues(...inputElements) {
	inputElements.forEach(inputElement => {
		inputElement.value = "";
	});
}

function formatDate(date){
	return `${date.toDateString()}`;
}

function formatId(id){
	// expect postgres style id
	if(id.split("-").length != 5) console.warn("id seems to be wrong format:", id);
	return id.split("-")[0] + "...";
}
