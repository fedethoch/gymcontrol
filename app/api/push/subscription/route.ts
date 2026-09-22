import { z } from "zod";

import { getOptionalAuthContext } from "@/app/lib/auth";
import { isAllowedPushEndpoint } from "@/app/lib/notifications";
import { pushFail, pushJson, pushNoContent, readJson, resolveRequestOrigin } from "@/app/lib/push/http";
import {
  deleteUserPushSubscription,
  ensureNotificationPreferences,
  upsertPushSubscription,
} from "@/app/lib/push/store";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";

const endpointSchema = z.string().url().max(1024);

const subscribeSchema = z.object({
  endpoint: endpointSchema,
  keys: z.object({
    p256dh: z.string().min(80).max(100),
    auth: z.string().min(16).max(32),
  }),
  userAgent: z.string().max(400).optional(),
});

const unsubscribeSchema = z.object({ endpoint: endpointSchema });

/**
 * Suscripción de este dispositivo a los avisos push. Route handler y no server action:
 * lo llama también `PushRuntime` en cualquier página y tiene que sobrevivir a los deploys.
 */
export async function POST(request: Request) {
  const origin = resolveRequestOrigin(request);

  if (!origin) {
    return pushFail("forbidden_origin", 403);
  }

  const auth = await getOptionalAuthContext();

  if (!auth) {
    return pushFail("unauthenticated", 401);
  }

  const parsed = subscribeSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return pushFail("invalid_payload", 400);
  }

  if (!isAllowedPushEndpoint(parsed.data.endpoint)) {
    return pushFail("endpoint_not_allowed", 400);
  }

  const admin = createSupabaseAdminClient();

  try {
    await upsertPushSubscription(admin, {
      userId: auth.user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      origin,
      userAgent: parsed.data.userAgent ?? null,
    });
    await ensureNotificationPreferences(admin, auth.user.id);
  } catch {
    return pushFail("store_failed", 500);
  }

  return pushJson({ ok: true });
}

export async function DELETE(request: Request) {
  if (!resolveRequestOrigin(request)) {
    return pushFail("forbidden_origin", 403);
  }

  const auth = await getOptionalAuthContext();

  if (!auth) {
    return pushFail("unauthenticated", 401);
  }

  const parsed = unsubscribeSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return pushFail("invalid_payload", 400);
  }

  await deleteUserPushSubscription(createSupabaseAdminClient(), auth.user.id, parsed.data.endpoint);

  return pushNoContent();
}
