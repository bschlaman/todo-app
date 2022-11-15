// GLOBAL CONSTS

const routes = {
	checkSession: "/api/check_session",
	simulateLatency: "/api/echodelay?t=2",

	getConfig: "/api/get_config",

	getTasks: "/api/get_tasks",
	createTask: "/api/create_task",
	updateTask: "/api/put_task",
	updateStory: "/api/put_story",
	getStories: "/api/get_stories",
	getSprints: "/api/get_sprints",
	createStory: "/api/create_story",
	createSprint: "/api/create_sprint",

	getTaskById: "/api/get_task",
	getCommentsByTaskId: "/api/get_comments_by_task_id",
	createComment: "/api/create_comment",
	getStoryById: "/api/get_story",

	getTags: "/api/get_tags",
	getTagAssignments: "/api/get_tag_assignments",
	createTagAssignment: "/api/create_tag_assignment",
	destroyTagAssignment: "/api/destroy_tag_assignment",
	createTag: "/api/create_tag",
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
	if (document.visibilityState === "visible") {
		void checkSession().then(res => {
			console.log(
				"session time remaining (s):",
				res.sessionTimeRemainingSeconds
			);
		});
	}
});

// API

// I currently want to bail if anything goes wrong
export async function checkSession(): Promise<CheckSessionRes> {
	try {
		const res = await fetch(routes.checkSession, { method: "GET" });
		return (await handleApiRes(res)) as CheckSessionRes;
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

export async function getConfig(): Promise<Config> {
	try {
		const res = await fetch(routes.getConfig, { method: "GET" });
		return (await handleApiRes(res)) as Config;
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getTasks(): Promise<Task[]> {
	try {
		const res = await fetch(routes.getTasks, { method: "GET" });
		return (await handleApiRes(res)) as Task[];
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getStories(): Promise<Story[]> {
	try {
		const res = await fetch(routes.getStories, { method: "GET" });
		return (await handleApiRes(res)) as Story[];
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getSprints(): Promise<Sprint[]> {
	try {
		const res = await fetch(routes.getSprints, { method: "GET" });
		return (await handleApiRes(res)) as Sprint[];
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getTags(): Promise<Tag[]> {
	try {
		const res = await fetch(routes.getTags, { method: "GET" });
		return (await handleApiRes(res)) as Tag[];
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getTagAssignments(): Promise<TagAssignment> {
	try {
		const res = await fetch(routes.getTagAssignments, { method: "GET" });
		return (await handleApiRes(res)) as TagAssignment;
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function createTask(
	title: string,
	description: string,
	storyId: string,
	bulkTask = false
): Promise<JSON> {
	const res = await fetch(routes.createTask, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title,
			description,
			story_id: storyId,
			bulk_task: bulkTask,
		}),
	});
	return await handleApiRes(res);
}

export async function createStory(
	title: string,
	description: string,
	sprintId: string
): Promise<JSON> {
	const res = await fetch(routes.createStory, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title,
			description,
			sprint_id: sprintId,
		}),
	});
	return await handleApiRes(res);
}

export async function createSprint(
	title: string,
	startdate: Date,
	enddate: Date
): Promise<JSON> {
	const res = await fetch(routes.createSprint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title,
			start_date: new Date(startdate),
			end_date: new Date(enddate),
		}),
	});
	return await handleApiRes(res);
}

export async function createTag(
	title: string,
	description: string
): Promise<JSON> {
	const res = await fetch(routes.createTag, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title,
			description,
		}),
	});
	return await handleApiRes(res);
}

export async function createTagAssignment(
	tagId: string,
	storyId: string
): Promise<JSON> {
	const res = await fetch(routes.createTagAssignment, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			tag_id: tagId,
			story_id: storyId,
		}),
	});
	return await handleApiRes(res);
}

export async function destroyTagAssignment(
	tagId: string,
	storyId: string
): Promise<JSON> {
	const res = await fetch(routes.destroyTagAssignment, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			tag_id: tagId,
			story_id: storyId,
		}),
	});
	return await handleApiRes(res);
}

export async function updateTaskById(
	id: string,
	status: string,
	title: string,
	description: string,
	storyId: string
): Promise<JSON> {
	try {
		const res = await fetch(routes.updateTask, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id,
				status,
				title,
				description,
				story_id: storyId,
			}),
		});
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function updateStoryById(
	id: string,
	status: string,
	title: string,
	description: string,
	sprintId: string
): Promise<JSON> {
	try {
		const res = await fetch(routes.updateStory, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id,
				status,
				title,
				description,
				sprint_id: sprintId,
			}),
		});
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getTaskById(id: string): Promise<Task> {
	try {
		const res = await fetch(`${routes.getTaskById}?id=${id}`, {
			method: "GET",
		});
		return (await handleApiRes(res)) as Task;
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getCommentsByTaskId(id: string): Promise<TaskComment[]> {
	try {
		const res = await fetch(`${routes.getCommentsByTaskId}?id=${id}`, {
			method: "GET",
		});
		return (await handleApiRes(res)) as TaskComment[];
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function getStoryById(id: string): Promise<Story> {
	try {
		const res = await fetch(`${routes.getStoryById}?id=${id}`, {
			method: "GET",
		});
		return (await handleApiRes(res)) as Story;
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

export async function createComment(
	taskId: string,
	text: string
): Promise<JSON> {
	try {
		const res = await fetch(`${routes.createComment}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text,
				task_id: taskId,
			}),
		});
		return await handleApiRes(res);
	} catch (err) {
		if (err instanceof Error) handleApiErr(err);
		throw err;
	}
}

// UTIL FUNCTIONS

export function clearInputValues(...inputElements: HTMLElement[]) {
	inputElements.forEach(inputElement => {
		inputElement.value = "";
	});
}

export function formatDate(date: Date) {
	return date.toDateString();
}

export function formatDateCompact(date: Date) {
	return `${date.getMonth() + 1}.${date.getUTCDate()}`;
}

export function sprintToString(sprint: Sprint) {
	return `${sprint.title} (${formatDateCompact(
		new Date(sprint.start_date)
	)} - ${formatDateCompact(new Date(sprint.end_date))})`;
}

export function formatId(id: string) {
	// expect postgres style id
	if (id.split("-").length !== 5)
		console.error("id seems to be wrong format:", id);
	return String(id.split("-")[0]) + "...";
}

// handleApiRes handles the common happy path for API calls.
// right now, that means 1) checking status code and 2) converting res to json
async function handleApiRes(res: Response) {
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
