"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface SuggestedTable {
  id: string;
  name: string;
  capacity: number;
}

export interface TimeSlot {
  slotIndex: number;
  startTime: string;
  endTime: string;
  available: boolean;
  suggestedTable?: SuggestedTable | null;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlots: number[];
  onSelectionChange: (slots: number[]) => void;
  slotDurationMinutes: number;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  originalSlots?: number[];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TimeSlotPicker({
  slots,
  selectedSlots,
  onSelectionChange,
  slotDurationMinutes,
  disabled = false,
  loading = false,
  emptyMessage = "Brak dostępnych slotów w tym dniu",
  originalSlots = [],
}: TimeSlotPickerProps) {
  // Group consecutive selected slots into ranges for display
  const displayItems = useMemo(() => {
    const items: Array<{
      type: "single" | "merged";
      slotIndices: number[];
      startTime: string;
      endTime: string;
      available: boolean;
      isSelected: boolean;
      isOriginal: boolean;
      suggestedTable: SuggestedTable | null;
    }> = [];

    let i = 0;
    while (i < slots.length) {
      const slot = slots[i];
      const isSelected = selectedSlots.includes(slot.slotIndex);
      const nextSlot = slots[i + 1];
      const isNextSelected = nextSlot && selectedSlots.includes(nextSlot.slotIndex);

      // Check if this slot and next slot are both selected (consecutive)
      if (isSelected && isNextSelected) {
        // Merge consecutive selected slots - use the first slot's table
        items.push({
          type: "merged",
          slotIndices: [slot.slotIndex, nextSlot.slotIndex],
          startTime: slot.startTime,
          endTime: nextSlot.endTime,
          available: true,
          isSelected: true,
          isOriginal: false,
          suggestedTable: slot.suggestedTable || null,
        });
        i += 2;
      } else {
        // Single slot
        items.push({
          type: "single",
          slotIndices: [slot.slotIndex],
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: slot.available,
          isSelected,
          isOriginal: originalSlots.includes(slot.slotIndex),
          suggestedTable: slot.suggestedTable || null,
        });
        i += 1;
      }
    }

    return items;
  }, [slots, selectedSlots, originalSlots]);

  function handleSlotClick(slotIndex: number) {
    if (disabled) return;

    const slot = slots.find((s) => s.slotIndex === slotIndex);
    if (!slot || !slot.available) return;

    if (selectedSlots.includes(slotIndex)) {
      // Deselect
      onSelectionChange(selectedSlots.filter((i) => i !== slotIndex));
    } else if (selectedSlots.length === 0) {
      // First selection
      onSelectionChange([slotIndex]);
    } else if (selectedSlots.length === 1) {
      const firstSlot = selectedSlots[0];
      // Check if sequential
      if (slotIndex === firstSlot + 1) {
        // Sequential forward - check if next slot is available
        const nextSlotData = slots.find((s) => s.slotIndex === slotIndex);
        if (nextSlotData?.available) {
          onSelectionChange([firstSlot, slotIndex]);
        }
      } else if (slotIndex === firstSlot - 1) {
        // Sequential backward - check if previous slot is available
        const prevSlotData = slots.find((s) => s.slotIndex === slotIndex);
        if (prevSlotData?.available) {
          onSelectionChange([slotIndex, firstSlot]);
        }
      } else {
        // Not sequential, replace selection
        onSelectionChange([slotIndex]);
      }
    } else {
      // Already have 2 slots, replace with new selection
      onSelectionChange([slotIndex]);
    }
  }

  function handleMergedClick() {
    if (disabled) {
      return;
    }
    // Clicking merged tile deselects all
    onSelectionChange([]);
  }

  if (loading) {
    return <div className="text-sm text-gray-600 p-3 border rounded-lg">Ładowanie dostępnych slotów...</div>;
  }

  if (slots.length === 0) {
    return <div className="text-sm text-gray-600 p-3 border rounded-lg bg-gray-50">{emptyMessage}</div>;
  }

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto p-2 border rounded-lg">
      {displayItems.map((item, idx) => {
        const canSelect =
          !disabled &&
          (item.available ||
            item.isSelected ||
            (selectedSlots.length === 1 &&
              (item.slotIndices[0] === selectedSlots[0] + 1 || item.slotIndices[0] === selectedSlots[0] - 1)));

        if (item.type === "merged") {
          // Merged consecutive slots - 2x single slot height + gap
          return (
            <button
              key={`merged-${idx}`}
              type="button"
              onClick={handleMergedClick}
              disabled={disabled}
              className={cn(
                "w-full px-4 py-8 rounded-lg text-sm font-medium transition-all flex justify-between items-center",
                "bg-orange-600 text-white ring-2 ring-orange-300 shadow-md",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">
                  {formatTime(item.startTime)} - {formatTime(item.endTime)}
                </span>
                {item.suggestedTable && (
                  <span className="text-xs text-orange-200">Stolik: {item.suggestedTable.capacity} os.</span>
                )}
              </div>
              <span className="text-xs bg-orange-500 px-2 py-1 rounded">
                {item.slotIndices.length * slotDurationMinutes} min
              </span>
            </button>
          );
        }

        // Single slot
        const slotIndex = item.slotIndices[0];

        return (
          <button
            key={slotIndex}
            type="button"
            disabled={!canSelect}
            onClick={() => handleSlotClick(slotIndex)}
            className={cn(
              "w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex justify-between items-center relative",
              item.isSelected && "bg-orange-600 text-white ring-2 ring-orange-300 shadow-md",
              !item.isSelected && item.isOriginal && "bg-blue-100 text-blue-700 border-2 border-blue-300",
              !item.isSelected &&
                !item.isOriginal &&
                canSelect &&
                item.available &&
                "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200",
              !canSelect && !item.isSelected && "bg-gray-100 text-gray-400 cursor-not-allowed",
            )}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span>
                {formatTime(item.startTime)} - {formatTime(item.endTime)}
              </span>
              {item.suggestedTable && item.available && (
                <span className={cn("text-xs", item.isSelected ? "text-orange-200" : "text-gray-500")}>
                  Stolik: {item.suggestedTable.capacity} os.
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-xs px-2 py-1 rounded",
                item.isSelected && "bg-orange-500",
                !item.isSelected && item.isOriginal && "bg-blue-200",
                !item.isSelected && !item.isOriginal && item.available && "bg-green-100",
                !item.available && !item.isSelected && "bg-gray-200",
              )}
            >
              {slotDurationMinutes} min
            </span>
            {item.isOriginal && !item.isSelected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
