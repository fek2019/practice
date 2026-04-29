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

export interface CreateQuickRequestInput {
  clientName: string;
  clientPhone: string;
  serviceName: string;
}

export interface WorkshopRepository {
  listServices(filters?: ServiceFilters): Promise<Service[]>;
  getServiceById(serviceId: string): Promise<Service | null>;
  createService(input: Omit<Service, "id">): Promise<Service>;
  updateService(serviceId: string, patch: Partial<Omit<Service, "id">>): Promise<Service>;
  deleteService(serviceId: string): Promise<void>;

  listMasters(onlyAvailable?: boolean): Promise<Master[]>;
  getMasterById(masterId: string): Promise<Master | null>;
  createMaster(input: Omit<Master, "id">): Promise<Master>;
  updateMaster(masterId: string, patch: Partial<Omit<Master, "id">>): Promise<Master>;
  deleteMaster(masterId: string): Promise<void>;

  createQuickRequest(input: CreateQuickRequestInput): Promise<QuickRequest>;

  getAvailableSlots(date: string, masterId?: string | null): Promise<string[]>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  getAppointmentById(appointmentId: string): Promise<Appointment | null>;
  listClientAppointments(query: { phone?: string; email?: string }): Promise<Appointment[]>;
  listMasterAppointments(masterId: string): Promise<Appointment[]>;
  listAllAppointments(): Promise<Appointment[]>;
  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<Appointment>;
  getAdminStats(): Promise<AdminStats>;

  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  getFirstUserByRole(role: UserRole): Promise<User | null>;
  createClientUser(input: { name: string; phone?: string; email?: string; passwordHash?: string }): Promise<User>;
}
