import "server-only";

import { getTodayDateKey } from "@/app/lib/local-date";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import { isValidSet } from "@/app/lib/workout-progression";
import {
  WORKOUT_SYNC_VERSION,
  type ExerciseKind,
  type SyncItem,
  type SyncItemResult,
  type SyncRequest,
  type SyncResponse,
  type SyncSession,
  type SyncSessionResult,
  type WorkoutSet,
} from "@/app/lib/workout-sync-contract";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type PostgrestErrorLike = { code?: string; message: string };

/**
 * Aplica la cola del cliente (contrato v1). Por item: insert del esqueleto idempotente,
 * update solo si la versión es más nueva y, si no afectó filas, relectura para responder
 * `ok` (misma versión), `stale` (el servidor tiene una más nueva) o `error` (fila inaccesible).
 */
export async function applyWorkoutSync(userId: string, request: SyncRequest): Promise<SyncResponse> {
  const supabase = await createSupabaseServerClient();
  const sessions: SyncSessionResult[] = [];

  for (const session of request.sessions) {
    sessions.push(await syncSession(supabase, userId, session));
  }

  return { v: WORKOUT_SYNC_VERSION, sessions };
}

async function syncSession(
  supabase: SupabaseServerClient,
  userId: string,
  session: SyncSession,
): Promise<SyncSessionResult> {
  const { error: insertError } = await supabase.from("workout_sessions").upsert(
    {
      id: session.id,
      user_id: userId,
      saved_routine_id: session.savedRoutineId,
      routine_day_id: session.routineDayId,
      training_date: getTodayDateKey(),
      status: "in_progress",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (insertError) {
    return { id: session.id, status: "error", message: describeError(insertError), items: [] };
  }

  const { data: stored, error: readError } = await supabase
    .from("workout_sessions")
    .select("id, saved_routine_id, status")
    .eq("id", session.id)
    .maybeSingle();

  if (readError || !stored) {
    return { id: session.id, status: "error", message: "No se encontró el entrenamiento.", items: [] };
  }

  if (stored.saved_routine_id && stored.saved_routine_id !== session.savedRoutineId) {
    return {
      id: session.id,
      status: "error",
      message: "El entrenamiento pertenece a otra rutina.",
      items: [],
    };
  }

  const items: SyncItemResult[] = [];

  for (const item of session.items) {
    items.push(await syncItem(supabase, session.id, item));
  }

  if (session.finished && stored.status !== "completed") {
    const { error: finishError } = await supabase
      .from("workout_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", session.id)
      .neq("status", "completed");

    if (finishError) {
      return { id: session.id, status: "error", message: describeError(finishError), items };
    }
  }

  return { id: session.id, status: "ok", items };
}

async function syncItem(
  supabase: SupabaseServerClient,
  sessionId: string,
  item: SyncItem,
): Promise<SyncItemResult> {
  let itemId = item.id;

  const { error: insertError } = await supabase.from("workout_session_items").upsert(
    {
      id: item.id,
      workout_session_id: sessionId,
      routine_item_id: item.routineItemId,
      kind: item.kind,
      target_snapshot: item.target,
      sets: [],
      sets_rev: 0,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (insertError) {
    if (insertError.code !== "23505") {
      return { clientId: item.id, status: "error", message: describeError(insertError) };
    }

    // Otra pestaña o dispositivo ya registró este ejercicio en la sesión: se adopta su id.
    const { data: existing } = await supabase
      .from("workout_session_items")
      .select("id")
      .eq("workout_session_id", sessionId)
      .eq("routine_item_id", item.routineItemId)
      .maybeSingle();

    if (!existing) {
      return { clientId: item.id, status: "error", message: "No se pudo guardar el ejercicio." };
    }

    itemId = existing.id;
  }

  const { data: updated, error: updateError } = await supabase
    .from("workout_session_items")
    .update({
      sets: item.sets,
      sets_rev: item.rev,
      kind: item.kind,
      target_snapshot: item.target,
      ...deriveLegacyColumns(item.sets, item.kind),
    })
    .eq("id", itemId)
    .lt("sets_rev", item.rev)
    .select("id");

  if (updateError) {
    return { clientId: item.id, status: "error", message: describeError(updateError) };
  }

  if (updated && updated.length > 0) {
    return { clientId: item.id, id: itemId, status: "ok", rev: item.rev };
  }

  // 0 filas: o ya estaba esta versión, o hay una más nueva, o la fila no es accesible.
  const { data: current } = await supabase
    .from("workout_session_items")
    .select("id, sets, sets_rev")
    .eq("id", itemId)
    .maybeSingle();

  if (!current) {
    return { clientId: item.id, status: "error", message: "No se pudo guardar el ejercicio." };
  }

  const currentRev = Number(current.sets_rev);

  if (currentRev === item.rev) {
    return { clientId: item.id, id: itemId, status: "ok", rev: currentRev };
  }

  return {
    clientId: item.id,
    id: itemId,
    status: "stale",
    rev: currentRev,
    sets: (current.sets ?? []) as WorkoutSet[],
  };
}

/** Columnas del registro anterior, mientras siga deployado código que las lee. */
function deriveLegacyColumns(sets: WorkoutSet[], kind: ExerciseKind) {
  const valid = sets.filter(isValidSet);
  const values = valid.map((set) => (kind === "time" ? set.secs : set.reps));
  const weights = valid.map((set) => set.kg).filter((kg): kg is number => kg != null && kg > 0);

  return {
    performed_reps: values.length > 0 ? values.join("/") : null,
    used_weight: weights.length > 0 ? weights.join("/") : null,
    is_completed: sets.length > 0 && sets.every((set) => set.done),
  };
}

function describeError(error: PostgrestErrorLike) {
  if (error.code === "42501") {
    return "No tenés permiso para guardar en esta rutina.";
  }

  if (error.code === "23503") {
    return "La rutina cambió y este ejercicio ya no existe.";
  }

  return "No se pudo guardar. Se va a reintentar.";
}
