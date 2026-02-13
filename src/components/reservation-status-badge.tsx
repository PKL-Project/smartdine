import { cn } from "@/lib/utils";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

interface ReservationStatusBadgeProps {
  status: ReservationStatus | string;
  className?: string;
}

const statusConfig = {
  CONFIRMED: {
    label: "Potwierdzona",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  PENDING: {
    label: "Oczekująca",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  CANCELLED: {
    label: "Anulowana",
    className: "bg-red-100 text-red-700 border-red-200",
  },
} as const;

export function ReservationStatusBadge({
  status,
  className,
}: ReservationStatusBadgeProps) {
  const config = statusConfig[status as ReservationStatus] || {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
