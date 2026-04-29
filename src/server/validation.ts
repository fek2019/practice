import { AppointmentStatus, CreateAppointmentInput, Master, RepairType, Service, ServiceFilters, UserRole, WatchCategory } from "@/types";
import { badRequest } from "./errors";

const categories: WatchCategory[] = ["mechanical", "quartz", "smart"];
const repairTypes: RepairType[] = ["glass", "cleaning", "restoration", "battery", "waterproofing"];
const categoriesWithAll: Array<WatchCategory | "all"> = ["mechanical", "quartz", "smart", "all"];
const repairTypesWithAll: Array<RepairType | "all"> = [
  "glass",
  "cleaning",
  "restoration",
  "battery",
  "waterproofing",
  "all"
];
const statuses: AppointmentStatus[] = ["pending", "in-progress", "ready", "done"];
const roles: UserRole[] = ["client", "master", "admin"];
const masterSpecializations: Master["specialization"][] = ["mechanical", "quartz", "smart", "universal"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const readJsonObject = async (request: Request) => {
  try {
    const body = (await request.json()) as unknown;
    if (!isRecord(body)) {
      throw badRequest("Некорректное тело запроса");
    }
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === "ApiError") {
      throw error;
    }
    throw badRequest("Некорректный JSON");
  }
};

export const requireString = (body: Record<string, unknown>, key: string, label = key) => {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`Поле "${label}" обязательно`);
  }
  return value.trim();
};

export const optionalString = (body: Record<string, unknown>, key: string) => {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw badRequest(`Поле "${key}" должно быть строкой`);
  }
  return value.trim();
};

const requireNumber = (body: Record<string, unknown>, key: string, label = key) => {
  const value = body[key];
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw badRequest(`Поле "${label}" должно быть числом`);
  }
  return parsed;
};

const parseEnum = <T extends string>(value: string, allowed: T[], label: string): T => {
  if (!allowed.includes(value as T)) {
    throw badRequest(`Некорректное значение "${label}"`);
  }
  return value as T;
};

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value === "true";
  }
  return fallback;
};

export const parseServiceFilters = (params: URLSearchParams): ServiceFilters => ({
  category: parseEnum(params.get("category") || "all", categoriesWithAll, "category"),
  repairType: parseEnum(params.get("repairType") || "all", repairTypesWithAll, "repairType"),
  minPrice: Number(params.get("minPrice") || 0),
  maxPrice: Number(params.get("maxPrice") || Number.MAX_SAFE_INTEGER)
});

export const parseServiceInput = (body: Record<string, unknown>): Omit<Service, "id"> => ({
  name: requireString(body, "name", "название"),
  description: requireString(body, "description", "описание"),
  price: requireNumber(body, "price", "цена"),
  category: parseEnum(requireString(body, "category"), categories, "category"),
  repairType: parseEnum(requireString(body, "repairType"), repairTypes, "repairType"),
  imageUrl: requireString(body, "imageUrl", "изображение")
});

export const parseServicePatch = (body: Record<string, unknown>): Partial<Omit<Service, "id">> => {
  const patch: Partial<Omit<Service, "id">> = {};
  if (body.name !== undefined) patch.name = requireString(body, "name", "название");
  if (body.description !== undefined) patch.description = requireString(body, "description", "описание");
  if (body.price !== undefined) patch.price = requireNumber(body, "price", "цена");
  if (body.category !== undefined) patch.category = parseEnum(requireString(body, "category"), categories, "category");
  if (body.repairType !== undefined) patch.repairType = parseEnum(requireString(body, "repairType"), repairTypes, "repairType");
  if (body.imageUrl !== undefined) patch.imageUrl = requireString(body, "imageUrl", "изображение");
  return patch;
};

export const parseMasterInput = (body: Record<string, unknown>): Omit<Master, "id"> => ({
  name: requireString(body, "name", "имя"),
  photo: requireString(body, "photo", "фото"),
  specialization: parseEnum(requireString(body, "specialization"), masterSpecializations, "specialization"),
  experience: requireNumber(body, "experience", "опыт"),
  rating: requireNumber(body, "rating", "рейтинг"),
  available: parseBoolean(body.available, true),
  bio: requireString(body, "bio", "описание")
});

export const parseMasterPatch = (body: Record<string, unknown>): Partial<Omit<Master, "id">> => {
  const patch: Partial<Omit<Master, "id">> = {};
  if (body.name !== undefined) patch.name = requireString(body, "name", "имя");
  if (body.photo !== undefined) patch.photo = requireString(body, "photo", "фото");
  if (body.specialization !== undefined) {
    patch.specialization = parseEnum(requireString(body, "specialization"), masterSpecializations, "specialization");
  }
  if (body.experience !== undefined) patch.experience = requireNumber(body, "experience", "опыт");
  if (body.rating !== undefined) patch.rating = requireNumber(body, "rating", "рейтинг");
  if (body.available !== undefined) patch.available = parseBoolean(body.available, true);
  if (body.bio !== undefined) patch.bio = requireString(body, "bio", "описание");
  return patch;
};

export const parseCreateAppointment = (body: Record<string, unknown>): CreateAppointmentInput => ({
  clientName: requireString(body, "clientName", "имя клиента"),
  clientPhone: requireString(body, "clientPhone", "телефон"),
  clientEmail: requireString(body, "clientEmail", "email"),
  serviceId: requireString(body, "serviceId", "услуга"),
  masterId: optionalString(body, "masterId") || null,
  date: requireString(body, "date", "дата"),
  timeSlot: requireString(body, "timeSlot", "слот")
});

export const parseAppointmentStatus = (body: Record<string, unknown>) =>
  parseEnum(requireString(body, "status", "статус"), statuses, "status");

export const parseRole = (body: Record<string, unknown>) =>
  parseEnum(requireString(body, "role", "роль"), roles, "role");
