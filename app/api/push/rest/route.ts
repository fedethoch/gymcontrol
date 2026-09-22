import { after } from "next/server";
import { z } from "zod";

import { getOptionalAuthContext } from "@/app/lib/auth";
import { getNotificationPreferences } from "@/app/lib/notification-preferences";
import { buildPushPayload, restEndMessage } from "@/app/lib/notifications";
import { pushFail, pushJson, pushNoContent, readJson, resolveRequestOrigin } from "@/app/lib/push/http";
import { cancelRestPush, claimOwnRestPush, deliverRestPush, scheduleRestPush } from "@/app/lib/push/rest";
import { findUserPushTarget } from "@/app/lib/push/store";
import { isSchedulableSendAt, REST_PUSH_CLAIM_WINDOW_MS, resolveSendAt } from "@/app/lib/rest-push";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";

export const maxDuration = 60;

const scheduleSchema = z.object({
  endpoint: z.string().url().max(1024),
  endsAt: z.number().int().positive(),
  sentAt: z.number().int().positive(),
  savedRoutineId: z.uuid(),
  dayOrder: z.number().int().min(1).max(60),
  next: z.string().trim().min(1).max(80),
});

const cancelSchema = z.object({ token: z.uuid().optional() }).nullable();

/**
 * Aviso de fin del descanso (DESIGN.md §6.4 y §11.3): lo programa la pantalla del entreno al arrancar el
 * timer y en cada +15 s. Sale solo al celu que lo pidió, lo manda el cron de Supabase (cada 5 s).
 */
export async function POST(request: Request) {
  const receivedAt = Date.now();

  if (!resolveRequestOrigin(request)) {
    return pushFail("forbidden_origin", 403);
  }

  const auth = await getOptionalAuthContext();

  if (!auth) {
    return pushFail("unauthenticated", 401);
  }

  const parsed = scheduleSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return pushFail("invalid_payload", 400);
  }

  const input = parsed.data;
  const sendAt = resolveSendAt({ endsAt: input.endsAt, sentAt: input.sentAt, receivedAt });

  if (!isSchedulableSendAt(sendAt, receivedAt)) {
    return pushFail("invalid_window", 400);
  }

  const prefs = await getNotificationPreferences(auth.user.id);

  if (!prefs.restEnd) {
    return pushFail("disabled", 409);
  }

  const admin = createSupabaseAdminClient();
  const target = await findUserPushTarget(admin, auth.user.id, input.endpoint);

  if (!target) {
    return pushFail("no_subscription", 404);
  }

  const token = crypto.randomUUID();
  const payload = buildPushPayload({
    kind: "rest_end",
    message: restEndMessage(input.next),
    origin: target.origin,
    path: `/rutinas/dia?savedRoutineId=${input.savedRoutineId}&day=${input.dayOrder}`,
    token,
    endsAt: input.endsAt,
  });

  try {
    await scheduleRestPush(admin, { userId: auth.user.id, subscriptionId: target.id, token, sendAt, payload });
  } catch {
    return pushFail("store_failed", 500);
  }

  // Descanso corto: vence antes de que el cron lo vea con margen, lo manda este mismo pedido.
  if (sendAt - Date.now() <= REST_PUSH_CLAIM_WINDOW_MS && (await claimOwnRestPush(admin, auth.user.id, token))) {
    after(() => deliverRestPush(admin, { userId: auth.user.id, token, sendAt, payload, target }));
  }

  return pushJson({ token, sendAt }, 202);
}

export async function DELETE(request: Request) {
  if (!resolveRequestOrigin(request)) {
    return pushFail("forbidden_origin", 403);
  }

  const auth = await getOptionalAuthContext();

  if (!auth) {
    return pushFail("unauthenticated", 401);
  }

  const parsed = cancelSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return pushFail("invalid_payload", 400);
  }

  await cancelRestPush(createSupabaseAdminClient(), auth.user.id, parsed.data?.token ?? null);

  return pushNoContent();
}
