import {
  AdminStats,
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  Master,
  Notification,
  QuickRequest,
  Review,
  Service,
  ServiceFilters,
  User
} from "@/types";
import { getAuthHeader } from "./auth-client";

interface ApiEnvelope<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

const withQuery = (path: string, params: Record<string, string | number | boolean | null | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

async function apiRequest<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  for (const [key, value] of Object.entries(getAuthHeader())) {
    headers.set(key, value);
  }

  const response = await fetch(path, {
    ...init,
    headers
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Ошибка API");
  }
  if (payload.data === undefined) {
    throw new Error("Сервер вернул пустой ответ");
  }

  return payload.data;
}

const jsonBody = (value: unknown) => JSON.stringify(value);

export function listServices(filters?: ServiceFilters) {
  return apiRequest<Service[]>(
    withQuery("/api/services", {
      category: filters?.category,
      repairType: filters?.repairType,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice
    })
  );
}

export function listMasters(onlyAvailable = false) {
  return apiRequest<Master[]>(withQuery("/api/masters", { available: onlyAvailable || undefined }));
}

export function createQuickRequest(payload: {
  clientName: string;
  clientPhone: string;
  serviceName: string;
}) {
  return apiRequest<QuickRequest>("/api/quick-requests", {
    method: "POST",
    body: jsonBody(payload)
  });
}

export function getAvailableSlots(date: string, masterId?: string | null) {
  return apiRequest<string[]>(withQuery("/api/slots", { date, masterId }));
}

export function createAppointment(payload: CreateAppointmentInput) {
  return apiRequest<Appointment>("/api/appointments", {
    method: "POST",
    body: jsonBody(payload)
  });
}

export function listNotifications() {
  return apiRequest<Notification[]>("/api/notifications");
}

export function markNotificationsRead(ids?: string[]) {
  return apiRequest<{ success: boolean }>("/api/notifications", {
    method: "PATCH",
    body: jsonBody({ ids })
  }).then(() => undefined);
}

export function listClientAppointments() {
  return apiRequest<Appointment[]>(withQuery("/api/appointments", { scope: "client" }));
}

export function listMasterAppointments(masterId: string) {
  return apiRequest<Appointment[]>(withQuery("/api/appointments", { scope: "master", masterId }));
}

export function listAllAppointments() {
  return apiRequest<Appointment[]>(withQuery("/api/appointments", { scope: "all" }));
}

export function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  return apiRequest<Appointment>(`/api/appointments/${appointmentId}`, {
    method: "PATCH",
    body: jsonBody({ status })
  });
}

export function deleteAppointment(appointmentId: string) {
  return apiRequest<{ success: boolean }>(`/api/appointments/${appointmentId}`, {
    method: "DELETE"
  }).then(() => undefined);
}

export function getAdminStats(period?: { from?: string; to?: string }) {
  return apiRequest<AdminStats>(withQuery("/api/admin/stats", period ?? {}));
}

export function adminCreateService(input: Omit<Service, "id">) {
  return apiRequest<Service>("/api/services", {
    method: "POST",
    body: jsonBody(input)
  });
}

export function adminUpdateService(serviceId: string, patch: Partial<Omit<Service, "id">>) {
  return apiRequest<Service>(`/api/services/${serviceId}`, {
    method: "PATCH",
    body: jsonBody(patch)
  });
}

export function adminDeleteService(serviceId: string) {
  return apiRequest<{ success: boolean }>(`/api/services/${serviceId}`, {
    method: "DELETE"
  }).then(() => undefined);
}

export function adminSetServicePrice(serviceId: string, price: number) {
  return adminUpdateService(serviceId, { price });
}

export function adminCreateMaster(input: Omit<Master, "id">) {
  return apiRequest<Master>("/api/masters", {
    method: "POST",
    body: jsonBody(input)
  });
}

export function adminUpdateMaster(masterId: string, patch: Partial<Omit<Master, "id">>) {
  return apiRequest<Master>(`/api/masters/${masterId}`, {
    method: "PATCH",
    body: jsonBody(patch)
  });
}

export function adminDeleteMaster(masterId: string) {
  return apiRequest<{ success: boolean }>(`/api/masters/${masterId}`, {
    method: "DELETE"
  }).then(() => undefined);
}

export function getProfile() {
  return apiRequest<User>("/api/profile");
}

export function updateProfile(patch: Partial<Pick<User, "name" | "phone" | "email">>) {
  return apiRequest<User>("/api/profile", {
    method: "PATCH",
    body: jsonBody(patch)
  });
}

export function listUsers() {
  return apiRequest<User[]>("/api/users");
}

export function adminUpdateUser(
  userId: string,
  patch: Partial<Pick<User, "role" | "linkedMasterId" | "isBanned">>
) {
  return apiRequest<User>(`/api/users/${userId}`, {
    method: "PATCH",
    body: jsonBody(patch)
  });
}

export function adminDeleteUser(userId: string) {
  return apiRequest<{ success: boolean }>(`/api/users/${userId}`, {
    method: "DELETE"
  }).then(() => undefined);
}

export function listClientReviews() {
  return apiRequest<Review[]>("/api/reviews");
}

export function createReview(payload: { appointmentId: string; rating: number; text: string }) {
  return apiRequest<Review>("/api/reviews", {
    method: "POST",
    body: jsonBody(payload)
  });
}
