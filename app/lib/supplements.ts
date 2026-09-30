// Suplementos (DESIGN.md §6.4, §10.1, §15.2 S8): los comunes, el orden del home y cuándo sale el aviso agrupado.
// Puro: se testea con `node --test`. Datos en app/lib/supplements-store.ts (docs/DATABASE.md "Suplementos").

import { normalizeTime, parseTimeToMinutes, REMINDER_WINDOW_MINUTES, type PushMessage } from "@/app/lib/notifications";

export const SUPPLEMENT_PRESETS = [
  { key: "creatina", name: "Creatina" },
  { key: "proteina", name: "Proteína en polvo" },
  { key: "multivitaminico", name: "Multivitamínico" },
  { key: "omega_3", name: "Omega 3" },
  { key: "vitamina_d", name: "Vitamina D" },
  { key: "magnesio", name: "Magnesio" },
  { key: "cafeina", name: "Cafeína" },
  { key: "colageno", name: "Colágeno" },
  { key: "zinc", name: "Zinc" },
  { key: "vitamina_c", name: "Vitamina C" },
] as const;

export type SupplementPresetKey = (typeof SUPPLEMENT_PRESETS)[number]["key"];

export const DEFAULT_SUPPLEMENT_TIME = "09:00";
export const SUPPLEMENT_NAME_MAX_LENGTH = 40;
export const MAX_CUSTOM_SUPPLEMENTS = 20;
/** Filas a la vista en el home antes de "Ver todos" (SU-D2). */
export const HOME_SUPPLEMENTS_VISIBLE = 3;
/** Después de esta hora (23:00) no hay repeticiones: solo el primer aviso de uno cuya hora es más tarde. */
export const SUPPLEMENT_LAST_REPEAT_MINUTES = 23 * 60;
/** Una tanda nueva sale 1 h después de la anterior; 5 min de tolerancia por el tick del cron. */
export const SUPPLEMENT_REPEAT_MINUTES = 55;
/** Minutos de retraso que se aceptan sobre las 23:00 (el tick de las 23:00 puede correr a las 23:0x). */
const TICK_TOLERANCE_MINUTES = 4;

export type Supplement = {
  /** `null`: un común que el usuario todavía no marcó (no tiene fila). */
  id: string | null;
  presetKey: SupplementPresetKey | null;
  name: string;
  active: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
};

/** Fila de `user_supplements`. Postgres devuelve `time` como HH:MM:SS. */
export type SupplementRow = {
  id: string;
  preset_key: string | null;
  name: string;
  active: boolean;
  reminder_enabled: boolean;
  reminder_time: string;
};

export const SUPPLEMENT_COLUMNS = "id, preset_key, name, active, reminder_enabled, reminder_time";

export function isSupplementPresetKey(value: string | null | undefined): value is SupplementPresetKey {
  return SUPPLEMENT_PRESETS.some((preset) => preset.key === value);
}

export function supplementFromRow(row: SupplementRow): Supplement {
  return {
    id: row.id,
    presetKey: isSupplementPresetKey(row.preset_key) ? row.preset_key : null,
    name: row.name,
    active: row.active,
    reminderEnabled: row.reminder_enabled,
    reminderTime: normalizeTime(row.reminder_time, DEFAULT_SUPPLEMENT_TIME),
  };
}

/** "  Ashwa   gandha " → "Ashwa gandha". */
export function cleanSupplementName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function findPresetByName(name: string) {
  const key = cleanSupplementName(name).toLocaleLowerCase("es");

  return SUPPLEMENT_PRESETS.find((preset) => preset.name.toLocaleLowerCase("es") === key) ?? null;
}

/**
 * Lista del sheet S8 (SU-D1): los comunes en orden fijo (con su fila si existe) y después los propios en el
 * orden en que llegan (`created_at`).
 */
export function mergeWithPresets(saved: Supplement[]): Supplement[] {
  const byPreset = new Map(saved.filter((item) => item.presetKey).map((item) => [item.presetKey, item]));
  const presets = SUPPLEMENT_PRESETS.map(
    (preset) =>
      byPreset.get(preset.key) ?? {
        id: null,
        presetKey: preset.key,
        name: preset.name,
        active: false,
        reminderEnabled: true,
        reminderTime: DEFAULT_SUPPLEMENT_TIME,
      },
  );

  return [...presets, ...saved.filter((item) => !item.presetKey)];
}

export type HomeSupplement = { id: string; name: string; time: string; takenAt: string | null };

function minutesOf(time: string) {
  return parseTimeToMinutes(time) ?? 0;
}

/** "09:20" → 560 (una hora inválida cuenta como 00:00). */
export const parseSupplementTime = minutesOf;

