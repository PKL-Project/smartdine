"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Default polling interval in milliseconds (30 seconds)
export const DEFAULT_POLLING_INTERVAL = 30000;

interface UsePollingOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onRefresh?: () => void;
}

export function usePolling({
  interval = DEFAULT_POLLING_INTERVAL,
  enabled = true,
  onRefresh,
}: UsePollingOptions = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 500); // Show indicator for at least 500ms
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling
    intervalRef.current = setInterval(() => {
      refresh();
    }, interval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled, refresh]);

  return {
    isRefreshing,
    lastRefresh,
    refresh,
  };
}
