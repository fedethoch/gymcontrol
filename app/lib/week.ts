import { addDaysToDateKey, getTodayDateKey, getWeekStartDateKey } from "@/app/lib/local-date";

export const WEEK_DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const;

const WEEK_DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export type WeekDay = {
  key: string;
  label: (typeof WEEK_DAY_LABELS)[number];
  name: (typeof WEEK_DAY_NAMES)[number];
  isToday: boolean;
  isFuture: boolean;
};

/** Días lunes → domingo de la semana en curso (hora argentina, igual que getCurrentWeekRange). */
export function getCurrentWeekDays(now = new Date()): WeekDay[] {
  const todayKey = getTodayDateKey(now);
  const monday = getWeekStartDateKey(todayKey);

  return WEEK_DAY_LABELS.map((label, index) => {
    const key = addDaysToDateKey(monday, index);
    return { key, label, name: WEEK_DAY_NAMES[index], isToday: key === todayKey, isFuture: key > todayKey };
  });
}

/** Cuántas fechas del set caen entre el lunes de esta semana y hoy. */
export function countDatesThisWeek(dates: Set<string>, now = new Date()) {
  return getCurrentWeekDays(now).filter((day) => !day.isFuture && dates.has(day.key)).length;
}
