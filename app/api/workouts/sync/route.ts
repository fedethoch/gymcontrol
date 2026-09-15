import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getOptionalAuthContext } from "@/app/lib/auth";
import { applyWorkoutSync } from "@/app/lib/workout-sync";
import { syncRequestSchema, type SyncErrorCode } from "@/app/lib/workout-sync-contract";

function fail(error: SyncErrorCode, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Endpoint estable de la cola de entrenamiento. Route handler y no server action:
 * los IDs de las server actions cambian en cada build y la cola sobrevive a los deploys.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (origin && host && new URL(origin).host !== host) {
    return fail("forbidden_origin", 403);
  }

  const auth = await getOptionalAuthContext();

  if (!auth) {
    return fail("unauthenticated", 401);
  }

  const parsed = syncRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return fail("invalid_payload", 400);
  }

  if (parsed.data.userId !== auth.user.id) {
    return fail("wrong_user", 409);
  }

  const result = await applyWorkoutSync(auth.user.id, parsed.data);

  revalidatePath("/");
  revalidatePath("/rutinas");
  revalidatePath("/rutinas/dia");

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
