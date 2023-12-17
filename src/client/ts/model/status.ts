import { STORY_STATUS, Story } from "./entities";

export function isActive(story: Story) {
  return ![STORY_STATUS.ARCHIVE, STORY_STATUS.DUPLICATE].includes(story.status);
}
