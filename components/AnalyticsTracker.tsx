"use client";

import { useEffect, useRef } from "react";

export function AnalyticsTracker({ path }: { path: string }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;
    const controller = new AbortController();

    fetch("/api/analytics/visit", {
      method: "POST",
      body: JSON.stringify({ path }),
      headers: {
        "Content-Type": "application/json"
      },
      keepalive: true,
      signal: controller.signal
    }).catch(() => undefined);

    return () => controller.abort();
  }, [path]);

  return null;
}
