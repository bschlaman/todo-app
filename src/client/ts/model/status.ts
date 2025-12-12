import { STORY_STATUS, type Story } from "./entities";

export function isActive(story: Story) {
  return ![STORY_STATUS.ARCHIVE, STORY_STATUS.DUPLICATE].includes(story.status);
}
