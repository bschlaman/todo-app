import { useEffect, useState } from "react";
import { TASK_STATUS } from "../ts/model/entities";
import { handleCopyToClipboardHTTP } from "../ts/lib/utils";
import { useTasksContext } from "../contexts/TasksContext";
import { statusColorMap } from "../ts/lib/common";

export default function InlineTaskCard({ taskId }: { taskId: string }) {
  const { getTaskById, loading, error, fetchTasks } = useTasksContext();
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Trigger lazy loading of tasks when this component mounts
  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const task = getTaskById(taskId);

  // Helper to determine if task should be dimmed - now includes DONE tasks
  const isTaskDimmed = (status: TASK_STATUS): boolean => {
    return ![TASK_STATUS.DOING, TASK_STATUS.BACKLOG].includes(status);
  };

  // Helper to determine if task should have strikethrough
  const isTaskCompleted = (status: TASK_STATUS): boolean => {
    return status === TASK_STATUS.DONE;
  };

  if (loading) {
    return (
      <span className="inline-block whitespace-nowrap rounded-sm border border-gray-300 bg-gray-100 px-2 py-1 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Loading task {taskId}...
      </span>
    );
  }

  if (error || !task) {
    return (
      <span className="inline-block whitespace-nowrap rounded-sm border border-red-200 bg-red-100 px-2 py-1 text-sm text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200">
        Task {taskId} (error: {error || "not found"})
      </span>
    );
  }

  return (
    <span
      className="group relative mx-0.5 inline-block whitespace-nowrap rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm shadow-xs dark:border-gray-600 dark:bg-gray-800"
      style={{
        opacity: isTaskDimmed(task.status) ? 0.5 : 1,
      }}
    >
      <a
        href={`/task/${task.id}`}
        className="mr-1.5 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        style={{
          textDecoration: isTaskCompleted(task.status)
            ? "line-through"
            : "none",
        }}
      >
        {task.title}
      </a>
      <span
        className="mr-1 inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium text-white"
        style={{ backgroundColor: statusColorMap(task.status) }}
      >
        {task.status}
      </span>
      <button
        onClick={async () => {
          await handleCopyToClipboardHTTP(task.sqid);
          setShowCheckmark(true);
          setTimeout(() => setShowCheckmark(false), 2000);
        }}
        className="ml-1 inline-block text-xs text-gray-400 opacity-0 transition-opacity duration-200 hover:text-gray-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-gray-400"
        title={`Copy SQID: ${task.sqid}`}
      >
        {showCheckmark ? "✓" : "📋"}
      </button>
    </span>
  );
}
