import type {
  ExerciseKind,
  SyncRequest,
  SyncResponse,
  WorkoutSet,
} from "@/app/lib/workout-sync-contract";

/**
 * Cola offline del registro de entrenamiento (solo navegador).
 * Separada por usuario, guarda el último array de series por ejercicio y la envía a
 * POST /api/workouts/sync. Un solo flusher a la vez (navigator.locks cuando existe).
 */

export type QueuedItem = {
  id: string;
  routineItemId: string;
  kind: ExerciseKind;
  target: string;
  sets: WorkoutSet[];
  rev: number;
  error?: string;
};

export type QueuedSession = {
  id: string;
  savedRoutineId: string;
  routineDayId: string;
  finished: boolean;
  items: Record<string, QueuedItem>;
  error?: string;
};

type QueueState = { sessions: Record<string, QueuedSession> };

export type SyncStatus = {
  state: "idle" | "pending" | "saving" | "offline" | "error";
  message: string | null;
};

export type SyncEvent =
  | { type: "stale"; sessionId: string; itemId: string; serverItemId: string; sets: WorkoutSet[]; rev: number }
  | { type: "acknowledged"; sessionId: string; itemId: string; serverItemId: string; rev: number };

const STORAGE_PREFIX = "gymcontrol:workout-sync:v1:";
const LOCK_NAME = "gymcontrol-workout-sync";
const FLUSH_DELAY_MS = 600;
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000];
const SYNC_VERSION: SyncRequest["v"] = 1;

const IDLE: SyncStatus = { state: "idle", message: null };

let status: SyncStatus = IDLE;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryAttempt = 0;
let flushing = false;
const statusListeners = new Set<() => void>();
const eventListeners = new Set<(event: SyncEvent) => void>();

/** Versión monótona por ejercicio: nunca menor a la última conocida aunque el reloj vaya atrás. */
export function nextRev(knownRev: number) {
  return Math.max(Date.now(), knownRev + 1);
}

export function getSyncStatus() {
  return status;
}

export function getIdleSyncStatus() {
  return IDLE;
}

export function subscribeSyncStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function subscribeSyncEvents(listener: (event: SyncEvent) => void) {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

export function getQueuedSession(userId: string, sessionId: string): QueuedSession | null {
  return readQueue(userId).sessions[sessionId] ?? null;
}

/** Sesión todavía no confirmada por el servidor para ese día (sobrevive a una recarga sin red). */
export function findQueuedSessionForDay(userId: string, savedRoutineId: string, routineDayId: string) {
  return (
    Object.values(readQueue(userId).sessions).find(
      (session) => session.savedRoutineId === savedRoutineId && session.routineDayId === routineDayId,
    ) ?? null
  );
}

export function enqueueItem(
  userId: string,
  session: Pick<QueuedSession, "id" | "savedRoutineId" | "routineDayId">,
  item: Omit<QueuedItem, "error">,
) {
  const queue = readQueue(userId);
  const entry = (queue.sessions[session.id] ??= { ...session, finished: false, items: {} });

  entry.items[item.id] = item;
  delete entry.error;
  writeQueue(userId, queue);
  setStatus({ state: "pending", message: null });
  scheduleFlush(userId, FLUSH_DELAY_MS);
}

export function enqueueFinish(userId: string, session: Pick<QueuedSession, "id" | "savedRoutineId" | "routineDayId">) {
  const queue = readQueue(userId);
  const entry = (queue.sessions[session.id] ??= { ...session, finished: false, items: {} });

  entry.finished = true;
  writeQueue(userId, queue);
  scheduleFlush(userId, 0);
}

/** Engancha los disparadores (montaje, vuelta de red, volver a la app). Devuelve la limpieza. */
export function startSyncRunner(userId: string) {
  const flush = () => scheduleFlush(userId, 0);
  const onVisibility = () => {
    if (document.visibilityState === "visible") flush();
  };

  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", onVisibility);

  if (hasPendingWork(readQueue(userId))) {
    setStatus({ state: "pending", message: null });
    flush();
  }

  return () => {
    window.removeEventListener("online", flush);
    document.removeEventListener("visibilitychange", onVisibility);
    clearTimeout(flushTimer);
    clearTimeout(retryTimer);
  };
}

export function scheduleFlush(userId: string, delay: number) {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushQueue(userId), delay);
}

/** Envía ya lo pendiente y espera el intento (p. ej. "Reintentar" o antes de salir al terminar el entreno). */
export function flushNow(userId: string) {
  clearTimeout(flushTimer);
  retryAttempt = 0;
  return flushQueue(userId);
}

async function flushQueue(userId: string) {
  if (flushing) {
    scheduleFlush(userId, FLUSH_DELAY_MS);
    return;
  }

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;

  if (locks) {
    await locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
      if (lock) await flushUnlocked(userId);
    });
    return;
  }

  await flushUnlocked(userId);
}

