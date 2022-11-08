// GLOBAL CONSTS

const routes = {
	checkSession: `/api/check_session`,
	simulateLatency: `/api/echodelay?t=2`,

	getConfig: `/api/get_config`,

	getTasks: `/api/get_tasks`,
	createTask: `/api/create_task`,
	updateTask: `/api/put_task`,
	updateStory: `/api/put_story`,
	getStories: `/api/get_stories`,
	getSprints: `/api/get_sprints`,
	createStory: `/api/create_story`,
	createSprint: `/api/create_sprint`,

	getTaskById: `/api/get_task`,
	getCommentsByTaskId: `/api/get_comments_by_task_id`,
	createComment: `/api/create_comment`,
	getStoryById: `/api/get_story`,

	getTags: `/api/get_tags`,
	getTagAssignments: `/api/get_tag_assignments`,
	createTagAssignment: `/api/create_tag_assignment`,
	destroyTagAssignment: `/api/destroy_tag_assignment`,
	createTag: `/api/create_tag`,
};

export const STATUSES = [
	"BACKLOG",
	"DOING",
	"DONE",
	"DEPRIORITIZED",
	"ARCHIVE",
	"DUPLICATE",
	"DEADLINE PASSED",
];

// since tasks may not have a parent story, we need something
// to display as a stand-in in UI elements such as task cards
// and the story selector during task creation.  Note that this
// value is also used as "value" in story selector options as a
// standin for null
export const NULL_STORY_IDENTIFIER = "NONE";

export const hoverClass = "droppable-hover";

// detect when user navigates back to page and check
// if the session is still valid
document.addEventListener("visibilitychange", _ => {
	if (document.visibilityState === "visible")
		checkSession().then(res => res.json()).then(res => {
			console.log(
				"session time remaining (s):",
				res.session_time_remaining_seconds,
			);
		});
});

// API

// I currently want to bail if anything goes wrong
export async function checkSession(): Promise<JSON> {
	try {
		const res = await fetch(routes.checkSession, { method: "GET" });
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function simulateLatency(): Promise<JSON> {
	try {
		const res = await fetch(routes.simulateLatency, { method: "GET" });
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getConfig(): Promise<JSON> {
	try {
		const res = await fetch(routes.getConfig, { method: "GET" });
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getTasks(): Promise<JSON> {
	try {
		const res = await fetch(routes.getTasks, { method: "GET" });
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getStories(): Promise<JSON> {
	try {
		const res = await fetch(routes.getStories, { method: "GET" });
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getSprints(): Promise<JSON> {
	try {
		const res = await fetch(routes.getSprints, { method: "GET" });
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getTags(): Promise<JSON> {
	try {
		const res = await fetch(routes.getTags, { method: "GET" });
		return await handlreApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getTagAssignments(): Promise<JSON> {
	try {
		const res = await fetch(routes.getTagAssignments, { method: "GET" });
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function createTask(title: string, description: string, storyId: string, bulkTask = false): Promise<JSON> {
	if (!title) {
		console.error("task creation failed");
		throw new Error("no task title");
	}
	const res = await fetch(routes.createTask, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title: title,
			description: description,
			story_id: storyId,
			bulk_task: bulkTask,
		}),
	});
	return await handleApiRes(res);
}

export async function createStory(title: string, description: string, sprintId: string): Promise<JSON> {
	if (!title || !description || !sprintId) {
		console.error("story creation failed");
		throw new Error("some story creation input parameters missing");
	}
	const res = await fetch(routes.createStory, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title: title,
			description: description,
			sprint_id: sprintId,
		}),
	});
	return await handleApiRes(res);
}

export async function createSprint(title: string, startdate: Date, enddate: Date): Promise<JSON> {
	if (!title || !startdate || !enddate) {
		console.error("story creation failed");
		throw new Error("some sprint creation parameters missing");
	}
	const res = await fetch(routes.createSprint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title: title,
			start_date: new Date(startdate),
			end_date: new Date(enddate),
		}),
	});
	return handleApiRes(res);
}

export async function createTag(title, description): Promise<JSON> {
	if (!title || !description) {
		console.error("tag creation failed");
		return;
	}
	const res = await fetch(routes.createTag, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title: title,
			description: description,
		}),
	});
	return handleApiRes(res);
}

export async function createTagAssignment(tag_id, story_id): Promise<JSON> {
	if (!tag_id || !story_id) {
		console.error("tag assignment failed");
		return;
	}
	const res = await fetch(routes.createTagAssignment, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			tag_id: tag_id,
			story_id: story_id,
		}),
	});
	return handleApiRes(res);
}

export async function destroyTagAssignment(tag_id, story_id): Promise<JSON> {
	if (!tag_id || !story_id) {
		console.error("tag assignment failed");
		return;
	}
	const res = await fetch(routes.destroyTagAssignment, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			tag_id: tag_id,
			story_id: story_id,
		}),
	});
	return handleApiRes(res);
}

