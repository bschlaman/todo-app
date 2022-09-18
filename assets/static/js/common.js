// GLOBAL CONSTS

const routes = {
	simulateLatency:         `/api/echodelay?t=2`,

	getConfig:               `/api/get_config`,

	getTasks:                `/api/get_tasks`,
	createTask:              `/api/create_task`,
	updateTask:              `/api/put_task`,
	updateStory:             `/api/put_story`,
	getStories:              `/api/get_stories`,
	getSprints:              `/api/get_sprints`,
	createStory:             `/api/create_story`,
	createSprint:	           `/api/create_sprint`,

	getTaskById:             `/api/get_task`,
	getCommentsByTaskId:     `/api/get_comments_by_task_id`,
	createComment:           `/api/create_comment`,
	getStoryById:            `/api/get_story`,

	getTags:                 `/api/get_tags`,
	getTagAssignments:       `/api/get_tag_assignments`,
	createTagAssignment:     `/api/create_tag_assignment`,
	destroyTagAssignment:    `/api/destroy_tag_assignment`,
	createTag:               `/api/create_tag`,
};

const STATUSES = ["BACKLOG", "DOING", "DONE", "DEPRIORITIZED", "ARCHIVE", "DUPLICATE"];

const hoverClass = "droppable-hover";

// API

function simulateLatency(...args){
	return fetch(routes.simulateLatency, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getConfig(){
	return fetch(routes.getConfig, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getTasks(){
	return fetch(routes.getTasks, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getStories() {
	return fetch(routes.getStories, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getSprints() {
	return fetch(routes.getSprints, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getTags() {
	return fetch(routes.getTags, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getTagAssignments() {
	return fetch(routes.getTagAssignments, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function createTask(title, description, storyId) {
	if(!title || !description || !storyId){
		console.error("task creation failed");
		return;
	}
	return fetch(routes.createTask, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			title:       title,
			description: description,
			story_id:    storyId,
		}),
	})
	.then(handleApiRes);
}

function createStory(title, description, sprintId) {
	if(!title || !description || !sprintId){
		console.error("story creation failed");
		return;
	}
	return fetch(routes.createStory, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			title:       title,
			description: description,
			sprint_id:   sprintId,
		}),
	})
	.then(handleApiRes);
}

function createSprint(title, startdate, enddate) {
	if(!title || !startdate || !enddate){
		console.error("story creation failed");
		return;
	}
	return fetch(routes.createSprint, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			title:      title,
			start_date: new Date(startdate),
			end_date:   new Date(enddate),
		}),
	})
	.then(handleApiRes);
}

function createTag(title, description) {
	if(!title || !description){
		console.error("tag creation failed");
		return;
	}
	return fetch(routes.createTag, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			title:       title,
			description: description,
		}),
	})
	.then(handleApiRes);
}

function createTagAssignment(tag_id, story_id) {
	if(!tag_id || !story_id){
		console.error("tag assignment failed");
		return;
	}
	return fetch(routes.createTagAssignment, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			tag_id:   tag_id,
			story_id: story_id,
		}),
	})
	.then(handleApiRes);
}

function destroyTagAssignment(tag_id, story_id) {
	if(!tag_id || !story_id){
		console.error("tag assignment failed");
		return;
	}
	return fetch(routes.destroyTagAssignment, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			tag_id:   tag_id,
			story_id: story_id,
		}),
	})
	.then(handleApiRes);
}

function updateTaskById(id, status, title, description, storyId) {
	if(!id || !status || !title || !description || !storyId){
		console.error("could not update task");
		return;
	}
	return fetch(routes.updateTask, {
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
	.then(handleApiRes)
	.catch(handleApiErr);
}

function updateStoryById(id, status, title, description, sprintId) {
	if(!id || !status || !title || !description || !sprintId){
		console.error("could not update story");
		return;
	}
	return fetch(routes.updateStory, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id:           id,
			status:       status,
			title:        title,
			description:  description,
			sprint_id:    sprintId,
		}),
	})
	.then(handleApiRes)
	.catch(handleApiErr);
}

function getTaskById(id){
	return fetch(`${routes.getTaskById}?id=${id}`, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getCommentsByTaskId(id){
	return fetch(`${routes.getCommentsByTaskId}?id=${id}`, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function getStoryById(id) {
	return fetch(`${routes.getStoryById}?id=${id}`, { method: "GET" })
		.then(handleApiRes)
		.then(res => res.json())
		.catch(handleApiErr);
}

function createComment(taskId, text){
	return fetch(`${routes.createComment}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			text:    text,
			task_id: taskId,
		})})
	.then(handleApiRes)
	.catch(handleApiErr);
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

function formatDateCompact(date){
	return `${date.getMonth() + 1}.${date.getUTCDate()}`;
}

function sprintToString(sprint){
	return `${sprint.title} (${
		formatDateCompact(new Date(sprint.start_date))
	} - ${
		formatDateCompact(new Date(sprint.end_date))
	})`
}

function formatId(id){
	// expect postgres style id
	if(id.split("-").length != 5) console.error("id seems to be wrong format:", id);
	return id.split("-")[0] + "...";
}

// only accept 200 response
function handleApiRes(res) {
	// TODO: should I throw an error here?
	// maybe not, as then it would be caught by a .catch
	if(res.ok) return res;
	alert(`${res.url}: ${res.status}`);
	return null;
}

// catch actual networking errors
function handleApiErr(err) {
	console.error("(handleApiErr) error occured:", err);
	alert(err);
}
