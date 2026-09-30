"use server";

import { z } from "zod";

import { requireUser } from "@/app/lib/auth";
import { getTodayDateKey } from "@/app/lib/local-date";
import { setSupplementIntake } from "@/app/lib/supplements-store";

/** Tilde de hoy (hora argentina) en "Suplementos" del home (DESIGN.md §10.1 Z7). Devuelve la hora del tilde. */
export async function toggleSupplementIntakeAction(
  supplementId: string,
  taken: boolean,
): Promise<{ ok: true; takenAt: string | null } | { ok: false; message: string }> {
  const auth = await requireUser();

  if (!z.string().uuid().safeParse(supplementId).success || typeof taken !== "boolean") {
    return { ok: false, message: "Revisá el suplemento." };
  }

  try {
    const takenAt = await setSupplementIntake({
      userId: auth.user.id,
      supplementId,
      localDate: getTodayDateKey(),
      taken,
    });

    return { ok: true, takenAt };
  } catch {
    return { ok: false, message: taken ? "No se pudo tildar." : "No se pudo destildar." };
  }
}