export async function updateTaskById(id, status, title, description, storyId): Promise<JSON> {
	if (!id || !status || !title) {
		console.error("could not update task");
		return;
	}
	try {
		const res = await fetch(routes.updateTask, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: id,
				status: status,
				title: title,
				description: description,
				story_id: storyId,
			}),
		});
		return handleApiRes(res);
	} catch (err) {
		return handleApiErr(err);
	}
}

export async function updateStoryById(id, status, title, description, sprintId): Promise<JSON> {
	if (!id || !status || !title || !description || !sprintId) {
		console.error("could not update story");
		return;
	}
	try {
		const res = await fetch(routes.updateStory, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: id,
				status: status,
				title: title,
				description: description,
				sprint_id: sprintId,
			}),
		});
		return handleApiRes(res);
	} catch (err) {
		return handleApiErr(err);
	}
}

export async function getTaskById(id): Promise<JSON> {
	try {
		const res = await fetch(`${routes.getTaskById}?id=${id}`, { method: "GET" });
		const res_1 = await handleApiRes(res);
		return res_1.json();
	} catch (err) {
		return handleApiErr(err);
	}
}

export async function getCommentsByTaskId(id): Promise<JSON> {
	try {
		const res = await fetch(`${routes.getCommentsByTaskId}?id=${id}`, { method: "GET" });
		const res_1 = await handleApiRes(res);
		return res_1.json();
	} catch (err) {
		return handleApiErr(err);
	}
}

export async function getStoryById(id): Promise<JSON> {
	try {
		const res = await fetch(`${routes.getStoryById}?id=${id}`, { method: "GET" });
		const res_1 = await handleApiRes(res);
		return res_1.json();
	} catch (err) {
		return handleApiErr(err);
	}
}

export async function createComment(taskId, text): Promise<JSON> {
	try {
		const res = await fetch(`${routes.createComment}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text: text,
				task_id: taskId,
			}),
		});
		return handleApiRes(res);
	} catch (err) {
		return handleApiErr(err);
	}
}

// UTIL FUNCTIONS

export function clearInputValues(...inputElements) {
	inputElements.forEach(inputElement => {
		inputElement.value = "";
	});
}

export function formatDate(date) {
	return `${date.toDateString()}`;
}

export function formatDateCompact(date) {
	return `${date.getMonth() + 1}.${date.getUTCDate()}`;
}

export function sprintToString(sprint) {
	return `${sprint.title} (${formatDateCompact(
		new Date(sprint.start_date)
	)} - ${formatDateCompact(new Date(sprint.end_date))})`;
}

export function formatId(id) {
	// expect postgres style id
	if (id.split("-").length != 5)
		console.error("id seems to be wrong format:", id);
	return id.split("-")[0] + "...";
}

// handleApiRes handles the common happy path for API calls.
// right now, that means 1) checking status code and 2) converting res to json
async function handleApiRes(res: Response): Promise<JSON> {
	if (res.ok) return await res.json();
	const msg = `bad res code (${res.status}) from: ${res.url}`;
	throw new Error(msg);
}

// handleApiRes handles the common error path for API calls.
function handleApiErr(err: Error) {
	console.error("(handleApiErr) error occured:", err);
	// TODO (2022.11.07): alert visually in DOM
	alert(err);
	// TODO (2022.11.07): should I rethrow the error?
	// I lean towards no, since I don't necessarily want this
	// function to encasulate flow control behavior
}
