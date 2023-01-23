// WARNING:
// These scripts are horribly inefficient and are meant for one time use
import { createStoryRelationship } from "../lib/api";
import { Sprint, Story, STORY_RELATIONSHIP } from "../model/entities";

function bracketTypeStoriesRelationships(storyDataCache: Map<string, Story>) {
  const templates = [""];
  let relationships: Story[][] = [];
  for (const template of templates) {
    console.log(template);
    const templateRelationships: Story[][] = [];
    for (let i = 11; i >= 0; i--) {
      let storyA: Story | undefined;
      let storyB: Story | undefined;
      storyDataCache.forEach((story, _) => {
        if (story.title.includes("DUPLICATE")) return;
        if (story.title === template.replace("{i}", i.toString()))
          storyB = story;
        if (story.title === template.replace("{i}", (i - 1).toString()))
          storyA = story;
      });
      if (storyA === undefined || storyB === undefined) {
        console.log("story not found for i=" + i.toString());
        continue;
      }
      templateRelationships.push([storyA, storyB]);
    }
    console.table(templateRelationships);
    relationships = relationships.concat(templateRelationships);
  }
  return relationships;
}

function commonStringRelationships(
  storyDataCache: Map<string, Story>,
  sprintDataCache: Map<string, Sprint>
) {
  const templates = [""];
  let relationships: Story[][] = [];
  const sprints = [...sprintDataCache.values()]
    .filter((sprint) => {
      const words = sprint.title.split(" ");
      if (words.length !== 2) return false;
      if (isNaN(parseInt(words[1] ?? ""))) return false;
      return true;
    })
    .sort((sprint0, sprint1) => {
      return (
        new Date(sprint0.created_at).getTime() -
        new Date(sprint1.created_at).getTime()
      );
    });

  for (const template of templates) {
    console.log(template);
    const templateRelationships: Story[][] = [];
    for (let i = 0; i < sprints.length - 1; i++) {
      let storyA: Story | undefined;
      let storyB: Story | undefined;
      storyDataCache.forEach((story, _) => {
        if (!story.title.includes(template)) return;
        if (story.title.includes("DUPLICATE")) return;
        if (story.sprint_id === sprints[i]?.id) storyB = story;
        if (story.sprint_id === sprints[i + 1]?.id) storyA = story;
      });
      if (storyA === undefined || storyB === undefined) {
        console.log("story not found for i=" + i.toString());
        continue;
      }
      templateRelationships.push([storyA, storyB]);
    }
    console.table(templateRelationships);
    relationships = relationships.concat(templateRelationships);
  }
  return relationships;
}

export async function retroCreateStoryRelationships(
  storyDataCache: Map<string, Story>,
  sprintDataCache: Map<string, Sprint>
) {
  const relationships = [
    ...bracketTypeStoriesRelationships(storyDataCache),
    ...commonStringRelationships(storyDataCache, sprintDataCache),
  ];
  for (const [storyA, storyB] of relationships) {
    if (storyA === undefined || storyB === undefined)
      throw new Error("Unexpected");
    console.log("creating rel:", storyA.title, storyB.title);
    await createStoryRelationship(
      storyA.id,
      storyB.id,
      STORY_RELATIONSHIP.ContinuedBy
    );
  }
}
