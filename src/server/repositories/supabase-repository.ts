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
import { createSupabaseAdminClient } from "../supabase/client";
import { conflict, notFound } from "../errors";
import { sendClientNotification, sendMasterNotification } from "../notifications";
import { generateId, getWorkshopSlots } from "./workshop-rules";
import { CreateQuickRequestInput, WorkshopRepository } from "./types";

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Service["category"];
  repair_type: Service["repairType"];
  image_url: string;
};

type MasterRow = {
  id: string;
  name: string;
  photo: string;
  specialization: Master["specialization"];
  experience: number;
  rating: number;
  available: boolean;
  bio: string;
};

type AppointmentRow = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_id: string;
  master_id: string;
  date: string;
  time_slot: string;
  status: AppointmentStatus;
  created_at: string;
};

type UserRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  password_hash: string | null;
  linked_master_id: string | null;
};

type QuickRequestRow = {
  id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  created_at: string;
};

const toService = (row: ServiceRow): Service => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  category: row.category,
  repairType: row.repair_type,
  imageUrl: row.image_url
});

const toServiceRow = (service: Omit<Service, "id"> | Service) => ({
  name: service.name,
  description: service.description,
  price: service.price,
  category: service.category,
  repair_type: service.repairType,
  image_url: service.imageUrl
});

const toMaster = (row: MasterRow): Master => ({
  id: row.id,
  name: row.name,
  photo: row.photo,
  specialization: row.specialization,
  experience: Number(row.experience),
  rating: Number(row.rating),
  available: Boolean(row.available),
  bio: row.bio
});

const toMasterRow = (master: Omit<Master, "id"> | Master) => ({
  name: master.name,
  photo: master.photo,
  specialization: master.specialization,
  experience: master.experience,
  rating: master.rating,
  available: master.available,
  bio: master.bio
});

const toAppointment = (row: AppointmentRow): Appointment => ({
  id: row.id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  clientEmail: row.client_email,
  serviceId: row.service_id,
  masterId: row.master_id,
  date: row.date,
  timeSlot: row.time_slot,
  status: row.status,
  createdAt: row.created_at
});

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  phone: row.phone ?? "",
  email: row.email ?? "",
  role: row.role,
  passwordHash: row.password_hash ?? undefined,
  appointments: [],
  linkedMasterId: row.linked_master_id ?? undefined
});

const toQuickRequest = (row: QuickRequestRow): QuickRequest => ({
  id: row.id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  serviceName: row.service_name,
  createdAt: row.created_at
});

const fail = (error: { code?: string; message: string } | null, fallback: string) => {
  if (!error) {
    return;
  }
  if (error.code === "23505") {
    throw conflict("Запись с такими данными уже существует");
  }
  throw new Error(`${fallback}: ${error.message}`);
};

const db = () => createSupabaseAdminClient();

const chooseBestMaster = async (date: string, timeSlot: string) => {
  const client = db();
  const { data: masters, error: mastersError } = await client
    .from("masters")
    .select("id")
    .eq("available", true);
  fail(mastersError, "Не удалось получить мастеров");

  const masterIds = ((masters ?? []) as Array<{ id: string }>).map((master) => master.id);
  if (masterIds.length === 0) {
    return null;
  }

  const { data: busy, error: busyError } = await client
    .from("appointments")
    .select("master_id")
    .eq("date", date)
    .eq("time_slot", timeSlot)
    .neq("status", "done");
  fail(busyError, "Не удалось проверить слоты");

  const busyIds = new Set(((busy ?? []) as Array<{ master_id: string }>).map((item) => item.master_id));
  const freeIds = masterIds.filter((id) => !busyIds.has(id));
  if (freeIds.length === 0) {
    return null;
  }

  const { data: loads, error: loadsError } = await client
    .from("appointments")
    .select("master_id")
    .in("master_id", freeIds);
  fail(loadsError, "Не удалось рассчитать загрузку");

  const loadMap = new Map<string, number>();
  for (const item of (loads ?? []) as Array<{ master_id: string }>) {
    loadMap.set(item.master_id, (loadMap.get(item.master_id) ?? 0) + 1);
  }

  return [...freeIds].sort((a, b) => (loadMap.get(a) ?? 0) - (loadMap.get(b) ?? 0))[0] ?? null;
};

