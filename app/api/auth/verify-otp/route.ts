import { NextResponse } from "next/server";

import {
  isValidEmail,
  isValidOtpToken,
  normalizeEmail,
  normalizeOtpToken,
} from "@/app/lib/auth-input";
import { resolvePostLoginRedirectForUserId } from "@/app/lib/auth";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

function json(body: Record<string, string>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { email?: unknown; token?: unknown }
    | null;
  const rawEmail = typeof payload?.email === "string" ? payload.email : "";
  const rawToken = typeof payload?.token === "string" ? payload.token : "";
  const email = normalizeEmail(rawEmail);
  const token = normalizeOtpToken(rawToken);

  if (!email) {
    return json({ error: "missing-email" }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ error: "invalid-email" }, 400);
  }

  if (!token) {
    return json({ error: "missing-token" }, 400);
  }

  if (!isValidOtpToken(token)) {
    return json({ error: "invalid-token-format" }, 400);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    if ((error.status ?? 500) < 500) {
      return json({ error: "invalid-or-expired-otp" }, 401);
    }

    return json({ error: "otp-verify-failed" }, 500);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ error: "missing-user" }, 500);
  }

  const redirectTo = await resolvePostLoginRedirectForUserId(supabase, user.id);

  if (!redirectTo) {
    return json({ error: "missing-profile" }, 500);
  }

  return json(
    {
      status: "signed-in",
      redirectTo,
    },
    200,
  );
}
