// Avisos push (DESIGN.md §6.4): preferencias, cuándo toca cada recordatorio y qué dice cada aviso.
// Sin imports a propósito: se testea con `node --test`. El envío vive en app/lib/push/ (server-only).

export const MEAL_REMINDER_TYPES = ["desayuno", "almuerzo", "merienda", "cena"] as const;

export type MealReminderType = (typeof MEAL_REMINDER_TYPES)[number];
export type ReminderKind = "training" | `meal_${MealReminderType}` | "weekly";
export type PushKind = ReminderKind | "rest_end";

export type ReminderSetting = { enabled: boolean; time: string };

export type NotificationPreferences = {
  training: ReminderSetting;
  meals: Record<MealReminderType, ReminderSetting>;
  /** `isoDay`: 1 = lunes … 7 = domingo. */
  weekly: ReminderSetting & { isoDay: number };
  restEnd: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  training: { enabled: true, time: "09:00" },
  meals: {
    desayuno: { enabled: true, time: "08:00" },
    almuerzo: { enabled: true, time: "12:30" },
    merienda: { enabled: true, time: "17:30" },
    cena: { enabled: true, time: "21:00" },
  },
  weekly: { enabled: true, isoDay: 7, time: "20:00" },
  restEnd: true,
};

/** Fila de `notification_preferences`. Postgres devuelve `time` como HH:MM:SS. */
export type NotificationPreferencesRow = {
  training_enabled: boolean;
  training_time: string;
  meal_desayuno_enabled: boolean;
  meal_desayuno_time: string;
  meal_almuerzo_enabled: boolean;
  meal_almuerzo_time: string;
  meal_merienda_enabled: boolean;
  meal_merienda_time: string;
  meal_cena_enabled: boolean;
  meal_cena_time: string;
  weekly_enabled: boolean;
  weekly_iso_day: number;
  weekly_time: string;
  rest_end_enabled: boolean;
};

export const NOTIFICATION_PREFERENCES_COLUMNS = [
  "training_enabled",
  "training_time",
  ...MEAL_REMINDER_TYPES.flatMap((type) => [`meal_${type}_enabled`, `meal_${type}_time`]),
  "weekly_enabled",
  "weekly_iso_day",
  "weekly_time",
  "rest_end_enabled",
].join(", ");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;

/** "9:05" o "09:05:00" → "09:05". Si no es una hora válida devuelve `fallback`. */
export function normalizeTime(value: string | null | undefined, fallback: string): string {
  const match = TIME_PATTERN.exec((value ?? "").trim().padStart(5, "0"));

  return match ? `${match[1]}:${match[2]}` : fallback;
}

