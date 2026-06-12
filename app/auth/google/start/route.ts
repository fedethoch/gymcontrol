import { NextResponse } from "next/server";

import { getRequestOrigin } from "@/app/lib/request";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

function redirectToLogin(origin: string, error: string) {
  return NextResponse.redirect(
    new URL(`/auth/login?error=${error}`, origin),
    303
  );
}

export async function POST() {
  const origin = await getRequestOrigin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return redirectToLogin(origin, "google-provider-failed");
  }

  return NextResponse.redirect(data.url, 303);
}