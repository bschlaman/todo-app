import {
  createContext,
  useContext,
  useCallback,
  useRef,
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
  fetchTasks: () => Promise<void>;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track ongoing fetch promise to prevent multiple simultaneous calls
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const fetchTasks = useCallback(async () => {
    // Don't fetch if we already have tasks
    if (tasks.length > 0) return;

    // If a fetch is already in progress, wait for it
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    // Start new fetch
    const fetchPromise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTasks = await getTasks();
        setTasks(fetchedTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
        fetchPromiseRef.current = null; // Clear the promise reference
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [tasks.length]);

  function getTaskById(sqid: string): Task | undefined {
    return tasks.find((task) => task.sqid === sqid);
  }

  const value: TasksContextValue = {
    tasks,
    loading,
    error,
    getTaskById,
    fetchTasks,
  };

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}