async function flushUnlocked(userId: string) {
  const snapshot = readQueue(userId);
  const sessions = Object.values(snapshot.sessions).filter(
    (session) => session.finished || Object.keys(session.items).length > 0,
  );

  if (sessions.length === 0) {
    setStatus(IDLE);
    return;
  }

  if (!navigator.onLine) {
    setStatus({ state: "offline", message: "Sin conexión: se guarda al volver la red." });
    return;
  }

  flushing = true;
  setStatus({ state: "saving", message: null });

  const request: SyncRequest = {
    v: SYNC_VERSION,
    userId,
    sessions: sessions.slice(0, 10).map((session) => ({
      id: session.id,
      savedRoutineId: session.savedRoutineId,
      routineDayId: session.routineDayId,
      finished: session.finished,
      items: Object.values(session.items).map(({ id, routineItemId, kind, target, sets, rev }) => ({
        id,
        routineItemId,
        kind,
        target,
        sets,
        rev,
      })),
    })),
  };

  let response: Response;

  try {
    response = await fetch("/api/workouts/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(request),
    });
  } catch {
    flushing = false;
    setStatus({ state: "offline", message: "Sin conexión: se guarda al volver la red." });
    scheduleRetry(userId);
    return;
  }

  flushing = false;

  if (response.status === 401) {
    setStatus({ state: "error", message: "Tu sesión venció: iniciá sesión para guardar las series." });
    return;
  }

  if (response.status === 400 || response.status === 409) {
    setStatus({ state: "error", message: "No se pudo guardar: recargá la app para actualizarla." });
    return;
  }

  if (!response.ok) {
    setStatus({ state: "error", message: "No se pudo guardar. Reintentando…" });
    scheduleRetry(userId);
    return;
  }

  const result = (await response.json()) as SyncResponse;
  const queue = readQueue(userId);
  const events: SyncEvent[] = [];
  let failures = 0;

  for (const sessionResult of result.sessions) {
    const entry = queue.sessions[sessionResult.id];

    if (!entry) continue;

    if (sessionResult.status === "error") {
      entry.error = sessionResult.message;
      failures += 1;
      continue;
    }

    for (const itemResult of sessionResult.items) {
      const queued = entry.items[itemResult.clientId];

      if (itemResult.status === "error") {
        if (queued) queued.error = itemResult.message;
        failures += 1;
        continue;
      }

      // Solo se descarta lo confirmado: si el usuario editó durante el envío, la versión nueva queda en cola.
      const supersededLocally = Boolean(queued && queued.rev > itemResult.rev);

      if (queued && !supersededLocally) {
        delete entry.items[itemResult.clientId];
      }

      if (itemResult.status === "stale" && !supersededLocally) {
        events.push({
          type: "stale",
          sessionId: entry.id,
          itemId: itemResult.clientId,
          serverItemId: itemResult.id,
          sets: itemResult.sets,
          rev: itemResult.rev,
        });
      } else {
        events.push({
          type: "acknowledged",
          sessionId: entry.id,
          itemId: itemResult.clientId,
          serverItemId: itemResult.id,
          rev: itemResult.rev,
        });
      }
    }

    const sentFinished = request.sessions.find((session) => session.id === entry.id)?.finished ?? false;

    if (Object.keys(entry.items).length === 0 && (!entry.finished || sentFinished)) {
      delete queue.sessions[entry.id];
    }
  }

  writeQueue(userId, queue);
  events.forEach((event) => eventListeners.forEach((listener) => listener(event)));

  if (failures > 0) {
    setStatus({ state: "error", message: firstError(queue) ?? "No se pudo guardar una serie." });
    // Un rechazo del servidor puede ser permanente (p. ej. el ejercicio ya no existe): pocos reintentos y después manual.
    if (retryAttempt < RETRY_DELAYS_MS.length) scheduleRetry(userId);
    return;
  }

  retryAttempt = 0;

  if (hasPendingWork(queue)) {
    setStatus({ state: "pending", message: null });
    scheduleFlush(userId, FLUSH_DELAY_MS);
    return;
  }

  setStatus(IDLE);
}

function scheduleRetry(userId: string) {
  clearTimeout(retryTimer);
  const delay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)];
  retryAttempt += 1;
  retryTimer = setTimeout(() => void flushQueue(userId), delay);
}

function hasPendingWork(queue: QueueState) {
  return Object.values(queue.sessions).some(
    (session) => session.finished || Object.keys(session.items).length > 0,
  );
}

function firstError(queue: QueueState) {
  for (const session of Object.values(queue.sessions)) {
    if (session.error) return session.error;
    const item = Object.values(session.items).find((queued) => queued.error);
    if (item?.error) return item.error;
  }

  return null;
}

function setStatus(next: SyncStatus) {
  if (next.state === status.state && next.message === status.message) return;
  status = next;
  statusListeners.forEach((listener) => listener());
}

function readQueue(userId: string): QueueState {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    const parsed = raw ? (JSON.parse(raw) as QueueState) : null;
    return parsed?.sessions ? parsed : { sessions: {} };
  } catch {
    return { sessions: {} };
  }
}

function writeQueue(userId: string, queue: QueueState) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(queue));
  } catch {
    // Sin storage (modo privado / cuota): la cola vive en memoria hasta el próximo envío.
  }
}
