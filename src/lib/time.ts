import { Appointment } from "@/types";

const MOSCOW_OFFSET = "+03:00";

export const getTodayDate = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
};

export const getAppointmentTimeMs = (date: string, timeSlot: string) =>
  new Date(`${date}T${timeSlot}:00${MOSCOW_OFFSET}`).getTime();

export const isAppointmentInFuture = (date: string, timeSlot: string, nowMs = Date.now()) => {
  const appointmentMs = getAppointmentTimeMs(date, timeSlot);
  return Number.isFinite(appointmentMs) && appointmentMs > nowMs;
};

export const isAppointmentPast = (appointment: Pick<Appointment, "date" | "timeSlot">, nowMs = Date.now()) =>
  !isAppointmentInFuture(appointment.date, appointment.timeSlot, nowMs);

export const filterFutureSlots = (date: string, slots: string[], nowMs = Date.now()) =>
  slots.filter((slot) => isAppointmentInFuture(date, slot, nowMs));

export const isFutureInstant = (isoDate: string, nowMs = Date.now()) => {
  const value = new Date(isoDate).getTime();
  return Number.isFinite(value) && value > nowMs;
};
