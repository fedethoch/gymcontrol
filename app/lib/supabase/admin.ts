import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

export function createSupabaseAdminClient() {
  const env = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(env.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
