import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Dispositivo suscripto, con lo necesario para mandarle un push. */
export type PushTarget = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  origin: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  origin: string;
};

const SUBSCRIPTION_COLUMNS = "id, user_id, endpoint, p256dh, auth, origin";

function mapTarget(row: SubscriptionRow): PushTarget {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    origin: row.origin,
  };
}

/** Alta o reasignación: si el celu ya estaba suscripto con otra cuenta, el endpoint pasa a esta. */
export async function upsertPushSubscription(
  admin: SupabaseClient,
  input: { userId: string; endpoint: string; p256dh: string; auth: string; origin: string; userAgent: string | null },
) {
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      origin: input.origin,
      user_agent: input.userAgent,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    throw new Error("No se pudo guardar la suscripción.");
  }
}

/** Crea las preferencias por defecto la primera vez que el usuario activa los avisos. */
export async function ensureNotificationPreferences(admin: SupabaseClient, userId: string) {
  const { error } = await admin
    .from("notification_preferences")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

  if (error) {
    throw new Error("No se pudieron crear las preferencias de avisos.");
  }
}

export async function findUserPushTarget(admin: SupabaseClient, userId: string, endpoint: string) {
  const { data, error } = await admin
    .from("push_subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapTarget(data as SubscriptionRow);
}

export async function listPushTargetsForUsers(admin: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await admin.from("push_subscriptions").select(SUBSCRIPTION_COLUMNS).in("user_id", userIds);

  if (error) {
    throw new Error("No se pudieron leer las suscripciones.");
  }

  return (data as SubscriptionRow[]).map(mapTarget);
}

export async function deleteUserPushSubscription(admin: SupabaseClient, userId: string, endpoint: string) {
  await admin.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint);
}

export async function deletePushSubscriptionById(admin: SupabaseClient, id: string) {
  await admin.from("push_subscriptions").delete().eq("id", id);
}

export async function markPushSuccess(admin: SupabaseClient, id: string) {
  await admin.from("push_subscriptions").update({ last_success_at: new Date().toISOString() }).eq("id", id);
}
