import {
  AdminStats,
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  Master,
  QuickRequest,
  Service,
  ServiceFilters,
  User
} from "@/types";
import { mockDb } from "./data";

const WORK_START_HOUR = 10;
const WORK_END_HOUR = 19;
const SLOT_STEP_MINUTES = 60;

const wait = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

const toTime = (hours: number, minutes: number) =>
  `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

const findService = (serviceId: string) => mockDb.services.find((service) => service.id === serviceId);
const findMaster = (masterId: string) => mockDb.masters.find((master) => master.id === masterId);

const getBookedCount = (date: string, timeSlot: string) =>
  mockDb.appointments.filter((item) => item.date === date && item.timeSlot === timeSlot).length;

const getServicePrice = (serviceId: string) => findService(serviceId)?.price ?? 0;

const isMasterBusy = (masterId: string, date: string, timeSlot: string) =>
  mockDb.appointments.some(
    (item) => item.masterId === masterId && item.date === date && item.timeSlot === timeSlot
  );

const attachAppointmentToClient = (appointment: Appointment) => {
  const existingUser = mockDb.users.find(
    (user) => user.role === "client" && (user.phone === appointment.clientPhone || user.email === appointment.clientEmail)
  );

  if (existingUser) {
    existingUser.appointments.push(appointment.id);
    return;
  }

  const newClient: User = {
    id: generateId("u"),
    name: appointment.clientName,
    phone: appointment.clientPhone,
    email: appointment.clientEmail,
    role: "client",
    appointments: [appointment.id]
  };
  mockDb.users.push(newClient);
};

/**
 * BACKEND STUB LOCATION:
 * - File: src/lib/stubs/api.ts
 * - Function: sendClientNotification
 * Replace this mock with EmailJS / SMS provider integration in backend.
 */
export async function sendClientNotification(phoneOrEmail: string, message: string) {
  await wait(120);
  console.info(`[STUB][Client Notification] -> ${phoneOrEmail}: ${message}`);
}

/**
 * BACKEND STUB LOCATION:
 * - File: src/lib/stubs/api.ts
 * - Function: sendMasterNotification
 * Replace this mock with Telegram Bot API or backend push integration.
 */
export async function sendMasterNotification(masterId: string, message: string) {
  await wait(120);
  console.info(`[STUB][Master Notification] -> ${masterId}: ${message}`);
}

export function getWorkshopSlots() {
  const slots: string[] = [];
  for (let minutes = WORK_START_HOUR * 60; minutes < WORK_END_HOUR * 60; minutes += SLOT_STEP_MINUTES) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(toTime(hour, minute));
  }
  return slots;
}

export async function listServices(filters?: ServiceFilters): Promise<Service[]> {
  await wait();
  const category = filters?.category ?? "all";
  const repairType = filters?.repairType ?? "all";
  const minPrice = filters?.minPrice ?? 0;
  const maxPrice = filters?.maxPrice ?? Number.MAX_SAFE_INTEGER;

  const filtered = mockDb.services.filter((service) => {
    const categoryMatch = category === "all" || service.category === category;
    const repairMatch = repairType === "all" || service.repairType === repairType;
    const priceMatch = service.price >= minPrice && service.price <= maxPrice;
    return categoryMatch && repairMatch && priceMatch;
  });

  return clone(filtered);
}

export async function getServiceById(serviceId: string): Promise<Service | null> {
  await wait();
  return clone(findService(serviceId) ?? null);
}

export async function listMasters(onlyAvailable = false): Promise<Master[]> {
  await wait();
  const data = onlyAvailable ? mockDb.masters.filter((master) => master.available) : mockDb.masters;
  return clone(data);
}

export async function getMasterById(masterId: string): Promise<Master | null> {
  await wait();
  return clone(findMaster(masterId) ?? null);
}

export async function createQuickRequest(payload: {
  clientName: string;
  clientPhone: string;
  serviceName: string;
}): Promise<QuickRequest> {
  await wait();
  const request: QuickRequest = {
    id: generateId("qr"),
    clientName: payload.clientName,
    clientPhone: payload.clientPhone,
    serviceName: payload.serviceName,
    createdAt: new Date().toISOString()
  };
  mockDb.quickRequests.unshift(request);
  return clone(request);
}

export async function getAvailableSlots(date: string, masterId?: string | null): Promise<string[]> {
  await wait();
  const slots = getWorkshopSlots();
  const availableMasters = mockDb.masters.filter((master) => master.available);

  if (availableMasters.length === 0) {
    return [];
  }

  if (masterId && masterId !== "any") {
    return slots.filter((slot) => !isMasterBusy(masterId, date, slot));
  }

  return slots.filter((slot) => {
    const bookedCount = getBookedCount(date, slot);
    return bookedCount < availableMasters.length;
  });
}

const chooseBestMaster = async (date: string, timeSlot: string) => {
  const availableMasters = mockDb.masters.filter((master) => master.available);
  const freeMasters = availableMasters.filter((master) => !isMasterBusy(master.id, date, timeSlot));

  if (freeMasters.length === 0) {
    return null;
  }

  const masterLoad = freeMasters.map((master) => ({
    masterId: master.id,
    orders: mockDb.appointments.filter((appointment) => appointment.masterId === master.id).length
  }));

  const selected = masterLoad.sort((a, b) => a.orders - b.orders)[0];
  return selected.masterId;
};

export async function createAppointment(payload: CreateAppointmentInput): Promise<Appointment> {
  await wait();

  const service = findService(payload.serviceId);
  if (!service) {
    throw new Error("Услуга не найдена");
  }

  const availableSlots = await getAvailableSlots(payload.date, payload.masterId ?? null);
  if (!availableSlots.includes(payload.timeSlot)) {
    throw new Error("Выбранный слот уже занят");
  }

  let masterId = payload.masterId ?? null;
  if (!masterId || masterId === "any") {
    masterId = await chooseBestMaster(payload.date, payload.timeSlot);
  }

  if (!masterId) {
    throw new Error("Нет свободных мастеров на выбранное время");
  }

  const appointment: Appointment = {
    id: generateId("a"),
    clientName: payload.clientName,
    clientPhone: payload.clientPhone,
    clientEmail: payload.clientEmail,
    serviceId: payload.serviceId,
    masterId,
    date: payload.date,
    timeSlot: payload.timeSlot,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  mockDb.appointments.unshift(appointment);
  attachAppointmentToClient(appointment);

  await sendClientNotification(
    appointment.clientPhone,
    `Заявка ${appointment.id} принята. Дата: ${appointment.date}, время: ${appointment.timeSlot}.`
  );
  await sendMasterNotification(masterId, `Новая заявка ${appointment.id} на ${appointment.date} ${appointment.timeSlot}.`);

  return clone(appointment);
}

export async function listClientAppointments(query: { phone?: string; email?: string }) {
  await wait();
  const result = mockDb.appointments
    .filter((appointment) => {
      const phoneMatch = query.phone && appointment.clientPhone === query.phone;
      const emailMatch = query.email && appointment.clientEmail === query.email;
      return Boolean(phoneMatch || emailMatch);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.timeSlot.localeCompare(a.timeSlot));

  return clone(result);
}

export async function listMasterAppointments(masterId: string) {
  await wait();
  const result = mockDb.appointments
    .filter((appointment) => appointment.masterId === masterId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
  return clone(result);
}

export async function listAllAppointments() {
  await wait();
  return clone(mockDb.appointments);
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  await wait();
  const appointment = mockDb.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    throw new Error("Заявка не найдена");
  }

  appointment.status = status;

  if (status === "ready") {
    await sendClientNotification(appointment.clientPhone, "Ваши часы готовы к выдаче.");
  }

  return clone(appointment);
}

export async function getAdminStats(): Promise<AdminStats> {
  await wait();

  const popularServiceMap = new Map<string, number>();
  for (const appointment of mockDb.appointments) {
    const current = popularServiceMap.get(appointment.serviceId) ?? 0;
    popularServiceMap.set(appointment.serviceId, current + 1);
  }

  const popularServices = [...popularServiceMap.entries()]
    .map(([serviceId, bookings]) => {
      const service = findService(serviceId);
      return {
        serviceId,
        serviceName: service?.name ?? "Неизвестная услуга",
        bookings
      };
    })
    .sort((a, b) => b.bookings - a.bookings);

  const masterLoad = mockDb.masters.map((master) => ({
    masterId: master.id,
    masterName: master.name,
    orders: mockDb.appointments.filter((appointment) => appointment.masterId === master.id).length
  }));

  const totalRevenue = mockDb.appointments
    .filter((appointment) => appointment.status === "done")
    .reduce((sum, appointment) => sum + getServicePrice(appointment.serviceId), 0);

  return {
    totalAppointments: mockDb.appointments.length,
    totalRevenue,
    popularServices,
    masterLoad
  };
}

export async function adminCreateService(input: Omit<Service, "id">): Promise<Service> {
  await wait();
  const service: Service = {
    id: generateId("srv"),
    ...input
  };
  mockDb.services.unshift(service);
  return clone(service);
}

export async function adminUpdateService(serviceId: string, patch: Partial<Omit<Service, "id">>): Promise<Service> {
  await wait();
  const service = findService(serviceId);
  if (!service) {
    throw new Error("Услуга не найдена");
  }
  Object.assign(service, patch);
  return clone(service);
}

export async function adminDeleteService(serviceId: string): Promise<void> {
  await wait();
  const index = mockDb.services.findIndex((service) => service.id === serviceId);
  if (index === -1) {
    throw new Error("Услуга не найдена");
  }
  mockDb.services.splice(index, 1);
}

export async function adminSetServicePrice(serviceId: string, price: number) {
  await wait();
  return adminUpdateService(serviceId, { price });
}

export async function adminCreateMaster(input: Omit<Master, "id">): Promise<Master> {
  await wait();
  const master: Master = {
    id: generateId("m"),
    ...input
  };
  mockDb.masters.unshift(master);
  return clone(master);
}

export async function adminUpdateMaster(masterId: string, patch: Partial<Omit<Master, "id">>): Promise<Master> {
  await wait();
  const master = findMaster(masterId);
  if (!master) {
    throw new Error("Мастер не найден");
  }
  Object.assign(master, patch);
  return clone(master);
}

export async function adminDeleteMaster(masterId: string): Promise<void> {
  await wait();
  const index = mockDb.masters.findIndex((master) => master.id === masterId);
  if (index === -1) {
    throw new Error("Мастер не найден");
  }
  mockDb.masters.splice(index, 1);
}

