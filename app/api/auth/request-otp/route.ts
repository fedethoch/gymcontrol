import { NextResponse } from "next/server";

import { isValidEmail, normalizeEmail } from "@/app/lib/auth-input";
import { consumeOtpRequestRateLimit, getRequestIp } from "@/app/lib/otp-rate-limit";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

function json(body: Record<string, string>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isSupabaseRateLimitError(error: { status?: number; message?: string } | null) {
  if (!error) {
    return false;
  }

  return error.status === 429 || /rate limit/i.test(error.message ?? "");
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const rawEmail = typeof payload?.email === "string" ? payload.email : "";
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return json({ error: "missing-email" }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ error: "invalid-email" }, 400);
  }

  const ip = getRequestIp(request);
  const rateLimitResult = consumeOtpRequestRateLimit(email, ip);

  if (!rateLimitResult.ok) {
    return json({ error: "otp-rate-limited" }, 429);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (isSupabaseRateLimitError(error)) {
    return json({ error: "otp-rate-limited" }, 429);
  }

  if (error) {
    return json({ error: "otp-request-failed" }, 500);
  }

  return json(
    {
      status: "otp_sent",
      email,
    },
    200,
  );
}
