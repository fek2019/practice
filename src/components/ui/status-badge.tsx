import { getStatusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppointmentStatus } from "@/types";

const statusClass: Record<AppointmentStatus, string> = {
  pending: "status-pending",
  "in-progress": "status-progress",
  ready: "status-ready",
  done: "status-done"
};

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={cn("status-badge", statusClass[status])}>{getStatusLabel(status)}</span>;
}

