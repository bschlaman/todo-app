// GLOBAL CONSTS

import {
  Task,
  Story,
  Sprint,
  Tag,
  TagAssignment,
  TaskComment,
  Config,
  StoryRelationship,
} from "../model/entities";
import { CheckSessionRes, CreateStoryRes } from "../model/responses";

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
  createTag: "/api/create_tag",
  getTagAssignments: "/api/get_tag_assignments",
  createTagAssignment: "/api/create_tag_assignment",
  destroyTagAssignment: "/api/destroy_tag_assignment",

  getStoryRelationships: "/api/get_story_relationships",
  createStoryRelationship: "/api/create_story_relationship",
  destroyStoryRelationshipById: "/api/destroy_story_relationship_by_id",
};

let ERROR_MESSAGE_PARENT_DIV: HTMLDivElement | undefined;
export function setErrorMessageParentDiv(div: HTMLDivElement) {
  ERROR_MESSAGE_PARENT_DIV = div;
}

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

export async function getTagAssignments(): Promise<TagAssignment[]> {
  try {
    const res = await fetch(routes.getTagAssignments, { method: "GET" });
    return (await handleApiRes(res)) as TagAssignment[];
  } catch (err) {
    if (err instanceof Error) handleApiErr(err);
    throw err;
  }
}

export async function createTask(
  title: string,
  description: string,
  storyId: string | null,
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
): Promise<CreateStoryRes> {
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
      start_date: startdate,
      end_date: enddate,
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
  storyId: string | null
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

export async function createStoryRelationship(
  storyIdA: string,
  storyIdB: string,
  relation: string
): Promise<JSON> {
  const res = await fetch(routes.createStoryRelationship, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      story_id_a: storyIdA,
      story_id_b: storyIdB,
      relation,
    }),
  });
  return await handleApiRes(res);
}

export async function destroyStoryRelationshipById(id: string): Promise<JSON> {
  const res = await fetch(routes.destroyStoryRelationshipById, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
    }),
  });
  return await handleApiRes(res);
}

export async function getStoryRelationships(): Promise<StoryRelationship[]> {
  try {
    const res = await fetch(routes.getStoryRelationships, { method: "GET" });
    return (await handleApiRes(res)) as StoryRelationship[];
  } catch (err) {
    if (err instanceof Error) handleApiErr(err);
    throw err;
  }
}

// API response handling

// handleApiRes handles the common happy path for API calls.
// right now, that means 1) checking status code and 2) converting res to json
async function handleApiRes(res: Response) {
  if (!res.ok) {
    const msg = `bad res code (${res.status}) from: ${res.url}`;
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch (err) {
    console.warn("response was not json:", new URL(res.url).pathname);
  }
}

// handleApiRes handles the common error path for API calls.
function handleApiErr(err: Error) {
  console.error("(handleApiErr) error occured:", err);
  if (ERROR_MESSAGE_PARENT_DIV instanceof HTMLDivElement) {
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("error-message");
    errorDiv.textContent = err.message;
    ERROR_MESSAGE_PARENT_DIV.appendChild(errorDiv);
  } else {
    alert(err);
  }
}
