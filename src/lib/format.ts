import { AppointmentStatus, RepairType, WatchCategory } from "@/types";

const categoryLabels: Record<WatchCategory, string> = {
  mechanical: "Механические",
  quartz: "Кварцевые",
  smart: "Smart"
};

const repairTypeLabels: Record<RepairType, string> = {
  glass: "Стекло",
  cleaning: "Чистка",
  restoration: "Реставрация",
  battery: "Батарейка",
  waterproofing: "Водозащита"
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Принят в работу",
  "in-progress": "В процессе",
  ready: "Готов к выдаче",
  done: "Выдан клиенту"
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));

export const getCategoryLabel = (category: WatchCategory) => categoryLabels[category];
export const getRepairTypeLabel = (repairType: RepairType) => repairTypeLabels[repairType];
export const getStatusLabel = (status: AppointmentStatus) => statusLabels[status];

