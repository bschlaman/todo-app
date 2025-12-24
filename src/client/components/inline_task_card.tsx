import { useEffect } from "react";
import type { TASK_STATUS } from "../ts/model/entities";
import { handleCopyToClipboardHTTP } from "../ts/lib/utils";
import { useTasksContext } from "../contexts/TasksContext";

export default function InlineTaskCard({ taskId }: { taskId: string }) {
  const { getTaskById, loading, error, fetchTasks } = useTasksContext();

  // Trigger lazy loading of tasks when this component mounts
  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const task = getTaskById(taskId);

  const getStatusColor = (status: TASK_STATUS): string => {
    switch (status) {
      case "DONE":
        return "#28a745";
      case "DOING":
        return "#007bff";
      case "BACKLOG":
        return "#6c757d";
      case "DEPRIORITIZED":
        return "#ffc107";
      case "ARCHIVE":
        return "#17a2b8";
      case "DUPLICATE":
        return "#dc3545";
      case "DEADLINE PASSED":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  if (loading) {
    return (
      <span className="inline-block rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm text-gray-500">
        Loading task {taskId}...
      </span>
    );
  }

  if (error || !task) {
    return (
      <span className="inline-block rounded border border-red-200 bg-red-100 px-2 py-1 text-sm text-red-800">
        Task {taskId} (error: {error || "not found"})
      </span>
    );
  }

  return (
    <span className="group relative mx-0.5 inline-block rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm shadow-sm">
      <a
        href={`/task/${task.id}`}
        className="mr-1.5 font-semibold text-blue-600 hover:text-blue-800"
      >
        {task.title}
      </a>
      <span
        className="mr-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white"
        style={{ backgroundColor: getStatusColor(task.status) }}
      >
        {task.status}
      </span>
      <button
        onClick={() => handleCopyToClipboardHTTP(task.sqid)}
        className="ml-1 inline-block text-xs text-gray-400 opacity-0 transition-opacity duration-200 hover:text-gray-600 group-hover:opacity-100"
        title={`Copy SQID: ${task.sqid}`}
      >
        📋
      </button>
    </span>
  );
}
