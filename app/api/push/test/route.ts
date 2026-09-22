import { after } from "next/server";
import { z } from "zod";

import { getOptionalAuthContext } from "@/app/lib/auth";
import { buildPushPayload, TEST_MESSAGE } from "@/app/lib/notifications";
import { pushFail, pushJson, readJson, resolveRequestOrigin } from "@/app/lib/push/http";
import { sendPush } from "@/app/lib/push/send";
import { claimTestSlot, findUserPushTarget } from "@/app/lib/push/store";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";

export const maxDuration = 60;

/** Da tiempo a bloquear el celu para ver el aviso como llega de verdad. */
const TEST_DELAY_MS = 5_000;

const testSchema = z.object({ endpoint: z.string().url().max(1024) });

/** "Probar notificación": un push a este dispositivo a los 5 s. */
export async function POST(request: Request) {
  if (!resolveRequestOrigin(request)) {
    return pushFail("forbidden_origin", 403);
  }

  const auth = await getOptionalAuthContext();

  if (!auth) {
    return pushFail("unauthenticated", 401);
  }

  const parsed = testSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return pushFail("invalid_payload", 400);
  }

  const admin = createSupabaseAdminClient();
  const target = await findUserPushTarget(admin, auth.user.id, parsed.data.endpoint);

  if (!target) {
    return pushFail("no_subscription", 404);
  }

  if (!(await claimTestSlot(admin, target.id))) {
    return pushFail("too_soon", 429);
  }

  const payload = buildPushPayload({
    kind: "test",
    message: TEST_MESSAGE,
    origin: target.origin,
    path: "/configuracion?panel=notificaciones",
  });

  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    await sendPush(admin, target, payload);
  });

  return pushJson({ ok: true, delayMs: TEST_DELAY_MS }, 202);
}
