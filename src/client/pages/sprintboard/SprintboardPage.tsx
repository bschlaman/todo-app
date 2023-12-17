import React, { useEffect, useMemo, useRef, useState } from "react";
import ErrorBanner from "../../components/banners";
import {
  checkSession,
  getSprints,
  getStories,
  getStoryRelationships,
  getTagAssignments,
  getTags,
  getTasks,
  updateTaskById,
} from "../../ts/lib/api";
import {
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
import "../../css/common.css";
import { TagOption } from "./tag_selectors";
import TaskCard from "./TaskCard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import EntityCreationStation from "./entity_creation";
import StoryCard from "./StoryCard";
import { filterStory, filterTask } from "./render_filters";
import { SessionTimeRemainingIndicator } from "../../components/session";

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
  const [error, setError] = useState(null);
  const [selectedSprintId, setSelectedSprintId] = useState(
    localStorage.getItem(LOCAL_STORAGE_KEYS.selectedSprintId)
  );
  const [activeTagIds, setActiveTagIds] = useState<string[]>(
    JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.activeTagIds) ?? "[]")
  );
  const [sessionTimeRemainingSeconds, setSessionTimeRemainingSeconds] =
    useState(0);
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
      selectedSprintId ?? ""
    );
  }, [selectedSprintId]);
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.activeTagIds,
      JSON.stringify(activeTagIds)
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
          activeTagIds
        )
      ),
    [tasks, storiesById, selectedSprintId, assocTagIdsByStoryId, activeTagIds]
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
    console.time("api_calls");
    void (async () => {
      await getTasks()
        .then((tasks) => {
          setTasks(tasks);
        })
        .catch((e) => {
          setError(e.message);
        });
      await getStories()
        .then((stories) => {
          setStories(stories);
        })
        .catch((e) => {
          setError(e.message);
        });
      await getSprints()
        .then((sprints) => {
          setSprints(sprints);
        })
        .catch((e) => {
          setError(e.message);
        });
      await getTags()
        .then((tags) => {
          setTags(tags);
        })
        .catch((e) => {
          setError(e.message);
        });
      await getTagAssignments()
        .then((tagAssignments) => {
          setTagAssignments(tagAssignments);
        })
        .catch((e) => {
          setError(e.message);
        });
      await getStoryRelationships()
        .then((storyRelationships) => {
          setStoryRelationships(storyRelationships);
        })
        .catch((e) => {
          setError(e.message);
        });
      await checkSession()
        .then((res) => {
          setSessionTimeRemainingSeconds(res.session_time_remaining_seconds);
        })
        .catch((e) => {
          setError(e.message);
        });
    })().then(() => {
      console.timeEnd("api_calls");
    });
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

  function updateTaskStatusById(taskId: string, status: TASK_STATUS) {
    const task = tasksById.get(taskId);
    if (task === undefined) throw new Error("task not found: " + taskId);
    void updateTaskById(
      task.id,
      status,
      task.title,
      task.description,
      task.story_id
    );
    setTasks((tasks) =>
      tasks.map((_task) =>
        _task.id === task.id ? { ..._task, status } : _task
      )
    );
  }

  if (error !== null) return <ErrorBanner message={error} />;

  return (
    <>
      {/* Sprintboard Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <EntityCreationStation
          // eh, ?? "" could be better...
          // if selectedSprintId is null, look for "", which should return undefined
          stories={storiesBySprintId.get(selectedSprintId ?? "")}
          sprints={sprints}
          tagsById={tagsById}
          selectedSprintId={selectedSprintId}
          sprintsById={sprintsById}
          assocTagIdsByStoryId={assocTagIdsByStoryId}
          setTasks={setTasks}
          setStories={setStories}
          setSprints={setSprints}
          setTags={setTags}
          setTagAssignments={setTagAssignments}
        />
        {/* Entity filtering  */}
        <div style={{ maxWidth: "50vw", fontSize: "1.3rem" }}>
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
          {
            // TODO (2023.06.02): make this a function, since it is
            // used in more than one place
          }
          <select
            onChange={(e) => {
              setSelectedSprintId(e.target.value);
            }}
            value={selectedSprintId ?? ""}
          >
            {sprints
              .sort(
                (s0, s1) =>
                  new Date(s1.start_date).getTime() -
                  new Date(s0.start_date).getTime()
              )
              .slice(0, 5)
              .map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprintToString(sprint)}
                </option>
              ))}
          </select>
          {/* All + None anchors */}
          <div
            style={{
              display: "inline-flex",
              gap: "1rem",
              margin: "0 1rem 0 1rem",
            }}
          >
            <a
              href="#"
              onClick={() => {
                setActiveTagIds(tags.map((tag) => tag.id));
              }}
            >
              All
            </a>
            <a
              href="#"
              onClick={() => {
                setActiveTagIds([]);
              }}
            >
              None
            </a>
          </div>
          <SessionTimeRemainingIndicator
            sessionTimeRemainingSeconds={sessionTimeRemainingSeconds}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
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
            />
          ))}
      </div>
    </>
  );
}
