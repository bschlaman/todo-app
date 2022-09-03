// GLOBAL CONSTS

const routes = {
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

const STATUSES = ["BACKLOG", "DOING", "DONE", "DEPRIORITIZED", "ARCHIVE"];

const hoverClass = "droppable-hover";

// API

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
		// TODO: DRY - create simple err handle func
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
	})
	.then(handleApiRes);
}

function createStory(title, description, sprintId) {
	if(!title || !description || !sprintId){
		console.error("story creation failed");
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
	})
	.then(handleApiRes);
}

function createSprint(title, startdate, enddate) {
	if(!title || !startdate || !enddate){
		console.error("story creation failed");
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
	})
	.then(handleApiRes);
}

function createTag(title, description) {
	if(!title || !description){
		console.error("tag creation failed");
		return;
	}
	fetch(routes.createTag, {
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
	fetch(routes.createTagAssignment, {
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
	fetch(routes.destroyTagAssignment, {
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
	.then(handleApiRes)
	.catch(handleApiErr);
}

function updateStoryById(id, status, title, description, sprintId) {
	if(!id || !status || !title || !description || !sprintId){
		console.error("could not update story");
		return;
	}
	fetch(routes.updateStory, {
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
	return `${date.getMonth() + 1}.${date.getDate() + 1}`;
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

function handleApiRes(res) {
	if(res.ok) return res;
	alert(`${res.url}: ${res.status}`);
}

function handleApiErr(err) {
	console.error("error occured:", err);
	alert(err);
}
