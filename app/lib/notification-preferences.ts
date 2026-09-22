import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  NOTIFICATION_PREFERENCES_COLUMNS,
  preferencesFromRow,
  preferencesToRow,
  type NotificationPreferences,
  type NotificationPreferencesRow,
} from "@/app/lib/notifications";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

/** Preferencias de avisos del usuario (sin fila = valores por defecto). `client`: service role en el cron. */
export async function getNotificationPreferences(
  userId: string,
  client?: SupabaseClient,
): Promise<NotificationPreferences> {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data } = await supabase
    .from("notification_preferences")
    .select(NOTIFICATION_PREFERENCES_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  return preferencesFromRow((data as NotificationPreferencesRow | null) ?? null);
}

export async function saveNotificationPreferences(userId: string, prefs: NotificationPreferences) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, ...preferencesToRow(prefs) }, { onConflict: "user_id" });

  if (error) {
    throw new Error("No se pudieron guardar los avisos.");
  }
}
