"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  lastRefresh?: Date;
}

export function RefreshIndicator({
  isRefreshing,
  onRefresh,
  lastRefresh,
}: RefreshIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (!lastRefresh) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);

      if (seconds < 5) {
        setTimeAgo("przed chwilą");
      } else if (seconds < 60) {
        // Round down to nearest 5 seconds
        const roundedSeconds = Math.floor(seconds / 5) * 5;
        setTimeAgo(`${roundedSeconds}s temu`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m temu`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [lastRefresh]);

  return (
    <div className="flex items-center gap-3">
      {/* Last Refresh Info */}
      {lastRefresh && !isRefreshing && (
        <div className="text-xs text-gray-500">
          Odświeżono {timeAgo}
        </div>
      )}

      {/* Refreshing Banner */}
      <div
        className={cn(
          "transition-all duration-300",
          isRefreshing
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none absolute"
        )}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Odświeżanie...</span>
        </div>
      </div>

      {/* Manual Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={cn(
          "p-2 rounded-full hover:bg-orange-100 transition-colors text-orange-600",
          isRefreshing && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Odśwież dane"
        title="Odśwież dane"
      >
        <RefreshCw
          className={cn("w-5 h-5", isRefreshing && "animate-spin")}
        />
      </button>
    </div>
  );
}
