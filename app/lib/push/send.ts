import "server-only";

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isAllowedPushEndpoint, pushDelivery, type PushPayload } from "@/app/lib/notifications";
import { getVapidConfig } from "@/app/lib/push/config";
import { deletePushSubscriptionById, markPushSuccess, type PushTarget } from "@/app/lib/push/store";

export type PushSendStatus = "sent" | "gone" | "failed";

function statusCodeOf(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error
    ? Number((error as { statusCode: unknown }).statusCode)
    : null;
}

/**
 * Manda un push a un dispositivo. 404/410 = la suscripción ya no existe en el push service: se borra.
 * Nunca tira: el resultado dice qué pasó.
 */
export async function sendPush(
  admin: SupabaseClient,
  target: Pick<PushTarget, "id" | "endpoint" | "p256dh" | "auth">,
  payload: PushPayload,
): Promise<PushSendStatus> {
  if (!isAllowedPushEndpoint(target.endpoint)) {
    await deletePushSubscriptionById(admin, target.id);
    return "gone";
  }

  const delivery = pushDelivery(payload.kind);

  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      {
        vapidDetails: getVapidConfig(),
        TTL: delivery.ttl,
        urgency: delivery.urgency,
        topic: delivery.topic,
        timeout: 10_000,
      },
    );
  } catch (error) {
    const statusCode = statusCodeOf(error);

    if (statusCode === 404 || statusCode === 410) {
      await deletePushSubscriptionById(admin, target.id);
      return "gone";
    }

    console.error("push: envío fallido", {
      kind: payload.kind,
      statusCode,
      message: error instanceof Error ? error.message : String(error),
    });
    return "failed";
  }

  await markPushSuccess(admin, target.id);
  return "sent";
}
