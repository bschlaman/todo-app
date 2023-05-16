import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CreateBulkTaskButton,
  CreateSprintButton,
  CreateStoryButton,
  CreateTaskButton,
} from "./modal_buttons";
import ErrorBanner from "../../components/banners";
import {
  getSprints,
  getStories,
  getTagAssignments,
  getTags,
  getTasks,
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
import { TagSelectors } from "./tag_selectors";

// determine if a particular task should be rendered
// based on the currently selected sprint
function renderTaskFilter(
  task: Task,
  storiesById: Map<string, Story>,
  sprintsById: Map<string, Sprint>,
  selectedSprintId: string | undefined,
  assocTagIdsByStoryId: Map<string, string[]>,
  activeTagIds: string[]
) {
  // sprint has not been selected yet
  if (selectedSprintId === undefined) return false;
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
  const selectedSprintRef = useRef<HTMLSelectElement>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagAssignments, setTagAssignments] = useState<TagAssignment[]>([]);
  const [error, setError] = useState(null);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

  // render count for debugging
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log(`[SprintboardPage] render count`, renderCount.current);
  });

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
        renderTaskFilter(
          task,
          storiesById,
          sprintsById,
          selectedSprintRef.current?.value,
          assocTagIdsByStoryId,
          activeTagIds
        )
      ),
    [tasks, storiesById, sprintsById, assocTagIdsByStoryId, activeTagIds]
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

  if (error !== null) return <ErrorBanner message={error} />;

  return (
    <>
      <div>
        <CreateTaskButton></CreateTaskButton>
        <CreateStoryButton></CreateStoryButton>
        <CreateSprintButton></CreateSprintButton>
        <CreateBulkTaskButton></CreateBulkTaskButton>
      </div>
      <select ref={selectedSprintRef}>
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
      <TagSelectors
        tags={tags}
        setActiveTagIds={setActiveTagIds}
      ></TagSelectors>
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
        <Bucket
          status={STATUS.BACKLOG}
          tasks={taskBucketsByStatus.get(STATUS.BACKLOG) ?? []}
          storiesById={storiesById}
        ></Bucket>
        <Bucket
          status={STATUS.DOING}
          tasks={taskBucketsByStatus.get(STATUS.DOING) ?? []}
          storiesById={storiesById}
        ></Bucket>
        <Bucket
          status={STATUS.DONE}
          tasks={taskBucketsByStatus.get(STATUS.DONE) ?? []}
          storiesById={storiesById}
        ></Bucket>
      </div>
    </>
  );
}
