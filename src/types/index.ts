export type WatchCategory = "mechanical" | "quartz" | "smart";
export type RepairType = "glass" | "cleaning" | "restoration" | "battery" | "waterproofing";
export type UserRole = "client" | "master" | "admin";
export type AppointmentStatus = "pending" | "in-progress" | "ready" | "done";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: WatchCategory;
  repairType: RepairType;
  imageUrl: string;
}

export interface Master {
  id: string;
  name: string;
  photo: string;
  specialization: WatchCategory | "universal";
  experience: number;
  rating: number;
  available: boolean;
  bio: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  masterId: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  password?: string;
  passwordHash?: string;
  appointments: string[];
  linkedMasterId?: string;
}

export interface QuickRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  createdAt: string;
}

export interface ServiceFilters {
  category?: WatchCategory | "all";
  repairType?: RepairType | "all";
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateAppointmentInput {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  masterId?: string | null;
  date: string;
  timeSlot: string;
}

export interface AuthSession {
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  linkedMasterId?: string;
  token?: string;
  expiresAt?: string;
}

export interface PopularServiceStat {
  serviceId: string;
  serviceName: string;
  bookings: number;
}

export interface MasterLoadStat {
  masterId: string;
  masterName: string;
  orders: number;
}

export interface AdminStats {
  totalAppointments: number;
  totalRevenue: number;
  popularServices: PopularServiceStat[];
  masterLoad: MasterLoadStat[];
}