/** "14:30" → 870. `null` si no es una hora válida. */
export function parseTimeToMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time);

  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function isValidIsoDay(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

export function preferencesFromRow(row: NotificationPreferencesRow | null): NotificationPreferences {
  if (!row) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const defaults = DEFAULT_NOTIFICATION_PREFERENCES;
  const meals = Object.fromEntries(
    MEAL_REMINDER_TYPES.map((type) => [
      type,
      {
        enabled: row[`meal_${type}_enabled`],
        time: normalizeTime(row[`meal_${type}_time`], defaults.meals[type].time),
      },
    ]),
  ) as Record<MealReminderType, ReminderSetting>;

  return {
    training: { enabled: row.training_enabled, time: normalizeTime(row.training_time, defaults.training.time) },
    meals,
    weekly: {
      enabled: row.weekly_enabled,
      isoDay: isValidIsoDay(row.weekly_iso_day) ? row.weekly_iso_day : defaults.weekly.isoDay,
      time: normalizeTime(row.weekly_time, defaults.weekly.time),
    },
    restEnd: row.rest_end_enabled,
  };
}

export function preferencesToRow(prefs: NotificationPreferences): NotificationPreferencesRow {
  return {
    training_enabled: prefs.training.enabled,
    training_time: prefs.training.time,
    meal_desayuno_enabled: prefs.meals.desayuno.enabled,
    meal_desayuno_time: prefs.meals.desayuno.time,
    meal_almuerzo_enabled: prefs.meals.almuerzo.enabled,
    meal_almuerzo_time: prefs.meals.almuerzo.time,
    meal_merienda_enabled: prefs.meals.merienda.enabled,
    meal_merienda_time: prefs.meals.merienda.time,
    meal_cena_enabled: prefs.meals.cena.enabled,
    meal_cena_time: prefs.meals.cena.time,
    weekly_enabled: prefs.weekly.enabled,
    weekly_iso_day: prefs.weekly.isoDay,
    weekly_time: prefs.weekly.time,
    rest_end_enabled: prefs.restEnd,
  };
}

/** Un recordatorio sale en el primer tick del cron (cada 5 min) dentro de esta ventana desde su hora. */
export const REMINDER_WINDOW_MINUTES = 30;

function isInWindow(setting: ReminderSetting, minutes: number) {
  const start = parseTimeToMinutes(setting.time);

  return (
    setting.enabled && start !== null && minutes >= start && minutes < Math.min(start + REMINDER_WINDOW_MINUTES, 1440)
  );
}

/** Recordatorios cuya hora ya llegó (hora argentina). La condición de cada uno se evalúa después. */
export function dueReminders(
  prefs: NotificationPreferences,
  local: { minutes: number; isoDay: number },
): ReminderKind[] {
  const due: ReminderKind[] = [];

  if (isInWindow(prefs.training, local.minutes)) {
    due.push("training");
  }

  for (const type of MEAL_REMINDER_TYPES) {
    if (isInWindow(prefs.meals[type], local.minutes)) {
      due.push(`meal_${type}`);
    }
  }

  if (prefs.weekly.isoDay === local.isoDay && isInWindow(prefs.weekly, local.minutes)) {
    due.push("weekly");
  }

  return due;
}

export type PushMessage = { title: string; body: string };

const MEAL_COPY: Record<MealReminderType, { title: string; noun: string }> = {
  desayuno: { title: "¿Qué desayunaste?", noun: "el desayuno" },
  almuerzo: { title: "¿Qué almorzaste?", noun: "el almuerzo" },
  merienda: { title: "¿Qué merendaste?", noun: "la merienda" },
  cena: { title: "¿Qué cenaste?", noun: "la cena" },
};

export function mealReminderMessage(type: MealReminderType): PushMessage {
  return { title: MEAL_COPY[type].title, body: `Registrá ${MEAL_COPY[type].noun} para no perder el hilo del día.` };
}

export function trainingReminderMessage(day: { dayOrder: number; dayCount: number; label: string }): PushMessage {
  return { title: "Hoy toca entrenar", body: `Día ${day.dayOrder} de ${day.dayCount} · ${day.label}` };
}

export type WeeklySummary = {
  /** `planned` null: la rutina no tiene días fijos (más de 7 días o sin elegir). */
  training: { done: number; planned: number | null } | null;
  nutrition: { loggedDays: number; onTargetDays: number } | null;
};

export function weeklySummaryMessage(summary: WeeklySummary): PushMessage | null {
  const parts: string[] = [];

  if (summary.training) {
    const { done, planned } = summary.training;
    parts.push(planned ? `${done} de ${planned} entrenos` : `${done} ${done === 1 ? "entreno" : "entrenos"}`);
  }

  if (summary.nutrition) {
    const { loggedDays, onTargetDays } = summary.nutrition;
    parts.push(`${loggedDays} ${loggedDays === 1 ? "día registrado" : "días registrados"}`);
    parts.push(`${onTargetDays} en objetivo`);
  }

  return parts.length > 0 ? { title: "Tus últimos 7 días", body: parts.join(" · ") } : null;
}

export function restEndMessage(next: string | null): PushMessage {
  return { title: "Descanso terminado", body: next ?? "Seguí con la próxima serie." };
}

export const PUSH_PAYLOAD_VERSION = 1;

/** Lo que recibe el service worker (`public/sw.js`). */
export type PushPayload = {
  v: typeof PUSH_PAYLOAD_VERSION;
  kind: PushKind;
  title: string;
  body: string;
  url: string;
  tag: string;
  /** Aviso de fin de descanso: identifica el descanso para medir la demora. */
  token?: string;
  /** Aviso de fin de descanso: fin del timer en ms epoch (reloj del celu). */
  endsAt?: number;
};

export type PushDelivery = { ttl: number; urgency: "normal" | "high"; topic: string };

export function pushTag(kind: PushKind): string {
  if (kind.startsWith("meal_")) {
    return kind.replace("_", "-");
  }

  return kind === "rest_end" ? "rest-end" : kind;
}

/** TTL (segundos), urgencia y topic (el push service reemplaza lo no entregado con el mismo topic). */
export function pushDelivery(kind: PushKind): PushDelivery {
  switch (kind) {
    case "rest_end":
      return { ttl: 60, urgency: "high", topic: "rest" };
    case "training":
      return { ttl: 2 * 60 * 60, urgency: "normal", topic: "training" };
    case "weekly":
      return { ttl: 12 * 60 * 60, urgency: "normal", topic: "weekly" };
    default:
      return { ttl: 60 * 60, urgency: "normal", topic: pushTag(kind) };
  }
}

/** Marca de los links de un aviso: `PwaRuntime` no los manda a "/" al abrir la app en frío. */
export const NOTIFICATION_LINK_PARAM = "origen";
export const NOTIFICATION_LINK_VALUE = "aviso";

export function withNotificationOrigin(origin: string, path: string): string {
  const url = new URL(path, origin);
  url.searchParams.set(NOTIFICATION_LINK_PARAM, NOTIFICATION_LINK_VALUE);

  return url.toString();
}

function clampText(value: string, max: number) {
  const text = value.trim();

  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function buildPushPayload(input: {
  kind: PushKind;
  message: PushMessage;
  origin: string;
  path: string;
  token?: string;
  endsAt?: number;
}): PushPayload {
  return {
    v: PUSH_PAYLOAD_VERSION,
    kind: input.kind,
    title: clampText(input.message.title, 60),
    body: clampText(input.message.body, 160),
    url: withNotificationOrigin(input.origin, input.path),
    tag: pushTag(input.kind),
    ...(input.token ? { token: input.token } : {}),
    ...(input.endsAt ? { endsAt: input.endsAt } : {}),
  };
}

const PUSH_SERVICE_HOSTS = ["fcm.googleapis.com"];
const PUSH_SERVICE_SUFFIXES = [".push.apple.com", ".push.services.mozilla.com", ".notify.windows.com"];

/** Solo endpoints https de los push services conocidos: el server les hace POST (evita SSRF). */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;

  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" || url.port !== "" || url.username !== "" || url.password !== "") {
    return false;
  }

  const host = url.hostname.toLowerCase();

  return PUSH_SERVICE_HOSTS.includes(host) || PUSH_SERVICE_SUFFIXES.some((suffix) => host.endsWith(suffix));
}
