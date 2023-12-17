import React, { useEffect, useState } from "react";
import { formatSeconds } from "../ts/lib/utils";

export function SessionTimeRemainingIndicator({
  sessionTimeRemainingSeconds,
}: {
  sessionTimeRemainingSeconds: number;
}) {
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(
    sessionTimeRemainingSeconds
  );

  useEffect(() => {
    setTimeRemainingSeconds(sessionTimeRemainingSeconds);
  }, [sessionTimeRemainingSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemainingSeconds((curr) => curr - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "inline-block" }}>
      <p
        title="Session time remaining"
        style={{ color: "grey", fontWeight: "thin" }}
      >
        {formatSeconds(timeRemainingSeconds)}
      </p>
    </div>
  );
}