export const supabaseRepository: WorkshopRepository = {
  async listServices(filters?: ServiceFilters) {
    let query = db().from("services").select("*").order("created_at", { ascending: false });

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }
    if (filters?.repairType && filters.repairType !== "all") {
      query = query.eq("repair_type", filters.repairType);
    }
    if (filters?.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    const { data, error } = await query;
    fail(error, "Не удалось получить услуги");
    return ((data ?? []) as ServiceRow[]).map(toService);
  },

  async getServiceById(serviceId: string) {
    const { data, error } = await db().from("services").select("*").eq("id", serviceId).maybeSingle();
    fail(error, "Не удалось получить услугу");
    return data ? toService(data as ServiceRow) : null;
  },

  async createService(input: Omit<Service, "id">) {
    const payload = { id: generateId("srv"), ...toServiceRow(input) };
    const { data, error } = await db().from("services").insert(payload).select("*").single();
    fail(error, "Не удалось создать услугу");
    return toService(data as ServiceRow);
  },

  async updateService(serviceId: string, patch: Partial<Omit<Service, "id">>) {
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.price !== undefined) payload.price = patch.price;
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.repairType !== undefined) payload.repair_type = patch.repairType;
    if (patch.imageUrl !== undefined) payload.image_url = patch.imageUrl;

    const { data, error } = await db().from("services").update(payload).eq("id", serviceId).select("*").maybeSingle();
    fail(error, "Не удалось обновить услугу");
    if (!data) {
      throw notFound("Услуга не найдена");
    }
    return toService(data as ServiceRow);
  },

  async deleteService(serviceId: string) {
    const { error } = await db().from("services").delete().eq("id", serviceId);
    fail(error, "Не удалось удалить услугу");
  },

  async listMasters(onlyAvailable = false) {
    let query = db().from("masters").select("*").order("created_at", { ascending: false });
    if (onlyAvailable) {
      query = query.eq("available", true);
    }
    const { data, error } = await query;
    fail(error, "Не удалось получить мастеров");
    return ((data ?? []) as MasterRow[]).map(toMaster);
  },

  async getMasterById(masterId: string) {
    const { data, error } = await db().from("masters").select("*").eq("id", masterId).maybeSingle();
    fail(error, "Не удалось получить мастера");
    return data ? toMaster(data as MasterRow) : null;
  },

  async createMaster(input: Omit<Master, "id">) {
    const payload = { id: generateId("m"), ...toMasterRow(input) };
    const { data, error } = await db().from("masters").insert(payload).select("*").single();
    fail(error, "Не удалось создать мастера");
    return toMaster(data as MasterRow);
  },

  async updateMaster(masterId: string, patch: Partial<Omit<Master, "id">>) {
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.photo !== undefined) payload.photo = patch.photo;
    if (patch.specialization !== undefined) payload.specialization = patch.specialization;
    if (patch.experience !== undefined) payload.experience = patch.experience;
    if (patch.rating !== undefined) payload.rating = patch.rating;
    if (patch.available !== undefined) payload.available = patch.available;
    if (patch.bio !== undefined) payload.bio = patch.bio;

    const { data, error } = await db().from("masters").update(payload).eq("id", masterId).select("*").maybeSingle();
    fail(error, "Не удалось обновить мастера");
    if (!data) {
      throw notFound("Мастер не найден");
    }
    return toMaster(data as MasterRow);
  },

  async deleteMaster(masterId: string) {
    const { error } = await db().from("masters").delete().eq("id", masterId);
    fail(error, "Не удалось удалить мастера");
  },

  async createQuickRequest(input: CreateQuickRequestInput) {
    const payload = {
      id: generateId("qr"),
      client_name: input.clientName,
      client_phone: input.clientPhone,
      service_name: input.serviceName
    };
    const { data, error } = await db().from("quick_requests").insert(payload).select("*").single();
    fail(error, "Не удалось создать заявку");
    return toQuickRequest(data as QuickRequestRow);
  },

  async getAvailableSlots(date: string, masterId?: string | null) {
    const masters = await this.listMasters(true);
    if (masters.length === 0) {
      return [];
    }

    const slots = getWorkshopSlots();
    const client = db();

    if (masterId && masterId !== "any") {
      const { data, error } = await client
        .from("appointments")
        .select("time_slot")
        .eq("master_id", masterId)
        .eq("date", date)
        .neq("status", "done");
      fail(error, "Не удалось получить занятые слоты");
      const busy = new Set(((data ?? []) as Array<{ time_slot: string }>).map((item) => item.time_slot));
      return slots.filter((slot) => !busy.has(slot));
    }

    const { data, error } = await client
      .from("appointments")
      .select("time_slot")
      .eq("date", date)
      .neq("status", "done");
    fail(error, "Не удалось получить занятые слоты");

    const busyCount = new Map<string, number>();
    for (const item of (data ?? []) as Array<{ time_slot: string }>) {
      busyCount.set(item.time_slot, (busyCount.get(item.time_slot) ?? 0) + 1);
    }

    return slots.filter((slot) => (busyCount.get(slot) ?? 0) < masters.length);
  },

  async createAppointment(input: CreateAppointmentInput) {
    const service = await this.getServiceById(input.serviceId);
    if (!service) {
      throw notFound("Услуга не найдена");
    }

    const availableSlots = await this.getAvailableSlots(input.date, input.masterId);
    if (!availableSlots.includes(input.timeSlot)) {
      throw conflict("Выбранный слот уже занят");
    }

    let masterId = input.masterId || null;
    if (!masterId || masterId === "any") {
      masterId = await chooseBestMaster(input.date, input.timeSlot);
    }
    if (!masterId) {
      throw conflict("Нет свободных мастеров на выбранное время");
    }

    const payload = {
      id: generateId("a"),
      client_name: input.clientName,
      client_phone: input.clientPhone,
      client_email: input.clientEmail,
      service_id: input.serviceId,
      master_id: masterId,
      date: input.date,
      time_slot: input.timeSlot,
      status: "pending" satisfies AppointmentStatus
    };

    const { data, error } = await db().from("appointments").insert(payload).select("*").single();
    fail(error, "Не удалось создать запись");

    const appointment = toAppointment(data as AppointmentRow);
    await this.createClientUser({
      name: appointment.clientName,
      phone: appointment.clientPhone,
      email: appointment.clientEmail
    }).catch(() => undefined);

    await sendClientNotification(
      appointment.clientPhone,
      `Заявка ${appointment.id} принята. Дата: ${appointment.date}, время: ${appointment.timeSlot}.`
    );
    await sendMasterNotification(masterId, `Новая заявка ${appointment.id} на ${appointment.date} ${appointment.timeSlot}.`);

    return appointment;
  },

  async getAppointmentById(appointmentId: string) {
    const { data, error } = await db().from("appointments").select("*").eq("id", appointmentId).maybeSingle();
    fail(error, "Не удалось получить запись");
    return data ? toAppointment(data as AppointmentRow) : null;
  },

  async listClientAppointments(query: { phone?: string; email?: string }) {
    const client = db();
    let builder = client.from("appointments").select("*");
    if (query.phone && query.email) {
      builder = builder.or(`client_phone.eq.${query.phone},client_email.eq.${query.email}`);
    } else if (query.phone) {
      builder = builder.eq("client_phone", query.phone);
    } else if (query.email) {
      builder = builder.eq("client_email", query.email);
    }
    const { data, error } = await builder.order("date", { ascending: false }).order("time_slot", { ascending: false });
    fail(error, "Не удалось получить записи клиента");
    return ((data ?? []) as AppointmentRow[]).map(toAppointment);
  },

  async listMasterAppointments(masterId: string) {
    const { data, error } = await db()
      .from("appointments")
      .select("*")
      .eq("master_id", masterId)
      .order("date", { ascending: true })
      .order("time_slot", { ascending: true });
    fail(error, "Не удалось получить записи мастера");
    return ((data ?? []) as AppointmentRow[]).map(toAppointment);
  },

  async listAllAppointments() {
    const { data, error } = await db().from("appointments").select("*").order("created_at", { ascending: false });
    fail(error, "Не удалось получить записи");
    return ((data ?? []) as AppointmentRow[]).map(toAppointment);
  },

  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    const { data, error } = await db()
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .select("*")
      .maybeSingle();
    fail(error, "Не удалось обновить статус");
    if (!data) {
      throw notFound("Заявка не найдена");
    }

    const appointment = toAppointment(data as AppointmentRow);
    if (status === "ready") {
      await sendClientNotification(appointment.clientPhone, "Ваши часы готовы к выдаче.");
    }
    return appointment;
  },

  async getAdminStats(): Promise<AdminStats> {
    const [appointments, services, masters] = await Promise.all([
      this.listAllAppointments(),
      this.listServices(),
      this.listMasters()
    ]);

    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const popularServiceMap = new Map<string, number>();
    for (const appointment of appointments) {
      popularServiceMap.set(appointment.serviceId, (popularServiceMap.get(appointment.serviceId) ?? 0) + 1);
    }

    const popularServices = [...popularServiceMap.entries()]
      .map(([serviceId, bookings]) => ({
        serviceId,
        serviceName: serviceMap.get(serviceId)?.name ?? "Неизвестная услуга",
        bookings
      }))
      .sort((a, b) => b.bookings - a.bookings);

    const masterLoad = masters.map((master) => ({
      masterId: master.id,
      masterName: master.name,
      orders: appointments.filter((appointment) => appointment.masterId === master.id).length
    }));

    const totalRevenue = appointments
      .filter((appointment) => appointment.status === "done")
      .reduce((sum, appointment) => sum + (serviceMap.get(appointment.serviceId)?.price ?? 0), 0);

    return {
      totalAppointments: appointments.length,
      totalRevenue,
      popularServices,
      masterLoad
    };
  },

  async getUserByEmail(email: string) {
    const { data, error } = await db().from("users").select("*").eq("email", email).maybeSingle();
    fail(error, "Не удалось получить пользователя");
    return data ? toUser(data as UserRow) : null;
  },

  async getUserByPhone(phone: string) {
    const { data, error } = await db().from("users").select("*").eq("phone", phone).maybeSingle();
    fail(error, "Не удалось получить пользователя");
    return data ? toUser(data as UserRow) : null;
  },

  async getFirstUserByRole(role: UserRole) {
    const { data, error } = await db().from("users").select("*").eq("role", role).limit(1).maybeSingle();
    fail(error, "Не удалось получить пользователя");
    return data ? toUser(data as UserRow) : null;
  },

  async createClientUser(input: { name: string; phone?: string; email?: string; passwordHash?: string }) {
    const byPhone = input.phone ? await this.getUserByPhone(input.phone) : null;
    if (byPhone) {
      return byPhone;
    }

    const byEmail = input.email ? await this.getUserByEmail(input.email) : null;
    if (byEmail) {
      return byEmail;
    }

    const payload = {
      id: generateId("u"),
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      role: "client" satisfies UserRole,
      password_hash: input.passwordHash || null
    };
    const { data, error } = await db().from("users").insert(payload).select("*").single();
    fail(error, "Не удалось создать пользователя");
    return toUser(data as UserRow);
  }
};