function byTimeThenName(a: { time: string; name: string }, b: { time: string; name: string }) {
  return minutesOf(a.time) - minutesOf(b.time) || a.name.localeCompare(b.name, "es");
}

/** Orden del home al abrir (SU-D5): pendientes por hora y después los tomados. Tildar no reordena. */
export function sortHomeSupplements(items: HomeSupplement[]): HomeSupplement[] {
  const pending = items.filter((item) => !item.takenAt).sort(byTimeThenName);
  const taken = items.filter((item) => item.takenAt).sort(byTimeThenName);

  return [...pending, ...taken];
}

export type SupplementReminderItem = { id: string; name: string; reminderTime: string };

/** Los que el aviso puede reclamar ahora: activos, con aviso, sin tilde hoy y con la hora ya pasada. */
export function pendingSupplements(
  supplements: Array<Pick<Supplement, "id" | "name" | "active" | "reminderEnabled" | "reminderTime">>,
  takenIds: ReadonlySet<string>,
  minutes: number,
): SupplementReminderItem[] {
  return supplements
    .filter(
      (item): item is typeof item & { id: string } =>
        item.id !== null &&
        item.active &&
        item.reminderEnabled &&
        !takenIds.has(item.id) &&
        minutesOf(item.reminderTime) <= minutes,
    )
    .map((item) => ({ id: item.id, name: item.name, reminderTime: item.reminderTime }))
    .sort((a, b) => byTimeThenName({ time: a.reminderTime, name: a.name }, { time: b.reminderTime, name: b.name }));
}

/**
 * ¿Sale una tanda ahora? (una por tick como mucho, con todos los pendientes)
 * - hoy no salió ninguna, o entró un pendiente cuya hora es posterior a la última tanda → sí;
 * - pasaron 55 min desde la última → sí (repetición), hasta las 23:00;
 * - pasadas las 23:00 solo sale el primer aviso de uno cuya hora cae en los últimos 30 min.
 */
export function shouldSendSupplementReminder(input: {
  pending: SupplementReminderItem[];
  lastSendMinutes: number | null;
  minutes: number;
}): boolean {
  const { pending, lastSendMinutes, minutes } = input;

  if (pending.length === 0) {
    return false;
  }

  const canRepeat = minutes <= SUPPLEMENT_LAST_REPEAT_MINUTES + TICK_TOLERANCE_MINUTES;
  const fresh = pending.filter((item) => {
    const start = minutesOf(item.reminderTime);
    const isNew = lastSendMinutes === null || start > lastSendMinutes;

    return isNew && (canRepeat || minutes - start < REMINDER_WINDOW_MINUTES);
  });

  if (fresh.length > 0) {
    return true;
  }

  return canRepeat && lastSendMinutes !== null && minutes - lastSendMinutes >= SUPPLEMENT_REPEAT_MINUTES;
}

/** Clave de la tanda en `push_deliveries.kind`: `supplements_HHMM` con la hora del tick. */
export function supplementDeliveryKind(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;

  return `supplements_${String(hours).padStart(2, "0")}${String(mins).padStart(2, "0")}`;
}

/** `supplements_0920` → 560. `null` si no es una tanda de suplementos. */
export function minutesFromSupplementKind(kind: string): number | null {
  const match = /^supplements_(\d{2})(\d{2})$/.exec(kind);

  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** En una frase: "Creatina" → "creatina", "Vitamina D" → "vitamina D"; una sigla ("ZMA") queda igual. */
function inSentence(name: string) {
  const [first = "", second = ""] = name;

  return second && second === second.toLowerCase() ? first.toLocaleLowerCase("es") + name.slice(1) : name;
}

const SUPPLEMENT_TITLE_MAX_LENGTH = 30;

/** Aviso C1 (SU-D3): "¿Tomaste creatina?", "¿Tomaste creatina y omega 3?" o, si no entra, "Te faltan 3 suplementos". */
export function supplementReminderMessage(names: string[]): PushMessage {
  const count = names.length;
  const listed = count <= 2 ? `¿Tomaste ${names.map(inSentence).join(" y ")}?` : null;

  if (listed && listed.length <= SUPPLEMENT_TITLE_MAX_LENGTH) {
    return { title: listed, body: "" };
  }

  return { title: count === 1 ? "Te falta 1 suplemento" : `Te faltan ${count} suplementos`, body: "" };
}

/** Link del aviso: el home baja a la sección y resalta los pendientes. */
export const SUPPLEMENTS_LINK_PARAM = "suplementos";
export const SUPPLEMENTS_REMINDER_PATH = `/?${SUPPLEMENTS_LINK_PARAM}=hoy`;
