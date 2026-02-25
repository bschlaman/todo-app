// utility function intended to standardize error handling among
// api calls which occur upon page load

export interface TimedApiResult {
  apiIdentifier: string;
  succeeded: boolean;
  duration: number;
}

// introducing type R and casting (await apiFunc()) as R
// is just to make the typing happy and allow for
// state which can be null, like `task` on TaskPage
export async function makeTimedPageLoadApiCall<T, R extends T | null>(
  apiFunc: () => Promise<T>,
  setErrors: React.Dispatch<React.SetStateAction<Error[]>>,
  successAction: React.Dispatch<React.SetStateAction<R>>,
  apiIdentifier: string,
): Promise<TimedApiResult> {
  const startTime = performance.now();

  try {
    successAction((await apiFunc()) as R);

    return {
      apiIdentifier,
      succeeded: true,
      duration: performance.now() - startTime,
    };
  } catch (e) {
    if (e instanceof Error) setErrors((errors) => [...errors, e]);

    return {
      apiIdentifier,
      succeeded: false,
      duration: performance.now() - startTime,
    };
  }
}

// TODO (2026.02.25): this is a temporary solution and is kinda redundant to <ErrorBanner>
// The toast pattern could work long term, using useSyncExternalStore with a buffer of errors; see `handleApiErr`.
export function showToast(message: string) {
  const toast = document.createElement("div");
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "1.5rem",
    right: "1.5rem",
    background: "#dc2626",
    color: "white",
    padding: "0.75rem 1.25rem",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    maxWidth: "24rem",
    zIndex: "9999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    opacity: "0",
    transition: "opacity 0.3s ease",
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
