export const WEEK_DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const;

const WEEK_DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export type WeekDay = {
  key: string;
  label: (typeof WEEK_DAY_LABELS)[number];
  name: (typeof WEEK_DAY_NAMES)[number];
  isToday: boolean;
  isFuture: boolean;
};

export function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Días lunes → domingo de la semana en curso (hora local, igual que getCurrentWeekRange). */
export function getCurrentWeekDays(now = new Date()): WeekDay[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateOnly(today);
  const dayOfWeek = today.getDay(); // 0 = domingo
  const monday = new Date(today);
  monday.setDate(today.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));

  return WEEK_DAY_LABELS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = formatDateOnly(date);
    return { key, label, name: WEEK_DAY_NAMES[index], isToday: key === todayKey, isFuture: key > todayKey };
  });
}

/** Cuántas fechas del set caen entre el lunes de esta semana y hoy. */
export function countDatesThisWeek(dates: Set<string>, now = new Date()) {
  return getCurrentWeekDays(now).filter((day) => !day.isFuture && dates.has(day.key)).length;
}
