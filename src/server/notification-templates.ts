import { Appointment } from "@/types";

export const WORKSHOP_ADDRESS = "Москва, ул. Покровка, 12";

type AppointmentDetails = {
  appointment: Appointment;
  serviceName: string;
  masterName: string;
  address?: string;
};

const formatAppointmentDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00+03:00`));

const detailsBlock = ({ appointment, serviceName, masterName, address = WORKSHOP_ADDRESS }: AppointmentDetails) =>
  [
    "Детали записи:",
    `Процедура: ${serviceName}`,
    `Дата и время: ${formatAppointmentDate(appointment.date)}, ${appointment.timeSlot}`,
    `Мастер: ${masterName}`,
    `Адрес: ${address}`,
    "",
    "Пожалуйста, приходите за 5–10 минут до назначенного времени."
  ].join("\n");

export const buildWelcomeNotification = () => ({
  title: "Добро пожаловать в WatchLab",
  message: [
    "Здравствуйте!",
    "",
    "Спасибо за регистрацию в WatchLab. Ваш аккаунт успешно создан.",
    "",
    "Теперь вы можете пользоваться личным кабинетом: оформлять заявки на ремонт часов, отслеживать статус обслуживания и получать уведомления о ходе работ.",
    "",
    "Мы бережно относимся к каждому заказу и поможем вернуть вашим часам точность, надежность и аккуратный внешний вид.",
    "",
    "С уважением,",
    "Команда WatchLab"
  ].join("\n")
});

export const buildAppointmentConfirmedNotification = (details: AppointmentDetails) => ({
  title: "Запись на обслуживание создана",
  message: [
    "Вы успешно записались на обслуживание в WatchLab.",
    "",
    detailsBlock(details)
  ].join("\n")
});

export const buildAppointmentDayReminderNotification = (details: AppointmentDetails) => ({
  title: "Напоминание о записи на завтра",
  message: [
    "Напоминаем вам о записи на завтра на обслуживание в WatchLab.",
    "",
    detailsBlock(details)
  ].join("\n")
});

export const buildAppointmentHoursReminderNotification = (details: AppointmentDetails) => ({
  title: "Запись через 2 часа",
  message: [
    "Напоминаем вам о записи на обслуживание через 2 часа в WatchLab.",
    "",
    detailsBlock(details)
  ].join("\n")
});

export const getReminderSchedule = (appointment: Appointment) => {
  const appointmentDate = new Date(`${appointment.date}T${appointment.timeSlot}:00+03:00`);
  return {
    dayBefore: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    twoHoursBefore: new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000).toISOString()
  };
};
