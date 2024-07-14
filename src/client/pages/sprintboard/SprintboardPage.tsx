import React, { useEffect, useMemo, useRef, useState } from "react";
import ErrorBanner from "../../components/banners";
import {
  checkSession,
  getConfig,
  getSprints,
  getStories,
  getStoryRelationships,
  getTagAssignments,
  getTags,
  getTasks,
  updateTaskById,
} from "../../ts/lib/api";
import {
  Config,
  Sprint,
  Story,
  StoryRelationship,
  TASK_STATUS,
  Tag,
  TagAssignment,
  Task,
} from "../../ts/model/entities";
import Bucket from "./Bucket";
import { sprintToString } from "../../ts/lib/utils";
import { TagOption } from "./tag_selectors";
import TaskCard from "./TaskCard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import EntityCreationStation from "./entity_creation";
import StoryCard from "./StoryCard";
import { filterStory, filterTask } from "./render_filters";
import { SessionTimeRemainingIndicator } from "../../components/session";
import {
  TimedApiResult,
  makeTimedPageLoadApiCall,
} from "../../ts/lib/api_utils";
import { CheckSessionRes } from "../../ts/model/responses";

const LOCAL_STORAGE_KEYS = {
  selectedSprintId: "viewing_sprint_id",
  activeTagIds: "active_tag_ids",
};

