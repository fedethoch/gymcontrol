import { timingSafeEqual } from "node:crypto";

import { after } from "next/server";

import { getCronSecret } from "@/app/lib/push/config";
import { pushFail, pushJson } from "@/app/lib/push/http";
import { runReminderTick } from "@/app/lib/push/reminders";
import { claimDueRestPushes, deliverRestPush } from "@/app/lib/push/rest";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";

export const maxDuration = 60;

function isAuthorized(request: Request, secret: string) {
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);

  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Lo llama `pg_cron` + `pg_net` de Supabase (docs/DATABASE.md "Avisos push"):
 * `task=rest` cada 5 s cuando hay un descanso por vencer; `task=reminders` cada 5 min.
 * Responde enseguida y trabaja en `after()`.
 */
export async function POST(request: Request) {
  const secret = getCronSecret();

  if (!secret) {
    return pushFail("not_configured", 503);
  }

  if (!isAuthorized(request, secret)) {
    return pushFail("unauthorized", 401);
  }

  const task = new URL(request.url).searchParams.get("task");
  const admin = createSupabaseAdminClient();

  if (task === "rest") {
    const jobs = await claimDueRestPushes(admin);

    if (jobs.length > 0) {
      after(() => Promise.all(jobs.map((job) => deliverRestPush(admin, job))));
    }

    return pushJson({ ok: true, claimed: jobs.length }, 202);
  }

  if (task === "reminders") {
    after(async () => {
      try {
        const result = await runReminderTick(admin);
        if (result.due > 0) console.info("push: recordatorios", result);
      } catch (error) {
        console.error("push: falló el tick de recordatorios", error instanceof Error ? error.message : error);
      }
    });

    return pushJson({ ok: true }, 202);
  }

  return pushFail("unknown_task", 400);
}
