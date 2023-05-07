import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CreateBulkTaskButton,
  CreateSprintButton,
  CreateStoryButton,
  CreateTaskButton,
} from "./modal_buttons";
import ErrorBanner from "../../components/banners";
import { getSprints, getStories, getTasks } from "../../ts/lib/api";
import { STATUS, Sprint, Story, Task } from "../../ts/model/entities";
import Bucket from "./Bucket";
import { sprintToString } from "../../ts/lib/utils";

export default function SprintboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const selectedSprintRef = useRef<HTMLSelectElement>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [error, setError] = useState(null);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sprintsById = useMemo(() => {
    const _map = new Map<string, Sprint>();
    for (const sprint of sprints) _map.set(sprint.id, sprint);
    return _map;
  }, [sprints]);

  const taskBucketsByStatus = useMemo(() => {
    const _map = new Map<STATUS, Task[]>();
    for (const task of tasks) {
      if (!_map.has(task.status)) _map.set(task.status, []);
      _map.get(task.status)?.push(task);
    }
    return _map;
  }, [tasks]);

  useEffect(() => {
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
    })();
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
      <Bucket
        status={STATUS.BACKLOG}
        tasks={taskBucketsByStatus.get(STATUS.BACKLOG) ?? []}
        storiesById={storiesById}
      ></Bucket>
    </>
  );
}
