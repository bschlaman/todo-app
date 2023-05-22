import React, { useEffect, useMemo, useRef, useState } from "react";
import ErrorBanner from "../../components/banners";
import {
  getSprints,
  getStories,
  getTagAssignments,
  getTags,
  getTasks,
  updateTaskById,
} from "../../ts/lib/api";
import {
  STATUS,
  Sprint,
  Story,
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

const LOCAL_STORAGE_KEYS = {
  selectedSprintId: "viewing_sprint_id",
  activeTagIds: "active_tag_ids",
};

// determine if a particular task should be rendered
// based on the currently selected sprint
function filterTasks(
  task: Task,
  storiesById: Map<string, Story>,
  sprintsById: Map<string, Sprint>,
  selectedSprintId: string | null,
  assocTagIdsByStoryId: Map<string, string[]>,
  activeTagIds: string[]
) {
  // sprint has not been selected yet
  if (selectedSprintId === null) return false;
  const sprint = storiesById.get(task.story_id)?.sprint_id;
  // Task::Story has not loaded yet
  if (sprint === undefined) return false;
  // Task::Story::Sprint is not selected
  if (sprintsById.get(sprint)?.id !== selectedSprintId) return false;
  // return true when any of Task::Story tag assignments are active
  for (const tagId of assocTagIdsByStoryId.get(task.story_id) ?? []) {
    if (activeTagIds.includes(tagId)) return true;
  }
  // if none are active, return false
  return false;
}

export default function SprintboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState(
    localStorage.getItem(LOCAL_STORAGE_KEYS.selectedSprintId)
  );
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagAssignments, setTagAssignments] = useState<TagAssignment[]>([]);
  const [error, setError] = useState(null);
  const [activeTagIds, setActiveTagIds] = useState<string[]>(
    JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.activeTagIds) ?? "[]")
  );

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log(`[SprintboardPage] render count`, renderCount.current);
  });

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
        filterTasks(
          task,
          storiesById,
          sprintsById,
          selectedSprintId,
          assocTagIdsByStoryId,
          activeTagIds
        )
      ),
    [
      tasks,
      storiesById,
      sprintsById,
      selectedSprintId,
      assocTagIdsByStoryId,
      activeTagIds,
    ]
  );

  const taskBucketsByStatus = useMemo(() => {
    const _map = new Map<STATUS, Task[]>();
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
    })().then(() => {
      console.timeEnd("api_calls");
    });
  }, []);

  function renderTaskCardsForStatus(status: STATUS) {
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

  function updateTaskStatusById(taskId: string, status: STATUS) {
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
      <EntityCreationStation
        // eh, ?? "" could be better...
        // if selectedSprintId is null, look for "", which should return undefined
        stories={storiesBySprintId.get(selectedSprintId ?? "")}
      />
      <select
        onChange={(e) => {
          setSelectedSprintId(e.target.value);
        }}
      >
        {sprints
          .sort(
            (s0, s1) =>
              new Date(s1.start_date).getTime() -
              new Date(s0.start_date).getTime()
          )
          .slice(0, 5)
          .map((sprint) => {
            return (
              <option key={sprint.id} value={sprint.id}>
                {sprintToString(sprint)}
              </option>
            );
          })}
      </select>
      <div style={{ width: "20rem", fontSize: "1.3rem" }}>
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
          ></TagOption>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
        <DndProvider backend={HTML5Backend}>
          <Bucket status={STATUS.BACKLOG}>
            {renderTaskCardsForStatus(STATUS.BACKLOG)}
          </Bucket>
          <Bucket status={STATUS.DOING}>
            {renderTaskCardsForStatus(STATUS.DOING)}
          </Bucket>
          <Bucket status={STATUS.DONE}>
            {renderTaskCardsForStatus(STATUS.DONE)}
          </Bucket>
        </DndProvider>
      </div>
    </>
  );
}
