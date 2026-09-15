/**
 * Fechas de calendario de la app (YYYY-MM-DD) en hora argentina.
 * El servidor (Vercel) corre en UTC: usar `new Date()` + getters locales corre el día a partir de las 21:00 ART.
 */
export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Hoy (o `now`) como YYYY-MM-DD en la zona horaria de la app. */
export function getTodayDateKey(now: Date = new Date()): string {
  return DATE_KEY_FORMATTER.format(now);
}

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Suma días a una fecha YYYY-MM-DD (aritmética de calendario, sin depender del TZ). */
export function addDaysToDateKey(key: string, amount: number): string {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

/** 0 = lunes … 6 = domingo. */
export function getMondayFirstWeekdayIndex(key: string): number {
  const [year, month, day] = key.split("-").map(Number);

  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** Lunes de la semana de `key`. */
export function getWeekStartDateKey(key: string): string {
  return addDaysToDateKey(key, -getMondayFirstWeekdayIndex(key));
}
