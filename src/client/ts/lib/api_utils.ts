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
  apiIdentifier: string
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
    if (e instanceof Error) setErrors((errors) => ({ ...errors, e }));

    return {
      apiIdentifier,
      succeeded: false,
      duration: performance.now() - startTime,
    };
  }
}
