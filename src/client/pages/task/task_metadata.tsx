import React, { useState, useEffect, useMemo } from "react";
import {
  type SelectChangeEvent,
  Select,
  MenuItem,
  ListSubheader,
} from "@mui/material";
import ErrorBanner from "../../components/banners";
import { renderStorySelectMenuItem } from "../../components/story_select";
import {
  getStories,
  getSprints,
  getTags,
  getTagAssignments,
} from "../../ts/lib/api";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";
import { formatId, formatDate } from "../../ts/lib/utils";
import {
  type Task,
  type Story,
  type Sprint,
  type Tag,
  type TagAssignment,
  TASK_STATUS,
} from "../../ts/model/entities";
import { isActive } from "../../ts/model/status";
import {
  makeTimedPageLoadApiCall,
  type TimedApiResult,
} from "../../ts/lib/api_utils";
import type { CSSObject } from "@emotion/react";

export default function TaskMetadata({
  task,
  onTaskUpdate,
}: {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => Promise<void>;
}) {
  const [stories, setStories] = useState<Story[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagAssignments, setTagAssignments] = useState<TagAssignment[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);

  useEffect(() => {
    // use unique timers to avoid conflicts on repeated page mount
    const timerId = `api_calls#${Date.now() % 1e3}`;
    console.time(timerId);

    void (async () => {
      await Promise.allSettled([
        makeTimedPageLoadApiCall(
          getStories,
          setErrors,
          setStories,
          "getStories",
        ),
        makeTimedPageLoadApiCall(
          getSprints,
          setErrors,
          setSprints,
          "getSprints",
        ),
        makeTimedPageLoadApiCall(getTags, setErrors, setTags, "getTags"),
        makeTimedPageLoadApiCall(
          getTagAssignments,
          setErrors,
          setTagAssignments,
          "getTagAssignments",
        ),
      ]).then((results) => {
        console.table(
          results
            .map((res) => (res as PromiseFulfilledResult<TimedApiResult>).value)
            .map(({ apiIdentifier, succeeded, duration }) => ({
              apiIdentifier,
              succeeded,
              duration,
            })),
        );
        console.timeEnd(timerId);
      });
    })();
  }, []);

  const tagsById = useMemo(() => {
    const _map = new Map<string, Tag>();
    for (const tag of tags) _map.set(tag.id, tag);
    return _map;
  }, [tags]);

  const assocTagIdsByStoryId = useMemo(() => {
    const _map = new Map<string, string[]>();
    for (const tagAssignment of tagAssignments) {
      if (!_map.has(tagAssignment.story_id))
        _map.set(tagAssignment.story_id, []);
      _map.get(tagAssignment.story_id)?.push(tagAssignment.tag_id);
    }
    return _map;
  }, [tagAssignments]);

  function handleTaskMetadataChange(
    event: React.ChangeEvent<HTMLSelectElement> | SelectChangeEvent<string>,
  ) {
    const { name, value } = event.target;
    const updatedTask = {
      ...task,
      // clunky way to check if I've selected null story
      [name]: value === NULL_STORY_IDENTIFIER ? null : value,
    };
    console.log(updatedTask, name, value);
    void onTaskUpdate(updatedTask);
  }

  function renderTaskMetadataPair(
    label: string,
    value: string,
    hover?: string,
  ) {
    return (
      <div className="flex">
        <p className="mr-4 font-bold dark:text-zinc-200">{label}:</p>
        <p title={hover}>{value}</p>
      </div>
    );
  }

  function renderStatusDropdown(taskStatus: string) {
    return (
      <select
        className="rounded-lg border border-zinc-300 bg-transparent p-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        name="status"
        value={taskStatus}
        onChange={handleTaskMetadataChange}
      >
        {Object.values(TASK_STATUS).map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    );
  }

  if (errors.length > 0) return <ErrorBanner errors={errors} />;

  // TODO (2023.05.06): this is a weaker part of the UI, could use a redesign
  // Idea: make a task metadata component, where the value could be any
  // other component (e.g. <p> or <select>)
  return (
    <>
      <div className="mt-4 flex gap-4">
        {renderTaskMetadataPair("Id", formatId(task.id), task.id)}
        {renderTaskMetadataPair("sqid", task.sqid)}
        {renderTaskMetadataPair(
          "Created",
          formatDate(new Date(task.created_at)),
        )}
        <p className="mr-4 font-bold dark:text-zinc-200">Status:</p>
        {renderStatusDropdown(task.status)}
      </div>
      <div className="mt-4 flex items-center">
        <p className="mr-4 font-bold dark:text-zinc-200">Parent story:</p>
        <StoryDropdown
          taskStoryId={task.story_id}
          stories={stories}
          sprints={sprints}
          tagsById={tagsById}
          assocTagIdsByStoryId={assocTagIdsByStoryId}
          handleTaskMetadataChange={handleTaskMetadataChange}
        />
      </div>
    </>
  );
}

function StoryDropdown({
  taskStoryId,
  stories,
  sprints,
  tagsById,
  assocTagIdsByStoryId,
  handleTaskMetadataChange,
}: {
  taskStoryId: string;
  stories: Story[];
  sprints: Sprint[];
  tagsById: Map<string, Tag>;
  assocTagIdsByStoryId: Map<string, string[]>;
  handleTaskMetadataChange: (e: SelectChangeEvent<string>) => void;
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
    .sort(
      (sprint0, sprint1) =>
        new Date(sprint1.start_date).getTime() -
        new Date(sprint0.start_date).getTime(),
    )
    .forEach((sprint) => {
      if (sprintsBeforeTask === 0) return;
      if (taskSprintFound) sprintsBeforeTask--;
      sprintBuckets.get(sprint.id)?.forEach((story) => {
        if (story.id === taskStoryId) taskSprintFound = true;
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
      value={taskStoryId}
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
              {renderStorySelectMenuItem(story, tagsById, assocTagIdsByStoryId)}
            </MenuItem>
          )),
        ];
      })}
    </Select>
  ) : null;
}
