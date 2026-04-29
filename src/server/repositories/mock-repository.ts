import {
  AdminStats,
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  Master,
  QuickRequest,
  Service,
  ServiceFilters,
  User,
  UserRole
} from "@/types";
import { mockDb } from "@/lib/stubs/data";
import { conflict, notFound } from "../errors";
import { sendClientNotification, sendMasterNotification } from "../notifications";
import { clone, generateId, getWorkshopSlots } from "./workshop-rules";
import { CreateQuickRequestInput, WorkshopRepository } from "./types";

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
    if (!existingUser.appointments.includes(appointment.id)) {
      existingUser.appointments.push(appointment.id);
    }
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

  return masterLoad.sort((a, b) => a.orders - b.orders)[0].masterId;
};

export const mockRepository: WorkshopRepository = {
  async listServices(filters?: ServiceFilters) {
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
  },

  async getServiceById(serviceId: string) {
    return clone(findService(serviceId) ?? null);
  },

  async createService(input: Omit<Service, "id">) {
    const service: Service = {
      id: generateId("srv"),
      ...input
    };
    mockDb.services.unshift(service);
    return clone(service);
  },

  async updateService(serviceId: string, patch: Partial<Omit<Service, "id">>) {
    const service = findService(serviceId);
    if (!service) {
      throw notFound("Услуга не найдена");
    }
    Object.assign(service, patch);
    return clone(service);
  },

  async deleteService(serviceId: string) {
    const index = mockDb.services.findIndex((service) => service.id === serviceId);
    if (index === -1) {
      throw notFound("Услуга не найдена");
    }
    mockDb.services.splice(index, 1);
  },

  async listMasters(onlyAvailable = false) {
    const data = onlyAvailable ? mockDb.masters.filter((master) => master.available) : mockDb.masters;
    return clone(data);
  },

  async getMasterById(masterId: string) {
    return clone(findMaster(masterId) ?? null);
  },

  async createMaster(input: Omit<Master, "id">) {
    const master: Master = {
      id: generateId("m"),
      ...input
    };
    mockDb.masters.unshift(master);
    return clone(master);
  },

  async updateMaster(masterId: string, patch: Partial<Omit<Master, "id">>) {
    const master = findMaster(masterId);
    if (!master) {
      throw notFound("Мастер не найден");
    }
    Object.assign(master, patch);
    return clone(master);
  },

  async deleteMaster(masterId: string) {
    const index = mockDb.masters.findIndex((master) => master.id === masterId);
    if (index === -1) {
      throw notFound("Мастер не найден");
    }
    mockDb.masters.splice(index, 1);
  },

  async createQuickRequest(input: CreateQuickRequestInput) {
    const request: QuickRequest = {
      id: generateId("qr"),
      ...input,
      createdAt: new Date().toISOString()
    };
    mockDb.quickRequests.unshift(request);
    return clone(request);
  },

  async getAvailableSlots(date: string, masterId?: string | null) {
    const slots = getWorkshopSlots();
    const availableMasters = mockDb.masters.filter((master) => master.available);

    if (availableMasters.length === 0) {
      return [];
    }

    if (masterId && masterId !== "any") {
      return slots.filter((slot) => !isMasterBusy(masterId, date, slot));
    }

    return slots.filter((slot) => getBookedCount(date, slot) < availableMasters.length);
  },

  async createAppointment(payload: CreateAppointmentInput) {
    const service = findService(payload.serviceId);
    if (!service) {
      throw notFound("Услуга не найдена");
    }

    const availableSlots = await this.getAvailableSlots(payload.date, payload.masterId ?? null);
    if (!availableSlots.includes(payload.timeSlot)) {
      throw conflict("Выбранный слот уже занят");
    }

    let masterId = payload.masterId ?? null;
    if (!masterId || masterId === "any") {
      masterId = await chooseBestMaster(payload.date, payload.timeSlot);
    }

    if (!masterId) {
      throw conflict("Нет свободных мастеров на выбранное время");
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
  },

  async getAppointmentById(appointmentId: string) {
    return clone(mockDb.appointments.find((appointment) => appointment.id === appointmentId) ?? null);
  },

  async listClientAppointments(query: { phone?: string; email?: string }) {
    const result = mockDb.appointments
      .filter((appointment) => {
        const phoneMatch = query.phone && appointment.clientPhone === query.phone;
        const emailMatch = query.email && appointment.clientEmail === query.email;
        return Boolean(phoneMatch || emailMatch);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.timeSlot.localeCompare(a.timeSlot));

    return clone(result);
  },

  async listMasterAppointments(masterId: string) {
    const result = mockDb.appointments
      .filter((appointment) => appointment.masterId === masterId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
    return clone(result);
  },

  async listAllAppointments() {
    return clone(mockDb.appointments);
  },

  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    const appointment = mockDb.appointments.find((item) => item.id === appointmentId);
    if (!appointment) {
      throw notFound("Заявка не найдена");
    }

    appointment.status = status;

    if (status === "ready") {
      await sendClientNotification(appointment.clientPhone, "Ваши часы готовы к выдаче.");
    }

    return clone(appointment);
  },

  async getAdminStats(): Promise<AdminStats> {
    const popularServiceMap = new Map<string, number>();
    for (const appointment of mockDb.appointments) {
      popularServiceMap.set(appointment.serviceId, (popularServiceMap.get(appointment.serviceId) ?? 0) + 1);
    }

    const popularServices = [...popularServiceMap.entries()]
      .map(([serviceId, bookings]) => ({
        serviceId,
        serviceName: findService(serviceId)?.name ?? "Неизвестная услуга",
        bookings
      }))
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
  },

  async getUserByEmail(email: string) {
    return clone(mockDb.users.find((user) => user.email === email) ?? null);
  },

  async getUserByPhone(phone: string) {
    return clone(mockDb.users.find((user) => user.phone === phone) ?? null);
  },

  async getFirstUserByRole(role: UserRole) {
    return clone(mockDb.users.find((user) => user.role === role) ?? null);
  },

  async createClientUser(input: { name: string; phone?: string; email?: string; passwordHash?: string }) {
    const user: User = {
      id: generateId("u"),
      name: input.name,
      phone: input.phone ?? "",
      email: input.email ?? "",
      passwordHash: input.passwordHash,
      role: "client",
      appointments: []
    };
    mockDb.users.push(user);
    return clone(user);
  }
};
