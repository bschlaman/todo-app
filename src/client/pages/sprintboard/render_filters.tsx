// This file contains methods to determine if an entity should be rendered on the sprintboard page
// e.g. based on status, current sprint, etc.

import { Story, Task } from "../../ts/model/entities";
import { isActive } from "../../ts/model/status";

export function filterTask(
  task: Task,
  storiesById: Map<string, Story>,
  selectedSprintId: string | null,
  assocTagIdsByStoryId: Map<string, string[]>,
  activeTagIds: string[]
) {
  // sprint has not been selected yet
  // (duplicate of check in filterStory, but keeping it just cuz)
  if (selectedSprintId === null) return false;
  // always render if task does not have a story_id
  if (task.story_id === null) return true;
  // if the parent story isn't rendered, don't render the task
  const story = storiesById.get(task.story_id);
  if (story === undefined) return false;
  if (!filterStory(story, selectedSprintId)) return false;
  // render when any of Task::Story tag assignments are active
  for (const tagId of assocTagIdsByStoryId.get(task.story_id) ?? []) {
    if (activeTagIds.includes(tagId)) return true;
  }

  return false;
}

export function filterStory(story: Story, selectedSprintId: string | null) {
  // sprint has not been selected yet
  if (selectedSprintId === null) return false;
  // story doesn't belong to currently selected sprint
  if (selectedSprintId !== story.sprint_id) return false;
  // story status is one which I don't want to render
  return isActive(story);
}
