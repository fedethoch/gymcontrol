// Aviso de fin del descanso (DESIGN.md §6.4 y §11.3): cuándo sale y qué dice.
// Sin imports a propósito: se testea con `node --test`. Servidor en app/lib/push/rest.ts; cliente en use-rest-push.ts.

/** El cron de Supabase (cada 5 s) reclama los avisos que vencen dentro de esta ventana (igual que en SQL). */
export const REST_PUSH_CLAIM_WINDOW_MS = 12_000;
/** Un aviso que saldría más tarde que esto ya no sirve: se descarta. */
export const REST_PUSH_MAX_LATE_MS = 20_000;
/** Adelanto sobre el fin del timer para compensar la entrega del push service (se calibra midiendo en el celu). */
export const REST_PUSH_LEAD_MS = 0;
/** Si el reloj del celu y el del server difieren menos que esto, se usa la hora de fin tal cual. */
export const REST_CLOCK_SKEW_TOLERANCE_MS = 2_000;
/** Con la app visible y un celu que vibra, se cancela el push este tiempo antes del fin (avisa la app). */
export const REST_CANCEL_BEFORE_END_MS = 1_500;
/** Descanso más largo que se programa. */
export const REST_PUSH_MAX_MS = 15 * 60_000;

/**
 * Hora de envío en el reloj del server. Con relojes parecidos, la hora de fin del celu tal cual (así el
 * tiempo de red y el arranque del server no atrasan el aviso); si no, lo que faltaba cuando se mandó.
 */
export function resolveSendAt(input: { endsAt: number; sentAt: number; receivedAt: number }): number {
  const skew = input.receivedAt - input.sentAt;

  return Math.abs(skew) <= REST_CLOCK_SKEW_TOLERANCE_MS ? input.endsAt : input.receivedAt + (input.endsAt - input.sentAt);
}

/** Programable: todavía no terminó (con margen) y no es absurdamente largo. */
export function isSchedulableSendAt(sendAt: number, now: number): boolean {
  return sendAt > now - REST_CLOCK_SKEW_TOLERANCE_MS && sendAt <= now + REST_PUSH_MAX_MS;
}

export type RestPushAction = "schedule" | "cancel" | "none";

/**
 * Qué hacer con el aviso del server según el descanso de la app.
 * - Sin descanso (terminó, Saltar o cambio de pantalla): cancelar lo programado.
 * - App visible en un celu que vibra, a 1,5 s del fin: cancelar (la app ya avisa). En iPhone no: la app no puede vibrar.
 * - Descanso nuevo o con +15 s: programar.
 */
export function decideRestPush(input: {
  rest: { endsAt: number; next: string | null } | null;
  scheduledEndsAt: number | null;
  visible: boolean;
  canVibrate: boolean;
  now: number;
}): RestPushAction {
  const { rest, scheduledEndsAt } = input;

  if (!rest || rest.next === null) {
    return scheduledEndsAt !== null ? "cancel" : "none";
  }

  const remaining = rest.endsAt - input.now;

  if (input.visible && input.canVibrate && remaining <= REST_CANCEL_BEFORE_END_MS) {
    return scheduledEndsAt !== null ? "cancel" : "none";
  }

  if (remaining <= 0) {
    return "none";
  }

  return scheduledEndsAt === rest.endsAt ? "none" : "schedule";
}

/** "Sigue: Press banca · serie 3 de 4". */
export function describeRestNext(next: { exerciseName: string; setNumber: number; setCount: number }): string {
  return `Sigue: ${next.exerciseName.trim()} · serie ${next.setNumber} de ${next.setCount}`;
}

/** Resumen de las demoras medidas en el celu (ms, recibido − fin del timer). */
export function summarizeRestDeltas(deltas: readonly number[]) {
  if (deltas.length === 0) {
    return null;
  }

  const sorted = [...deltas].sort((a, b) => a - b);
  const at = (quantile: number) => sorted[Math.min(sorted.length - 1, Math.floor(quantile * sorted.length))];

  return { count: sorted.length, median: at(0.5), p90: at(0.9), max: sorted[sorted.length - 1], min: sorted[0] };
}
