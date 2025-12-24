import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getTasks } from "../ts/lib/api";
import type { Task } from "../ts/model/entities";

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  getTaskById: (id: string) => Task | undefined;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export function useTasksContext(): TasksContextValue {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasksContext must be used within a TasksProvider");
  }
  return context;
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const tasks = await getTasks();
        setTasks(tasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function getTaskById(sqid: string): Task | undefined {
    return tasks.find((task) => task.sqid === sqid);
  }

  const value: TasksContextValue = {
    tasks,
    loading,
    error,
    getTaskById,
  };

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}
