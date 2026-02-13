"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RefreshIndicator({
  isRefreshing,
  onRefresh,
}: RefreshIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Refreshing Banner */}
      <div
        className={cn(
          "transition-all duration-300",
          isRefreshing
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
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
