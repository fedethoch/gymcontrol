"use client";

import { useEffect } from "react";

import { startSyncRunner } from "@/app/lib/workout-sync-queue";

/** Envía la cola de entrenamiento pendiente desde cualquier pantalla (al abrir, al volver la red o la app). */
export function WorkoutSyncRunner({ userId }: { userId: string }) {
  useEffect(() => startSyncRunner(userId), [userId]);

  return null;
}
