import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/auth/login?status=signed-out", requestUrl.origin));
}
