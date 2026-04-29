export const WORK_START_HOUR = 10;
export const WORK_END_HOUR = 19;
export const SLOT_STEP_MINUTES = 60;

const toTime = (hours: number, minutes: number) =>
  `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

export const getWorkshopSlots = () => {
  const slots: string[] = [];
  for (let minutes = WORK_START_HOUR * 60; minutes < WORK_END_HOUR * 60; minutes += SLOT_STEP_MINUTES) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(toTime(hour, minute));
  }
  return slots;
};

export const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
