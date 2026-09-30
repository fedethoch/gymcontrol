import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatTimeInAppZone } from "@/app/lib/local-date";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import {
  minutesFromSupplementKind,
  sortHomeSupplements,
  SUPPLEMENT_COLUMNS,
  supplementFromRow,
  type HomeSupplement,
  type Supplement,
  type SupplementPresetKey,
  type SupplementRow,
} from "@/app/lib/supplements";

/** Suplementos guardados del usuario (marcados o no), los propios en el orden en que se crearon. */
export async function listSupplementsForUser(userId: string, client?: SupabaseClient): Promise<Supplement[]> {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data, error } = await supabase
    .from("user_supplements")
    .select(SUPPLEMENT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("No se pudieron leer los suplementos.");
  }

  return ((data ?? []) as SupplementRow[]).map(supplementFromRow);
}

/** "Suplementos de hoy" del home: los marcados, con el tilde de hoy (hora argentina), en el orden de SU-D5. */
export async function getHomeSupplements(userId: string, todayKey: string): Promise<HomeSupplement[]> {
  const supabase = await createSupabaseServerClient();
  const [supplements, intakes] = await Promise.all([
    listSupplementsForUser(userId, supabase),
    supabase.from("supplement_intakes").select("supplement_id, taken_at").eq("user_id", userId).eq("local_date", todayKey),
  ]);
  const takenAt = new Map(
    ((intakes.data ?? []) as Array<{ supplement_id: string; taken_at: string }>).map((row) => [
      row.supplement_id,
      formatTimeInAppZone(new Date(row.taken_at)),
    ]),
  );

  return sortHomeSupplements(
    supplements
      .filter((item): item is Supplement & { id: string } => item.active && item.id !== null)
      .map((item) => ({ id: item.id, name: item.name, time: item.reminderTime, takenAt: takenAt.get(item.id) ?? null })),
  );
}

export type SupplementInput = {
  id: string | null;
  presetKey: SupplementPresetKey | null;
  name: string;
  active: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
};

/** Crea o actualiza un suplemento del usuario (RLS owner-only). Devuelve el id de la fila. */
export async function saveSupplement(userId: string, input: SupplementInput): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const values = {
    active: input.active,
    reminder_enabled: input.reminderEnabled,
    reminder_time: input.reminderTime,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("user_supplements")
      .update(values)
      .eq("id", input.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      throw new Error("No se pudo guardar el suplemento.");
    }

    return data.id as string;
  }

  // Un común sin fila todavía: el upsert por (user_id, preset_key) cubre un doble tap.
  if (input.presetKey) {
    const { data, error } = await supabase
      .from("user_supplements")
      .upsert(
        { user_id: userId, preset_key: input.presetKey, name: input.name, ...values },
        { onConflict: "user_id,preset_key" },
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("No se pudo guardar el suplemento.");
    }

    return data.id as string;
  }

  const { data, error } = await supabase
    .from("user_supplements")
    .insert({ user_id: userId, name: input.name, ...values })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.code === "23505" ? "duplicate" : "No se pudo guardar el suplemento.");
  }

  return data.id as string;
}

export async function countCustomSupplements(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("user_supplements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("preset_key", null);

  return count ?? 0;
}

/** Solo los propios se borran (sus tildes caen en cascada); un común se desmarca. */
export async function deleteCustomSupplement(userId: string, id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("user_supplements")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .is("preset_key", null);

  if (error) {
    throw new Error("No se pudo borrar el suplemento.");
  }
}

/** Tilda o destilda un suplemento en `localDate`. Devuelve la hora del tilde (HH:MM, hora argentina). */
export async function setSupplementIntake(input: {
  userId: string;
  supplementId: string;
  localDate: string;
  taken: boolean;
}): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  if (!input.taken) {
    const { error } = await supabase
      .from("supplement_intakes")
      .delete()
      .eq("supplement_id", input.supplementId)
      .eq("user_id", input.userId)
      .eq("local_date", input.localDate);

    if (error) {
      throw new Error("No se pudo destildar el suplemento.");
    }

    return null;
  }

  // on conflict do nothing: la tabla no tiene grant de update (un tilde no se edita). Si ya estaba, se lee.
  const { data: inserted, error } = await supabase
    .from("supplement_intakes")
    .upsert(
      { supplement_id: input.supplementId, user_id: input.userId, local_date: input.localDate },
      { onConflict: "supplement_id,local_date", ignoreDuplicates: true },
    )
    .select("taken_at");

  if (error) {
    throw new Error("No se pudo tildar el suplemento.");
  }

  let takenAt = (inserted?.[0]?.taken_at as string | undefined) ?? null;

  if (!takenAt) {
    const { data: existing } = await supabase
      .from("supplement_intakes")
      .select("taken_at")
      .eq("supplement_id", input.supplementId)
      .eq("local_date", input.localDate)
      .maybeSingle();
    takenAt = (existing?.taken_at as string | undefined) ?? null;
  }

  if (!takenAt) {
    throw new Error("No se pudo tildar el suplemento.");
  }

  return formatTimeInAppZone(new Date(takenAt));
}

export type SupplementReminderState = {
  supplements: Supplement[];
  takenIds: Set<string>;
  /** Hora (minutos, hora argentina) de la última tanda de hoy; `null` si no salió ninguna. */
  lastSendMinutes: number | null;
};

/** Datos del tick del cron para varios usuarios en 3 consultas (service role). */
export async function listSupplementReminderState(
  admin: SupabaseClient,
  userIds: string[],
  todayKey: string,
): Promise<Map<string, SupplementReminderState>> {
  const state = new Map<string, SupplementReminderState>();

  if (userIds.length === 0) {
    return state;
  }

  const [supplements, intakes, deliveries] = await Promise.all([
    admin
      .from("user_supplements")
      .select(`user_id, ${SUPPLEMENT_COLUMNS}`)
      .in("user_id", userIds)
      .eq("active", true)
      .eq("reminder_enabled", true),
    admin.from("supplement_intakes").select("user_id, supplement_id").in("user_id", userIds).eq("local_date", todayKey),
    admin
      .from("push_deliveries")
      .select("user_id, kind")
      .in("user_id", userIds)
      .eq("local_date", todayKey)
      .like("kind", "supplements%"),
  ]);

  if (supplements.error || intakes.error || deliveries.error) {
    throw new Error("No se pudieron leer los suplementos del tick.");
  }

  for (const row of (supplements.data ?? []) as unknown as Array<SupplementRow & { user_id: string }>) {
    const entry = state.get(row.user_id) ?? { supplements: [], takenIds: new Set(), lastSendMinutes: null };
    entry.supplements.push(supplementFromRow(row));
    state.set(row.user_id, entry);
  }

  for (const row of (intakes.data ?? []) as Array<{ user_id: string; supplement_id: string }>) {
    state.get(row.user_id)?.takenIds.add(row.supplement_id);
  }

  for (const row of (deliveries.data ?? []) as Array<{ user_id: string; kind: string }>) {
    const entry = state.get(row.user_id);
    const minutes = minutesFromSupplementKind(row.kind);

    if (entry && minutes !== null) {
      entry.lastSendMinutes = Math.max(entry.lastSendMinutes ?? -1, minutes);
    }
  }

  return state;
}
