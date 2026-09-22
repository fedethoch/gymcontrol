import { z } from "zod";

import { pushFail, pushNoContent, readJson } from "@/app/lib/push/http";
import { recordRestPushDelta } from "@/app/lib/push/rest";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";

const ackSchema = z.object({
  token: z.uuid(),
  deltaMs: z.number().int().min(-60_000).max(600_000),
});

/**
 * El service worker avisa cuánto tardó en llegar el aviso de fin de descanso (recibido − fin del timer,
 * con el reloj del celu). Sin sesión: lo identifica el token del descanso, que solo conocen el server y ese celu.
 */
export async function POST(request: Request) {
  const parsed = ackSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return pushFail("invalid_payload", 400);
  }

  await recordRestPushDelta(createSupabaseAdminClient(), parsed.data.token, parsed.data.deltaMs);

  return pushNoContent();
}
