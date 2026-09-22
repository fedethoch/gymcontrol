import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PushPayload } from "@/app/lib/notifications";
import { sendPush } from "@/app/lib/push/send";
import { REST_PUSH_LEAD_MS, REST_PUSH_MAX_LATE_MS } from "@/app/lib/rest-push";

/** Aviso de fin de descanso reclamado para enviar (una fila de `rest_push_jobs` + su dispositivo). */
export type ClaimedRestPush = {
  userId: string;
  token: string;
  sendAt: number;
  payload: PushPayload;
  target: { id: string; endpoint: string; p256dh: string; auth: string };
};

type ClaimRow = {
  user_id: string;
  token: string;
  send_at: string;
  payload: PushPayload;
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function sleepUntil(timestamp: number) {
  const wait = timestamp - Date.now();

  return wait > 0 ? new Promise((resolve) => setTimeout(resolve, wait)) : Promise.resolve();
}

/** Programa (o reprograma) el aviso del usuario: una fila por usuario, token nuevo en cada descanso. */
export async function scheduleRestPush(
  admin: SupabaseClient,
  input: { userId: string; subscriptionId: string; token: string; sendAt: number; payload: PushPayload },
) {
  const { error } = await admin.from("rest_push_jobs").upsert(
    {
      user_id: input.userId,
      subscription_id: input.subscriptionId,
      token: input.token,
      send_at: new Date(input.sendAt).toISOString(),
      payload: input.payload,
      claimed_at: null,
      sent_at: null,
      cancelled_at: null,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error("No se pudo programar el aviso del descanso.");
  }
}

/** Cancela el aviso pendiente (Saltar, fin del entreno). Con `token`, solo si sigue siendo ese descanso. */
export async function cancelRestPush(admin: SupabaseClient, userId: string, token: string | null) {
  let query = admin
    .from("rest_push_jobs")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("sent_at", null);

  if (token) {
    query = query.eq("token", token);
  }

  await query;
}

/** Descanso corto (vence dentro de la ventana del cron): lo reclama el mismo pedido que lo programó. */
export async function claimOwnRestPush(admin: SupabaseClient, userId: string, token: string) {
  const { data } = await admin
    .from("rest_push_jobs")
    .update({ claimed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("token", token)
    .is("claimed_at", null)
    .select("user_id");

  return (data?.length ?? 0) > 0;
}

export async function claimDueRestPushes(admin: SupabaseClient): Promise<ClaimedRestPush[]> {
  const { data, error } = await admin.rpc("claim_due_rest_pushes");

  if (error) {
    throw new Error("No se pudieron reclamar los avisos de descanso.");
  }

  return (data as ClaimRow[]).map((row) => ({
    userId: row.user_id,
    token: row.token,
    sendAt: new Date(row.send_at).getTime(),
    payload: row.payload,
    target: { id: row.subscription_id, endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
  }));
}

/**
 * Espera al fin del descanso y manda el aviso. Marca `sent_at` antes de mandar (a lo sumo una vez):
 * si el descanso se canceló o se reemplazó mientras esperaba, no sale.
 */
export async function deliverRestPush(admin: SupabaseClient, job: ClaimedRestPush) {
  await sleepUntil(job.sendAt - 400);

  const { data } = await admin
    .from("rest_push_jobs")
    .update({ sent_at: new Date().toISOString() })
    .eq("user_id", job.userId)
    .eq("token", job.token)
    .is("sent_at", null)
    .is("cancelled_at", null)
    .select("user_id");

  if (!data?.length) {
    return "cancelled" as const;
  }

  if (Date.now() - job.sendAt > REST_PUSH_MAX_LATE_MS) {
    return "expired" as const;
  }

  await sleepUntil(job.sendAt - REST_PUSH_LEAD_MS);
  return sendPush(admin, job.target, job.payload);
}

export async function recordRestPushDelta(admin: SupabaseClient, token: string, deltaMs: number) {
  await admin.rpc("record_rest_push_delta", { job_token: token, delta_ms: deltaMs });
}
