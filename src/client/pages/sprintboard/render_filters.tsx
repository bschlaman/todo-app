// This file contains methods to determine if an entity should be rendered on the sprintboard page
// e.g. based on status, current sprint, etc.

import type { Story, Task } from "../../ts/model/entities";
import { isActive } from "../../ts/model/status";

export function filterTaskForRender(
  task: Task,
  storiesById: Map<string, Story>,
  selectedSprintId: string | null,
  assocTagIdsByStoryId: Map<string, string[]>,
  activeTagIds: string[],
  soloStories: string[],
  muteStories: string[],
) {
  // sprint has not been selected yet
  // (duplicate of check in filterStory, but keeping it just cuz)
  if (selectedSprintId === null) return false;
  // always render if task does not have a story_id
  if (task.story_id === null) return true;
  // if the parent story isn't rendered, don't render the task
  const story = storiesById.get(task.story_id);
  if (story === undefined) return false;
  // don't render task if story is not rendered
  if (!filterStoryForRender(story, selectedSprintId)) return false;

  // soloing + muting
  // -----------------
  // never render muted
  if (muteStories.includes(story.id)) return false;
  // if any stories are soloed, render based on inclusion
  if (soloStories.length > 0) return soloStories.includes(story.id);

  // at this point, there are no solo stories, and we are not muted.  so render based on tags.
  // render when any of Task::Story tag assignments are active
  for (const tagId of assocTagIdsByStoryId.get(task.story_id) ?? []) {
    if (activeTagIds.includes(tagId)) return true;
  }

  return false;
}

export function filterStoryForRender(
  story: Story,
  selectedSprintId: string | null,
) {
  // sprint has not been selected yet
  if (selectedSprintId === null) return false;
  // story doesn't belong to currently selected sprint
  if (selectedSprintId !== story.sprint_id) return false;
  // story status is one which I don't want to render
  return isActive(story);
}
