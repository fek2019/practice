import { getStatusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppointmentStatus } from "@/types";

const statusClass: Record<AppointmentStatus, string> = {
  pending: "status-progress",
  "in-progress": "status-progress",
  ready: "status-ready",
  done: "status-done",
  cancelled: "status-cancelled"
};

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={cn("status-badge", statusClass[status])}>{getStatusLabel(status)}</span>;
}