export default function SprintboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagAssignments, setTagAssignments] = useState<TagAssignment[]>([]);
  const [storyRelationships, setStoryRelationships] = useState<
    StoryRelationship[]
  >([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [errors, setErrors] = useState<Error[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState(
    localStorage.getItem(LOCAL_STORAGE_KEYS.selectedSprintId),
  );
  const [activeTagIds, setActiveTagIds] = useState<string[]>(
    JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.activeTagIds) ?? "[]"),
  );
  const [checkSessionRes, setCheckSessionRes] = useState<CheckSessionRes>({
    session_time_remaining_seconds: 0,
  });
  // React does not know about window.location.hash,
  // so have to store this as state and pass it down to StoryCard
  const [hash, setHash] = useState(window.location.hash);

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.log(`[SprintboardPage] render count`, renderCount.current);
  });

  useEffect(() => {
    const handleHashChange = () => {
      // note that this triggers a whole page re-render, which can be felt
      // as a slight delay before page scroll
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // local storage side effects
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.selectedSprintId,
      selectedSprintId ?? "",
    );
  }, [selectedSprintId]);
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.activeTagIds,
      JSON.stringify(activeTagIds),
    );
  }, [activeTagIds]);

  const tasksById = useMemo(() => {
    const _map = new Map<string, Task>();
    for (const task of tasks) _map.set(task.id, task);
    return _map;
  }, [tasks]);

  const storiesById = useMemo(() => {
    const _map = new Map<string, Story>();
    for (const story of stories) _map.set(story.id, story);
    return _map;
  }, [stories]);

  const sprintsById = useMemo(() => {
    const _map = new Map<string, Sprint>();
    for (const sprint of sprints) _map.set(sprint.id, sprint);
    return _map;
  }, [sprints]);

  const tagsById = useMemo(() => {
    const _map = new Map<string, Tag>();
    for (const tag of tags) _map.set(tag.id, tag);
    return _map;
  }, [tags]);

  const tasksByStoryId = useMemo(() => {
    const _map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!_map.has(task.story_id)) _map.set(task.story_id, []);
      _map.get(task.story_id)?.push(task);
    }
    return _map;
  }, [tasks]);

  const storiesBySprintId = useMemo(() => {
    const _map = new Map<string, Story[]>();
    for (const story of stories) {
      if (!_map.has(story.sprint_id)) _map.set(story.sprint_id, []);
      _map.get(story.sprint_id)?.push(story);
    }
    return _map;
  }, [stories]);

  const assocTagIdsByStoryId = useMemo(() => {
    const _map = new Map<string, string[]>();
    for (const tagAssignment of tagAssignments) {
      if (!_map.has(tagAssignment.story_id))
        _map.set(tagAssignment.story_id, []);
      _map.get(tagAssignment.story_id)?.push(tagAssignment.tag_id);
    }
    return _map;
  }, [tagAssignments]);

  const tasksToRender = useMemo(
    () =>
      tasks.filter((task) =>
        filterTask(
          task,
          storiesById,
          selectedSprintId,
          assocTagIdsByStoryId,
          activeTagIds,
        ),
      ),
    [tasks, storiesById, selectedSprintId, assocTagIdsByStoryId, activeTagIds],
  );

  const taskBucketsByStatus = useMemo(() => {
    const _map = new Map<TASK_STATUS, Task[]>();
    for (const task of tasksToRender) {
      if (!_map.has(task.status)) _map.set(task.status, []);
      _map.get(task.status)?.push(task);
    }
    return _map;
  }, [tasksToRender]);

  useEffect(() => {
    // use unique timers to avoid conflicts on repeated page mount
    const timerId = `api_calls#${Date.now() % 1e3}`;
    console.time(timerId);

    void (async () => {
      await Promise.allSettled([
        makeTimedPageLoadApiCall(getTasks, setErrors, setTasks, "getTasks"),
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
        makeTimedPageLoadApiCall(
          getStoryRelationships,
          setErrors,
          setStoryRelationships,
          "getStoryRelationships",
        ),
        makeTimedPageLoadApiCall(getConfig, setErrors, setConfig, "getConfig"),
        makeTimedPageLoadApiCall(
          checkSession,
          setErrors,
          setCheckSessionRes,
          "checkSession",
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

  function renderTaskCardsForStatus(status: TASK_STATUS) {
    return (taskBucketsByStatus.get(status) ?? []).map((task: Task) => (
      <TaskCard
        key={task.id}
        task={task}
        storiesById={storiesById}
        tagsById={tagsById}
        assocTagIdsByStoryId={assocTagIdsByStoryId}
        moveTask={updateTaskStatusById}
      />
    ));
  }

  // TODO (2024.01.25): consider consolidating with handleStoryUpdate and handleTaskUpdate
  function updateTaskStatusById(taskId: string, status: TASK_STATUS) {
    const task = tasksById.get(taskId);
    if (task === undefined) throw new Error("task not found: " + taskId);
    void updateTaskById(
      task.id,
      status,
      task.title,
      task.description,
      task.story_id,
    );
    setTasks((tasks) =>
      tasks.map((_task) =>
        _task.id === task.id ? { ..._task, status } : _task,
      ),
    );
  }

  if (errors.length > 0) return <ErrorBanner errors={errors} />;

  return (
    <div className="dark:bg-zinc-900">
      {/* Sprintboard Header */}
      <div className="flex items-center justify-around p-4">
        <EntityCreationStation
          // eh, ?? "" could be better...
          // if selectedSprintId is null, look for "", which should return undefined
          stories={storiesBySprintId.get(selectedSprintId ?? "")}
          sprints={sprints}
          tagsById={tagsById}
          selectedSprintId={selectedSprintId}
          sprintsById={sprintsById}
          assocTagIdsByStoryId={assocTagIdsByStoryId}
          config={config}
          setTasks={setTasks}
          setStories={setStories}
          setSprints={setSprints}
          setTags={setTags}
          setTagAssignments={setTagAssignments}
        />
        {/* Entity filtering  */}
        <div className="text-lg">
          {tags.map((tag) => (
            <TagOption
              key={tag.id}
              tag={tag}
              checked={activeTagIds.includes(tag.id)}
              onTagToggle={(tagId: string, checked: boolean) => {
                setActiveTagIds((prev) => {
                  if (checked) return [...prev, tagId];
                  return prev.filter((id) => id !== tagId);
                });
              }}
            />
          ))}
        </div>
        <div>
          {
            // TODO (2023.06.02): make this a function, since it is
            // used in more than one place
          }
          <select
            className="rounded-lg border border-zinc-300 bg-transparent p-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            onChange={(e) => {
              setSelectedSprintId(e.target.value);
            }}
            value={selectedSprintId ?? ""}
          >
            {sprints
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
          {/* All + None anchors */}
          <div className="inline-flex gap-4 p-2">
            <a
              className="text-blue-500"
              href="#"
              onClick={() => {
                setActiveTagIds(tags.map((tag) => tag.id));
              }}
            >
              All
            </a>
            <a
              className="text-blue-500"
              href="#"
              onClick={() => {
                setActiveTagIds([]);
              }}
            >
              None
            </a>
          </div>
          <SessionTimeRemainingIndicator
            sessionTimeRemainingSeconds={
              checkSessionRes.session_time_remaining_seconds
            }
          />
        </div>
      </div>
      <div className="flex gap-4">
        <DndProvider backend={HTML5Backend}>
          <Bucket status={TASK_STATUS.BACKLOG}>
            {renderTaskCardsForStatus(TASK_STATUS.BACKLOG)}
          </Bucket>
          <Bucket status={TASK_STATUS.DOING}>
            {renderTaskCardsForStatus(TASK_STATUS.DOING)}
          </Bucket>
          <Bucket status={TASK_STATUS.DONE}>
            {renderTaskCardsForStatus(TASK_STATUS.DONE)}
          </Bucket>
        </DndProvider>
      </div>
      <div className="mx-4 mt-8 flex flex-wrap gap-4">
        {stories
          .filter((story) => filterStory(story, selectedSprintId))
          .map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              storiesById={storiesById}
              sprintsById={sprintsById}
              tasksByStoryId={tasksByStoryId}
              tagsById={tagsById}
              tagAssignments={tagAssignments}
              storyRelationships={storyRelationships}
              selected={hash === `#${story.id}`}
              setTasks={setTasks}
              setStories={setStories}
              setTagAssignments={setTagAssignments}
              setStoryRelationships={setStoryRelationships}
              config={config}
            />
          ))}
      </div>
    </div>
  );
}
