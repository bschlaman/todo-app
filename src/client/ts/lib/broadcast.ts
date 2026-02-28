import { useEffect } from "react";

// All possible broadcast message types
export type BroadcastMessage =
  | { type: "task-mutated"; taskId: string }
  | { type: "comment-mutated"; taskId: string };

// Singleton channel instance
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (channel === null) {
    channel = new BroadcastChannel("todosky");
  }
  return channel;
}

// Broadcast a mutation event to all other tabs
export function broadcast(message: BroadcastMessage): void {
  console.log("[broadcast] sending:", message);
  getChannel().postMessage(message);
}

/**
 * React hook that listens for broadcast messages from other tabs.
 * The callback is called for each message received.
 *
 * @example
 * useBroadcastListener((msg) => {
 *   if (msg.type === "task-mutated") refetchTasks();
 * });
 */
export function useBroadcastListener(
  callback: (message: BroadcastMessage) => void,
) {
  useEffect(() => {
    const ch = getChannel();
    const handler = (event: MessageEvent<BroadcastMessage>) => {
      console.log("[broadcast] received:", event.data);
      callback(event.data);
    };
    ch.addEventListener("message", handler);
    return () => ch.removeEventListener("message", handler);
  }, [callback]);
}
