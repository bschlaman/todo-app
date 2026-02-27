import {
  ListSubheader,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import React from "react";
import { TagBadge } from "./tags";
import type { Sprint, Story, Tag } from "../ts/model/entities";
import { isActive } from "../ts/model/status";
import { NULL_STORY_IDENTIFIER } from "../ts/lib/common";
import { type CSSObject } from "@emotion/react";

export function renderStorySelectMenuItemOldVersion(
  story: Story,
  tagsById: Map<string, Tag>,
  assocTagIdsByStoryId: Map<string, string[]>,
) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: "8rem",
          marginRight: "1rem",
        }}
      >
        {assocTagIdsByStoryId.get(story.id)?.map((tagId) => {
          const tag = tagsById.get(tagId);
          if (tag === undefined) return <></>;
          return <TagBadge key={tagId} tag={tag} />;
        })}
      </div>
      {story.title}
    </>
  );
}

// TODO (2026.02.24): something is wrong with this version;
// it doesn't center properly, and not clear what it improves over renderStorySelectMenuItemOldVersion
export function renderStorySelectMenuItem(
  story: Story,
  tagsById: Map<string, Tag>,
  assocTagIdsByStoryId: Map<string, string[]>,
) {
  return (
    <div className="flex w-full items-start gap-4">
      <div className="flex w-40 shrink-0 flex-wrap gap-1">
        {assocTagIdsByStoryId.get(story.id)?.map((tagId) => {
          const tag = tagsById.get(tagId);
          if (tag === undefined) return <></>;
          return <TagBadge key={tagId} tag={tag} />;
        })}
      </div>
      <div className="min-w-0 flex-1 font-medium">{story.title}</div>
    </div>
  );
}

// TODO (2023.12.17): I think this is still not quite right
// 1) earlier, I extended SelectProps; should I do that again?
// 2) is labelId="parent-story-label" working correctly?
//    I removed it recently and will monitor for a regression
interface StorySelectProps {
  storyId: string;
  setStoryId: React.Dispatch<React.SetStateAction<string>>;
  stories: Story[] | undefined;
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
}

export function StorySelect({
  storyId,
  setStoryId,
  stories,
  tagsById,
  assocTagIdsByStoryId,
}: StorySelectProps) {
  return (
    <Select
      value={storyId}
      onChange={(e) => {
        setStoryId(e.target.value);
      }}
      SelectDisplayProps={{
        style: {
          display: "flex",
          alignItems: "center",
        },
      }}
    >
      <MenuItem style={{ marginLeft: "9rem" }} value={NULL_STORY_IDENTIFIER}>
        <strong>{NULL_STORY_IDENTIFIER}</strong>
      </MenuItem>
      {stories?.map((story) => (
        // MenuItem must be a direct descendant of Select,
        // so I can't make this it's own component
        <MenuItem
          key={story.id}
          value={story.id}
          style={{ borderBottom: "1px solid #ddd" }}
          disabled={!isActive(story)}
        >
          {renderStorySelectMenuItem(story, tagsById, assocTagIdsByStoryId)}
        </MenuItem>
      ))}
    </Select>
  );
}

export function StoryDropdown({
  selectedStoryId,
  stories,
  sprints,
  tagsById,
  assocTagIdsByStoryId,
  handleTaskMetadataChange,
}: {
  selectedStoryId: string | null;
  stories: Story[];
  sprints: Sprint[];
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
  handleTaskMetadataChange: (e: SelectChangeEvent<string | null>) => void;
}) {
  // bucketize the stories by sprint
  const sprintBuckets = new Map<string, Story[]>();
  for (const story of stories) {
    if (!sprintBuckets.has(story.sprint_id))
      sprintBuckets.set(story.sprint_id, []);
    sprintBuckets.get(story.sprint_id)?.push(story);
  }

  const sprintsToRender: Sprint[] = [];

  // only render 3 additional sprints after the task is found
  // to de-clutter the UI
  let taskSprintFound = false;
  let sprintsBeforeTask = 3;

  sprints
    .sort((sprint0, sprint1) =>
      sprint1.start_date.localeCompare(sprint0.start_date),
    )
    .forEach((sprint) => {
      if (sprintsBeforeTask === 0) return;
      if (taskSprintFound) sprintsBeforeTask--;
      sprintBuckets.get(sprint.id)?.forEach((story) => {
        if (story.id === selectedStoryId) taskSprintFound = true;
      });
      sprintsToRender.push(sprint);
    });

  // If I don't perform this array length check,
  // might try and render the select with a value which is not
  // available yet
  // TODO (2025.12.12) this theme thing is basically totally broken
  return stories.length > 0 && sprints.length > 0 ? (
    <Select
      name="story_id"
      value={selectedStoryId}
      onChange={handleTaskMetadataChange}
      SelectDisplayProps={{
        style: {
          display: "flex",
          alignItems: "center",
        },
      }}
      // https://mui.com/system/getting-started/the-sx-prop/
      // maybe I can remove the `as CSSObject` someday
      sx={[
        (theme) => theme.applyStyles("dark", { color: "white" }) as CSSObject,
      ]}
    >
      <ListSubheader
        key={NULL_STORY_IDENTIFIER}
        sx={[
          (theme) => ({
            fontSize: "1.5rem",
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }),
          (theme) =>
            theme.applyStyles("dark", {
              backgroundColor: "#374151",
              color: "white",
            }) as CSSObject,
        ]}
      >
        {NULL_STORY_IDENTIFIER}
      </ListSubheader>
      <MenuItem
        value={NULL_STORY_IDENTIFIER}
        sx={[
          (theme) => ({
            marginLeft: "9rem",
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }),
          (theme) =>
            theme.applyStyles("dark", {
              borderBottom: "1px solid #4B5563",
              backgroundColor: "#374151",
              color: "white",
            }) as CSSObject,
        ]}
      >
        <strong>{NULL_STORY_IDENTIFIER}</strong>
      </MenuItem>
      {sprintsToRender.map((sprint) => {
        // Explicitly checking undefined to make typescript happy
        const stories = sprintBuckets.get(sprint.id);
        if (stories === undefined) return [];

        return [
          <ListSubheader
            key={sprint.id}
            sx={[
              (theme) => ({
                fontSize: "1.5rem",
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
              }),
              (theme) =>
                theme.applyStyles("dark", {
                  backgroundColor: "#374151",
                  color: "white",
                }) as CSSObject,
            ]}
          >
            {sprint.title}
          </ListSubheader>,
          ...stories.map((story) => (
            <MenuItem
              key={story.id}
              value={story.id}
              disabled={!isActive(story)}
              sx={[
                (theme) => ({
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  "&.Mui-disabled": {
                    color: theme.palette.text.disabled,
                  },
                }),
                (theme) =>
                  theme.applyStyles("dark", {
                    borderBottom: "1px solid #4B5563",
                    backgroundColor: "#374151",
                    color: "white",
                    "&.Mui-disabled": {
                      color: "#9CA3AF",
                    },
                  }) as CSSObject,
              ]}
            >
              {renderStorySelectMenuItemOldVersion(
                story,
                tagsById,
                assocTagIdsByStoryId,
              )}
            </MenuItem>
          )),
        ];
      })}
    </Select>
  ) : null;
}
