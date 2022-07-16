// GLOBAL CONSTS

const routes = {
	getTasks: `/get_tasks`,
	createTask: `/create_task`,
	updateTask: `/put_task`,
	getStories: `/get_stories`,
	getSprints: `/get_sprints`,
	createStory: `/create_story`,
	createSprint: `/create_sprint`,

	getTaskById: `/get_task`,
	getCommentsByTaskId: `/get_comments_by_task_id`,
	createComment: `/create_comment`,
	updateTask: `/put_task`,
	getStoryById: `/get_story`,
};

const STATUSES = ["BACKLOG", "DOING", "DONE", "DEPRIORITIZED", "ARCHIVE"];

const hoverClass = "droppable-hover";

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
