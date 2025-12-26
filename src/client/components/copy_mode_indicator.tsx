import { useEffect, useState, useSyncExternalStore } from "react";
import type { Task } from "../ts/model/entities";

enum CopyMode {
  SQID = "sqid",
  PATH = "path",
  TICS = "tics",
}
const COPY_MODE_STORAGE_KEY = "copyMode";

function getCopyMode(): CopyMode {
  const stored = localStorage.getItem(COPY_MODE_STORAGE_KEY);
  return (stored as CopyMode) ?? CopyMode.SQID;
}

// Custom hook to reactively track copy mode changes
// NOTE: I am not sure why we need two listeners
function useCopyMode(): CopyMode {
  return useSyncExternalStore((callback) => {
    const handler = () => callback();
    window.addEventListener("storage", handler);
    // Also listen for custom events for same-page updates
    window.addEventListener("copyModeChanged", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("copyModeChanged", handler);
    };
  }, getCopyMode);
}

export function useTaskCopyValue(task: Task): string {
  const mode = useCopyMode();
  const taskPageRef = `/task/${task.sqid}`;

  switch (mode) {
    case CopyMode.SQID:
      return `task:${task.sqid}`;
    case CopyMode.PATH:
      return taskPageRef;
    case CopyMode.TICS:
      return `\`${taskPageRef}\``;
    default:
      throw Error(`invalid copy mode: ${mode}`);
  }
}

export function CopyModeIndicator() {
  const [copyMode, setCopyMode] = useState<CopyMode>(
    (localStorage.getItem(COPY_MODE_STORAGE_KEY) as CopyMode) ?? CopyMode.SQID,
  );

  // Save copy mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(COPY_MODE_STORAGE_KEY, copyMode);
    // Emit custom event to notify other components
    window.dispatchEvent(new CustomEvent("copyModeChanged"));
  }, [copyMode]);

  return (
    <span
      onClick={() => {
        const modes = Object.values(CopyMode);
        const nextMode = modes[(modes.indexOf(copyMode) + 1) % modes.length];
        if (nextMode !== undefined) setCopyMode(nextMode);
      }}
      className="ml-2 cursor-pointer select-none text-xs text-gray-600 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
      title="Copy mode - click to cycle"
    >
      [{copyMode}]
    </span>
  );
}
