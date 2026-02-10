import React, { useMemo, useState } from "react";
import { CopyToClipboardButton } from "../../components/copy_to_clipboard_components";
import {
  type Sprint,
  type Story,
  type StoryRelationship,
  type Tag,
  type TagAssignment,
  STORY_RELATIONSHIP,
  type Task,
  STORY_STATUS,
  type Config,
} from "../../ts/model/entities";
import { TagCircleIndicators } from "../../components/tags";
import { sprintToString } from "../../ts/lib/utils";
import {
  createTagAssignment,
  destroyTagAssignment,
  updateStoryById,
} from "../../ts/lib/api";
import { CopyToNewStory } from "./entity_creation";
import ReactMarkdownCustom from "../../components/markdown";
import { statusColorMap } from "../../ts/lib/common";

export default function StoryCard({
  story,
  storiesById,
  sprintsById,
  tasksByStoryId,
  tagsById,
  tagAssignments,
  storyRelationships,
  selected,
  soloStories,
  muteStories,
  onSoloToggle,
  onMuteToggle,
  setTasks,
  setStories,
  setTagAssignments,
  setStoryRelationships,
  config,
}: {
  story: Story;
  storiesById: Map<string, Story>;
  sprintsById: Map<string, Sprint>;
  tasksByStoryId: Map<string, Task[]>;
  tagsById: Map<string, Tag>;
  tagAssignments: TagAssignment[];
  storyRelationships: StoryRelationship[];
  selected: boolean;
  soloStories: string[];
  muteStories: string[];
  onSoloToggle: (storyId: string, checked: boolean) => void;
  onMuteToggle: (storyId: string, checked: boolean) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setTagAssignments: React.Dispatch<React.SetStateAction<TagAssignment[]>>;
  setStoryRelationships: React.Dispatch<
    React.SetStateAction<StoryRelationship[]>
  >;
  config: Config | null;
}) {
  const [selectedSprintId, setSelectedSprintId] = useState(story.sprint_id);
  const storyPageRef = `/story/${story.sqid}`;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);

  const selectedTagIds = useMemo(
    () =>
      tagAssignments
        .filter((ta) => ta.story_id === story.id)
        .map((ta) => ta.tag_id),
    [tagAssignments, story],
  );

  // this function should be a mirror of handleTaskUpdate.
  // consider moving to a util along with updateTaskStatusById
  async function handleStoryUpdate(updatedStory: Story) {
    if (story === null) return;
    if (Object.keys(updatedStory).length !== Object.keys(story).length)
      throw Error("updated story has incorrect number of keys");

    // return early if there is nothing to update
    let diff = false;
    for (const key in story) {
      if (
        story[key as keyof typeof story] ===
        updatedStory[key as keyof typeof updatedStory]
      )
        continue;
      diff = true;
      break;
    }
    if (!diff) return;

    await updateStoryById(
      updatedStory.id,
      updatedStory.status,
      updatedStory.title,
      updatedStory.description,
      updatedStory.sprint_id,
    );
    setStories((stories) =>
      stories.map((s) => (s.id === story.id ? updatedStory : s)),
    );
  }

  function renderStoryRelationshipsTable() {
    let continues;
    let continuedBy;
    for (const storyRelationship of storyRelationships) {
      if (storyRelationship.relation !== STORY_RELATIONSHIP.ContinuedBy)
        continue;
      if (storyRelationship.story_id_b === story.id)
        continues = storiesById.get(storyRelationship.story_id_a);
      if (storyRelationship.story_id_a === story.id)
        continuedBy = storiesById.get(storyRelationship.story_id_b);
    }

    if (!continues && !continuedBy) return null;

    return (
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-3 text-xs font-thin tracking-wide text-blue-700 uppercase dark:text-blue-300">
          Timeline
        </h4>
        {/* Timeline visualization */}
        <div className="relative flex items-center justify-between gap-2">
          {/* Left story (continues from) */}
          <div className="max-w-30 flex-1 text-center">
            {continues ? (
              <div className="space-y-1">
                <div className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {sprintsById.get(continues.sprint_id ?? "")?.title}
                </div>
                <div className="line-clamp-2 text-xs leading-tight font-medium wrap-break-word text-zinc-900 dark:text-zinc-100">
                  {continues.title}
                </div>
              </div>
            ) : (
              <div className="h-8"></div>
            )}
          </div>

          {/* Timeline line and current story */}
          <div className="relative flex min-w-0 flex-2 items-center">
            {/* Left line */}
            <div
              className={`h-0.5 flex-1 ${continues ? "bg-blue-400 dark:bg-blue-500" : "bg-zinc-200 dark:bg-zinc-600"}`}
            ></div>

            {/* Current story indicator */}
            <div className="relative mx-3">
              <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow-sm dark:border-zinc-800 dark:bg-blue-400"></div>
              <div className="absolute top-5 left-1/2 -translate-x-1/2 transform text-xs font-medium whitespace-nowrap text-blue-700 dark:text-blue-300">
                {sprintsById.get(story.sprint_id ?? "")?.title || "Current"}
              </div>
            </div>

            {/* Right line */}
            <div
              className={`h-0.5 flex-1 ${continuedBy ? "bg-blue-400 dark:bg-blue-500" : "bg-zinc-200 dark:bg-zinc-600"}`}
            ></div>
          </div>

          {/* Right story (continued by) */}
          <div className="max-w-30 flex-1 text-center">
            {continuedBy ? (
              <div className="space-y-1">
                <div className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {sprintsById.get(continuedBy.sprint_id ?? "")?.title}
                </div>
                <div className="line-clamp-2 text-xs leading-tight font-medium wrap-break-word text-zinc-900 dark:text-zinc-100">
                  {continuedBy.title}
                </div>
              </div>
            ) : (
              <div className="h-8"></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  async function handleStoryCardTagChange(tagId: string, checked: boolean) {
    // make the API call and then update tagAssignments
    if (checked) {
      const tagAssignment = await createTagAssignment(tagId, story.id);
      setTagAssignments((tagAssignments) => [...tagAssignments, tagAssignment]);
    } else {
      await destroyTagAssignment(tagId, story.id);
      setTagAssignments((tagAssignments) =>
        tagAssignments.filter(
          (ta) => ta.tag_id !== tagId || ta.story_id !== story.id,
        ),
      );
    }
  }

  return (
    <div
      // storyURIFragment
      id={story.id}
      className="relative w-[30%] overflow-hidden rounded-lg border border-zinc-400 bg-zinc-100 p-6 shadow-sm transition-all duration-200 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      style={{
        boxShadow:
          selected || soloStories.includes(story.id)
            ? "0 0 0 2px rgb(239 68 68), 0 4px 6px -1px rgb(0 0 0 / 0.1)"
            : undefined,
        opacity:
          muteStories.includes(story.id) ||
          (soloStories.length > 0 && !soloStories.includes(story.id))
            ? 0.1
            : 1,
      }}
    >
      {/* Header with controls */}
      <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
        <CopyToClipboardButton value={storyPageRef}></CopyToClipboardButton>
        <div className="flex items-center gap-2">
          {/* Solo/Mute controls stacked vertically */}
          <div className="flex flex-col">
            <button
              className={
                "w-5 h-3 text-xs font-bold border border-zinc-400 flex items-center justify-center transition-colors " +
                (soloStories.includes(story.id)
                  ? "bg-yellow-400 text-black border-yellow-600"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600")
              }
              // style={{textDecoration: soloed? "underline": undefined}}
              onClick={() =>
                onSoloToggle(story.id, !soloStories.includes(story.id))
              }
              title="Solo (show only this story when active)"
            >
              s
            </button>
            <button
              className={
                "w-5 h-3 text-xs font-bold border border-zinc-400 border-t-0 flex items-center justify-center transition-colors underline" +
                (muteStories.includes(story.id)
                  ? "bg-red-400 text-white border-red-600"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600")
              }
              onClick={() =>
                onMuteToggle(story.id, !muteStories.includes(story.id))
              }
              title="Mute (hide this story)"
            >
              m
            </button>
          </div>
          <a
            className="transition-transform hover:scale-110"
            href={`/stories/${storyPageRef}`}
            title="Edit"
          >
            📝
          </a>
        </div>
      </div>

      {/* Content area with top padding */}
      <div className="pt-8">
        {/* Title */}
        {isEditingTitle ? (
          <div className="mb-4 flex flex-col gap-3">
            <textarea
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={config?.story_title_max_len}
              placeholder="Story title..."
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-800"
                onClick={() => {
                  setIsEditingTitle(false);
                  void handleStoryUpdate({ ...story, title });
                }}
              >
                Save
              </button>
              <button
                className="rounded-lg bg-zinc-500 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none dark:bg-zinc-600 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-800"
                onClick={() => {
                  setIsEditingTitle(false);
                  setTitle(story.title);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <h3
            className="mb-4 text-lg font-semibold transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h3>
        )}

        {/* Description */}
        {isEditingDescription ? (
          <div className="mb-4 flex flex-col gap-3">
            <textarea
              className="min-h-30 w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-800"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={config?.story_desc_max_len}
              placeholder="Story description (supports Markdown)..."
              rows={6}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-800"
                onClick={() => {
                  setIsEditingDescription(false);
                  void handleStoryUpdate({ ...story, description });
                }}
              >
                Save
              </button>
              <button
                className="rounded-lg bg-zinc-500 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none dark:bg-zinc-600 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-800"
                onClick={() => {
                  setIsEditingDescription(false);
                  setDescription(story.description);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="-m-2 mb-4 rounded-lg p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
            onDoubleClick={() => setIsEditingDescription(true)}
          >
            <ReactMarkdownCustom content={story.description} />
          </div>
        )}

        {/* Tags */}
        <div className="mb-4">
          <TagCircleIndicators
            tagsById={tagsById}
            selectedTagIds={selectedTagIds}
            onTagToggle={(tagId: string, checked: boolean) => {
              void handleStoryCardTagChange(tagId, checked);
            }}
          />
        </div>

        {/* Story Controls Section */}
        <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700">
          <div className="flex items-center justify-between gap-3 align-middle">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Sprint
              </label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                onChange={(e) => {
                  setSelectedSprintId(e.target.value);
                  void (async () => {
                    const updatedStory = {
                      ...story,
                      sprint_id: e.target.value,
                    };
                    await updateStoryById(
                      updatedStory.id,
                      updatedStory.status,
                      updatedStory.title,
                      updatedStory.description,
                      updatedStory.sprint_id,
                    );
                    setStories((stories) =>
                      stories.map((s) =>
                        s.id === story.id ? updatedStory : s,
                      ),
                    );
                  })();
                }}
                value={selectedSprintId}
              >
                {Array.from(sprintsById.values())
                  .sort(
                    (s0, s1) =>
                      new Date(s1.start_date).getTime() -
                      new Date(s0.start_date).getTime(),
                  )
                  .slice(0, 5)
                  .map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprintToString(sprint)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <CopyToNewStory
                continuedStory={story}
                sprints={[...sprintsById.values()]}
                tasksByStoryId={tasksByStoryId}
                tagsById={tagsById}
                tagAssignments={tagAssignments}
                storyRelationships={storyRelationships}
                setTasks={setTasks}
                setStories={setStories}
                setTagAssignments={setTagAssignments}
                setStoryRelationships={setStoryRelationships}
                config={config}
              />
              <button
                className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                onClick={() => {
                  void (async () => {
                    if (!window.confirm("Archive this story?")) return;
                    const updatedStory = {
                      ...story,
                      status: STORY_STATUS.ARCHIVE,
                    };
                    await handleStoryUpdate(updatedStory);
                  })();
                }}
                title="Archive story"
              >
                ⊟
              </button>
            </div>
          </div>
        </div>

        {/* Story Relationships */}
        {renderStoryRelationshipsTable()}

        {/* Tasks Section */}
        <div className="mt-6 text-sm dark:text-zinc-200">
          <p className="flex items-center italic before:mr-2 before:h-px before:flex-[0.2] before:bg-zinc-400 after:ml-2 after:h-px after:flex-1 after:bg-zinc-400 dark:before:bg-zinc-500 dark:after:bg-zinc-500">
            Tasks
          </p>
          <ul className="list-none pl-8 dark:text-zinc-300">
            {tasksByStoryId
              .get(story.id)
              ?.sort((a, b) => a.status.localeCompare(b.status))
              .map((task) => (
                <li key={task.id} className="flex items-start gap-1">
                  <a
                    href={`/task/${task.sqid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-light hover:opacity-70"
                    title={task.status}
                    style={{ color: statusColorMap(task.status) }}
                  >
                    ●
                  </a>
                  <p className="font-light">{task.title}</p>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
