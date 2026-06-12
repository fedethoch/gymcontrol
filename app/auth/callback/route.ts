import { NextResponse } from "next/server";

import { resolvePostLoginRedirectForUserId } from "@/app/lib/auth";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

function redirectToLogin(origin: string, error: string) {
  return NextResponse.redirect(new URL(`/auth/login?error=${error}`, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");

  if (providerError) {
    return redirectToLogin(
      requestUrl.origin,
      providerError === "access_denied" ? "google-oauth-cancelled" : "google-oauth-failed",
    );
  }

  if (!code) {
    return redirectToLogin(requestUrl.origin, "google-oauth-failed");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(requestUrl.origin, "google-oauth-failed");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(requestUrl.origin, "missing-user");
  }

  const redirectTo = await resolvePostLoginRedirectForUserId(supabase, user.id);

  if (!redirectTo) {
    return redirectToLogin(requestUrl.origin, "missing-profile");
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
