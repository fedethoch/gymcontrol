import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();

  return createBrowserClient(env.url, env.publishableKey);
}
