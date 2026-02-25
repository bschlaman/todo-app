import React, { useState, useEffect, useMemo } from "react";
import { type SelectChangeEvent } from "@mui/material";
import ErrorBanner from "../../components/banners";
import {
  getStories,
  getSprints,
  getTags,
  getTagAssignments,
} from "../../ts/lib/api";
import { NULL_STORY_IDENTIFIER } from "../../ts/lib/common";
import {
  formatId,
  formatDate,
  handleCopyToClipboardHTTP,
} from "../../ts/lib/utils";
import {
  type Task,
  type Story,
  type Sprint,
  type Tag,
  type TagAssignment,
  TASK_STATUS,
} from "../../ts/model/entities";
import {
  makeTimedPageLoadApiCall,
  type TimedApiResult,
} from "../../ts/lib/api_utils";
import { StoryDropdown } from "../../components/story_select";

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

  const createdAtDate = useMemo(
    () => new Date(task.created_at),
    [task.created_at],
  );

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
    onClick?: () => void,
  ) {
    const clickable = onClick !== undefined;
    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLParagraphElement>,
    ) => {
      if (onClick === undefined) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    };

    return (
      <div className="flex">
        <p className="mr-4 font-bold dark:text-zinc-200">{label}:</p>
        <p
          title={hover}
          role={clickable ? "button" : undefined}
          tabIndex={clickable ? 0 : undefined}
          className={clickable ? "cursor-pointer" : undefined}
          onClick={onClick}
          onKeyDown={handleKeyDown}
        >
          {value}
        </p>
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
          formatDate(createdAtDate),
          createdAtDate.toString(),
          () => handleCopyToClipboardHTTP(createdAtDate.toString()),
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
