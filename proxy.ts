import type { NextRequest } from "next/server";

import { updateSession } from "@/app/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // api/push/cron: lo llama el cron de Supabase sin sesión, no hay cookies que refrescar.
    "/((?!_next/static|_next/image|favicon.ico|api/push/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
