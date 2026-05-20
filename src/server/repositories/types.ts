import {
  AdminStats,
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  Master,
  Notification,
  NotificationKind,
  QuickRequest,
  Review,
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

export interface CreateNotificationInput {
  userId: string;
  appointmentId?: string;
  kind: NotificationKind;
  title: string;
  message: string;
  scheduledFor?: string;
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
  deleteAppointment(appointmentId: string): Promise<void>;
  getAdminStats(period?: { from?: string; to?: string }): Promise<AdminStats>;

  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  getFirstUserByRole(role: UserRole): Promise<User | null>;
  listUsers(): Promise<User[]>;
  updateUser(userId: string, patch: Partial<Pick<User, "name" | "phone" | "email" | "role" | "linkedMasterId" | "isBanned">>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  createClientUser(input: { name: string; phone?: string; email?: string; passwordHash?: string }): Promise<User>;

  createNotification(input: CreateNotificationInput): Promise<Notification>;
  listUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationsRead(userId: string, notificationIds?: string[]): Promise<void>;

  listReviewsByClient(userId: string): Promise<Review[]>;
  createReview(input: Omit<Review, "id" | "createdAt">): Promise<Review>;
}
