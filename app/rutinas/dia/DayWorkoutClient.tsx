"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CloudOff,
  History,
  Info,
  LoaderCircle,
  Timer,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import {
  ExerciseDetailModal,
  type ExerciseDetail,
} from "@/app/components/shared/ExerciseDetailModal";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { WorkoutMobile } from "@/app/components/workout/WorkoutMobile";
import type { DayExercise } from "@/app/components/workout/types";
import { ExerciseHistorySheet } from "@/app/rutinas/dia/ExerciseHistorySheet";
import { cn } from "@/app/lib/utils";
import {
  buildPlaceholder,
  countValidDrafts,
  describeSuggestion,
  formatCompactSet,
  nextPendingExercise,
  padSets,
  sanitizeNumber,
  timeFactor,
  toDraftSet,
  toLoggedSet,
  type DraftSet,
  type ExerciseDraft,
} from "@/app/lib/day-workout";
import {
  formatLoggedSet,
  getLoadStep,
  isValidSet,
  parsePlanTarget,
  parseRestSeconds,
  suggestNextTarget,
  type PlanTarget,
  type Suggestion,
} from "@/app/lib/workout-progression";
import {
  enqueueFinish,
  enqueueItem,
  findQueuedSessionForDay,
  flushNow,
  getIdleSyncStatus,
  getQueuedSession,
  getSyncStatus,
  nextRev,
  subscribeSyncEvents,
  subscribeSyncStatus,
  type SyncStatus,
} from "@/app/lib/workout-sync-queue";

export type { DayExercise };

type DayWorkoutClientProps = {
  userId: string;
  savedRoutineId: string;
  routineDayId: string;
  routineName: string;
  dayOrder: number;
  dayName: string;
  openSessionId: string | null;
  completedThisWeek: boolean;
  estimatedMinutes: number;
  exercises: DayExercise[];
};

type RestTimer = { endsAt: number; now: number; totalSeconds: number };

const subscribeNothing = () => () => {};

/**
 * La cola offline vive en localStorage: el registro se arma recién en el cliente
 * (remonta con `key`) para restaurar lo que quedó sin enviar sin romper la hidratación.
 */
export function DayWorkoutClient(props: DayWorkoutClientProps) {
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);

  return <DayWorkoutLogger key={isClient ? "client" : "server"} {...props} restoreQueue={isClient} />;
}

function DayWorkoutLogger({
  restoreQueue,
  ...props
}: DayWorkoutClientProps & { restoreQueue: boolean }) {
  const router = useRouter();
  const [initial] = useState(() => buildInitialState(props, restoreQueue));
  const [sessionId, setSessionId] = useState(initial.sessionId);
  const [drafts, setDrafts] = useState(initial.drafts);
  const [expandedId, setExpandedId] = useState(initial.firstPendingId);
  const [detailExercise, setDetailExercise] = useState<ExerciseDetail | null>(null);
  const [historyExercise, setHistoryExercise] = useState<DayExercise | null>(null);
  const [rest, setRest] = useState<RestTimer | null>(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [focusExerciseId, setFocusExerciseId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const syncStatus = useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getIdleSyncStatus);

  const plannedSets = props.exercises.reduce((sum, exercise) => sum + exercise.series, 0);
  const doneSets = props.exercises.reduce(
    (sum, exercise) => sum + countValidDrafts(drafts[exercise.routineItemId], exercise),
    0,
  );
  const hasStarted = props.exercises.some((exercise) =>
    drafts[exercise.routineItemId].sets.some((set) => set.done || set.kg || set.reps || set.secs),
  );
  const restEndsAt = rest?.endsAt ?? null;

  useEffect(() => {
    if (!sessionId) return;

    return subscribeSyncEvents((event) => {
      if (event.sessionId !== sessionId) return;

      setDrafts((current) => {
        const match = Object.entries(current).find(([, draft]) => draft.itemId === event.itemId);

        if (!match) return current;

        const [routineItemId, draft] = match;
        const exercise = props.exercises.find((candidate) => candidate.routineItemId === routineItemId);

        if (event.type === "stale" && exercise) {
          return {
            ...current,
            [routineItemId]: {
              itemId: event.serverItemId,
              sets: padSets(event.sets, exercise.series).map((set) => toDraftSet(set, timeFactor(exercise))),
              rev: event.rev,
            },
          };
        }

        return {
          ...current,
          [routineItemId]: { ...draft, itemId: event.serverItemId, rev: Math.max(draft.rev, event.rev) },
        };
      });

      if (event.type === "stale") {
        toast.info("Un ejercicio se actualizó con lo guardado desde otra pestaña.");
      }
    });
  }, [sessionId, props.exercises]);

  useEffect(() => {
    if (restEndsAt == null) return;

    const interval = setInterval(() => {
      const now = Date.now();

      if (now >= restEndsAt) {
        setRest(null);
        navigator.vibrate?.(250);
        return;
      }

      setRest((current) => (current ? { ...current, now } : current));
    }, 250);

    return () => clearInterval(interval);
  }, [restEndsAt]);

  function commit(exercise: DayExercise, sets: DraftSet[]) {
    const draft = drafts[exercise.routineItemId];
    const itemId = draft.itemId ?? crypto.randomUUID();
    const rev = nextRev(draft.rev);
    const activeSessionId = sessionId ?? crypto.randomUUID();

    if (!sessionId) {
      setSessionId(activeSessionId);
    }

    setDrafts((current) => ({ ...current, [exercise.routineItemId]: { itemId, sets, rev } }));
    enqueueItem(
      props.userId,
      { id: activeSessionId, savedRoutineId: props.savedRoutineId, routineDayId: props.routineDayId },
      {
        id: itemId,
        routineItemId: exercise.routineItemId,
        kind: exercise.kind,
        target: exercise.target,
        sets: sets.map((set) => toLoggedSet(set, exercise)),
        rev,
      },
    );
  }

  function handleField(exercise: DayExercise, index: number, field: "kg" | "reps" | "secs", value: string) {
    const sanitized = sanitizeNumber(value, field === "kg" || (field === "secs" && timeFactor(exercise) === 60));
    const sets = drafts[exercise.routineItemId].sets.map((set, setIndex) =>
      setIndex === index ? { ...set, [field]: sanitized } : set,
    );

    commit(exercise, sets);
  }

  function handleToggleDone(exercise: DayExercise, index: number, placeholder: DraftSet) {
    const current = drafts[exercise.routineItemId].sets[index];

    if (current.done) {
      commit(
        exercise,
        drafts[exercise.routineItemId].sets.map((set, setIndex) =>
          setIndex === index ? { ...set, done: false } : set,
        ),
      );
      return;
    }

    const filled: DraftSet = {
      kg: exercise.kind === "time" ? "" : current.kg || placeholder.kg,
      reps: exercise.kind === "time" ? "" : current.reps || placeholder.reps,
      secs: exercise.kind === "time" ? current.secs || placeholder.secs : "",
      done: true,
    };

    if (!isValidSet(toLoggedSet(filled, exercise))) {
      toast.error(exercise.kind === "time" ? "Anotá cuánto duró la serie." : "Anotá las reps de la serie.");
      return;
    }

    const sets = drafts[exercise.routineItemId].sets.map((set, setIndex) => (setIndex === index ? filled : set));

    commit(exercise, sets);

    const restSeconds = parseRestSeconds(exercise.rest);

    if (restSeconds) {
      setRest(createRestTimer(restSeconds));
    }

    if (sets.filter((set) => isValidSet(toLoggedSet(set, exercise))).length >= exercise.series) {
      const next = nextPendingExercise(props.exercises, drafts, exercise.routineItemId);

      setExpandedId(next?.routineItemId ?? null);
      setFocusExerciseId(next?.routineItemId ?? null);
    }
  }

  async function handleFinish() {
    if (!sessionId) return;

    setFinishing(true);
    enqueueFinish(props.userId, {
      id: sessionId,
      savedRoutineId: props.savedRoutineId,
      routineDayId: props.routineDayId,
    });
    await flushNow(props.userId);

    toast.success(
      getSyncStatus().state === "idle"
        ? "Entreno guardado. ¡Bien ahí!"
        : "Entreno guardado en el teléfono: se sube cuando vuelva la conexión.",
    );
    router.push("/rutinas");
    router.refresh();
  }

  const restSeconds = rest ? Math.max(0, Math.ceil((rest.endsAt - rest.now) / 1000)) : 0;

  return (
    <>
      {/* Mobile (DESIGN.md §11) y desktop (cards, sin cambios) conviven: cada uno se oculta en el otro ancho. */}
      <div className="h-full lg:hidden">
        <section className="page-frame workout-frame relative isolate bg-[var(--background)]">
          <div className="flex min-h-full flex-col">
            <div aria-hidden="true" className="home-safe-top" />
            <WorkoutMobile
              exercises={props.exercises}
              drafts={drafts}
              handlers={{
                onField: handleField,
                onToggleDone: handleToggleDone,
                onShowDetail: (exercise) => setDetailExercise(exercise.exercise),
                onShowHistory: setHistoryExercise,
              }}
              subtitle={`Día ${props.dayOrder} · ${props.dayName}`}
              eyebrow={`${props.routineName} · Día ${props.dayOrder}`}
              focusExerciseId={focusExerciseId}
              rest={rest ? { remainingSeconds: restSeconds, totalSeconds: rest.totalSeconds } : null}
              syncStatus={syncStatus}
              hasStarted={hasStarted}
              repeatedThisWeek={props.completedThisWeek}
              finishing={finishing}
              onRetrySync={() => void flushNow(props.userId)}
              onAddRest={() =>
                setRest((current) =>
                  current
                    ? { ...current, endsAt: current.endsAt + 15_000, totalSeconds: current.totalSeconds + 15 }
                    : current,
                )
              }
              onSkipRest={() => setRest(null)}
              onFinish={() => (doneSets > 0 ? void handleFinish() : router.push("/rutinas"))}
              onExit={() => router.push("/rutinas")}
            />
          </div>
        </section>
      </div>

      <div className="hidden lg:contents">
      <div className="page-frame auto-rows-max content-start gap-5 bg-[var(--background)] xl:p-6">
        <header className="grid gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="size-11 shrink-0 rounded-full">
              <Link href="/rutinas" aria-label="Volver a la semana">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-[var(--foreground-muted)]">
                {props.routineName} · Día {props.dayOrder}
              </p>
              <h1 className="truncate font-display text-2xl font-bold tracking-[-0.02em] text-[var(--foreground)]">
                {props.dayName}
              </h1>
            </div>
            <SyncIndicator status={syncStatus} hasStarted={hasStarted} onRetry={() => void flushNow(props.userId)} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] text-[var(--foreground-muted)]">
                <span className="font-display text-[1.75rem] font-bold leading-none tabular-nums text-[var(--foreground)]">
                  {doneSets}
                </span>{" "}
                de {plannedSets} series
              </p>
              <p className="text-[13px] text-[var(--foreground-muted)]">
                ~{props.estimatedMinutes} min · {props.exercises.length} ejercicios
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Series hechas"
              aria-valuemin={0}
              aria-valuemax={plannedSets}
              aria-valuenow={doneSets}
              className="h-1.5 overflow-hidden rounded-full bg-[var(--card-alt)]"
            >
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                style={{ width: `${plannedSets > 0 ? Math.min(100, (doneSets / plannedSets) * 100) : 0}%` }}
              />
            </div>
            {syncStatus.state === "error" && syncStatus.message ? (
              <p role="alert" className="text-[13px] text-[var(--danger)]">
                {syncStatus.message}
              </p>
            ) : null}
            {props.completedThisWeek && !hasStarted ? (
              <p className="text-[13px] text-[var(--foreground-muted)]">
                Ya registraste este día esta semana. Si lo repetís, se guarda como otro entreno.
              </p>
            ) : null}
          </div>
        </header>

        {props.exercises.length > 0 ? (
          <section aria-label="Ejercicios del día" className="grid gap-3">
            {props.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.routineItemId}
                exercise={exercise}
                draft={drafts[exercise.routineItemId]}
                expanded={expandedId === exercise.routineItemId}
                onToggleExpanded={() =>
                  setExpandedId((current) => (current === exercise.routineItemId ? null : exercise.routineItemId))
                }
                onField={(index, field, value) => handleField(exercise, index, field, value)}
                onToggleDone={(index, placeholder) => handleToggleDone(exercise, index, placeholder)}
                onShowDetail={() => setDetailExercise(exercise.exercise)}
                onShowHistory={() => setHistoryExercise(exercise)}
              />
            ))}
          </section>
        ) : (
          <p className="text-sm text-[var(--foreground-muted)]">Este día todavía no tiene ejercicios cargados.</p>
        )}

        {rest || doneSets > 0 || syncStatus.state === "offline" || syncStatus.state === "error" ? (
          <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 grid gap-2 lg:bottom-6">
            {syncStatus.state === "offline" || syncStatus.state === "error" ? (
              <p
                role="status"
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2 text-[13px] shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
                  syncStatus.state === "offline" ? "text-[var(--warning)]" : "text-[var(--danger)]",
                )}
              >
                {syncStatus.state === "offline" ? (
                  <CloudOff aria-hidden="true" className="size-4 shrink-0" />
                ) : (
                  <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                )}
                {syncStatus.message ?? "No se pudo guardar."}
              </p>
            ) : null}
            {rest ? (
              <RestBar
                remainingSeconds={Math.max(0, Math.ceil((rest.endsAt - rest.now) / 1000))}
                onAdd={() => setRest((current) => (current ? { ...current, endsAt: current.endsAt + 15_000 } : current))}
                onSkip={() => setRest(null)}
              />
            ) : null}
            {doneSets > 0 ? (
              confirmingFinish ? (
                <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                  <p className="text-sm text-[var(--foreground)]">
                    Hiciste {doneSets} de {plannedSets} series. ¿Terminar igual?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => setConfirmingFinish(false)}>
                      Seguir
                    </Button>
                    <Button type="button" disabled={finishing} onClick={() => void handleFinish()}>
                      {finishing ? <LoaderCircle className="size-4 animate-spin" /> : null}
                      Terminar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  className="h-14 w-full rounded-2xl text-base font-bold shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  disabled={finishing}
                  onClick={() => (doneSets < plannedSets ? setConfirmingFinish(true) : void handleFinish())}
                >
                  {finishing ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />}
                  Terminar entrenamiento
                </Button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
      </div>

      <ExerciseDetailModal
        exercise={detailExercise}
        open={detailExercise !== null}
        onOpenChange={(open) => {
          if (!open) setDetailExercise(null);
        }}
      />
      <ExerciseHistorySheet
        exercise={historyExercise}
        onOpenChange={(open) => {
          if (!open) setHistoryExercise(null);
        }}
      />
    </>
  );
}

function ExerciseCard({
  exercise,
  draft,
  expanded,
  onToggleExpanded,
  onField,
  onToggleDone,
  onShowDetail,
  onShowHistory,
}: {
  exercise: DayExercise;
  draft: ExerciseDraft;
  expanded: boolean;
  onToggleExpanded: () => void;
  onField: (index: number, field: "kg" | "reps" | "secs", value: string) => void;
  onToggleDone: (index: number, placeholder: DraftSet) => void;
  onShowDetail: () => void;
  onShowHistory: () => void;
}) {
  const target = parsePlanTarget(exercise.target);
  const previous = exercise.history[0] ?? null;
  const suggestion = suggestNextTarget({
    target,
    kind: exercise.kind,
    previousSets: previous?.sets ?? [],
    plannedSeries: exercise.series,
    loadStep: getLoadStep(exercise.equipment),
  });
  const validCount = countValidDrafts(draft, exercise);
  const isDone = validCount >= exercise.series;
  const factor = timeFactor(exercise);
  const columns =
    exercise.kind === "time"
      ? "grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_2.75rem]"
      : "grid-cols-[2.25rem_minmax(0,1fr)_4.25rem_4.25rem_2.75rem]";

  return (
    <article
      className={cn(
        "rounded-[14px] border bg-[var(--card)] transition-colors",
        isDone ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)]" : "border-[var(--border)]",
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggleExpanded}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          aria-hidden="true"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border font-display text-sm font-bold",
            isDone
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "border-[var(--border-strong)] text-[var(--foreground)]",
          )}
        >
          {isDone ? <Check className="size-5" strokeWidth={3} /> : exercise.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-semibold text-[var(--foreground)]">
            {exercise.exercise.name}
          </span>
          <span className="block truncate text-[13px] text-[var(--foreground-muted)]">
            {exercise.series} × {exercise.target} · RIR {exercise.rir} · {exercise.rest}
          </span>
        </span>
        <span className="font-mono text-[13px] tabular-nums text-[var(--foreground-muted)]">
          {validCount}/{exercise.series}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-5 shrink-0 text-[var(--foreground-muted)] transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded ? (
        <div className="grid gap-3 border-t border-[var(--border)] px-4 pb-4 pt-3">
          <SuggestionLine suggestion={suggestion} target={target} exercise={exercise} hasHistory={Boolean(previous)} />

          <div role="table" aria-label={`Series de ${exercise.exercise.name}`} className="grid gap-1.5 lg:max-w-xl">
            <div
              role="row"
              className={cn(
                "grid items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]",
                columns,
              )}
            >
              <span role="columnheader">Serie</span>
              <span role="columnheader">Anterior</span>
              {exercise.kind === "time" ? null : (
                <span role="columnheader" className="text-center">
                  {exercise.kind === "bodyweight" ? "+kg" : "kg"}
                </span>
              )}
              <span role="columnheader" className="text-center">
                {exercise.kind === "time" ? (factor === 60 ? "min" : "seg") : "reps"}
              </span>
              <span role="columnheader" className="sr-only">
                Hecha
              </span>
            </div>

            {draft.sets.map((set, index) => {
              const previousSet = previous?.sets[index] ?? null;
              const placeholder = buildPlaceholder({ exercise, suggestion, target, previousSet });

              return (
                <div
                  key={index}
                  role="row"
                  className={cn(
                    "grid items-center gap-1.5 rounded-lg px-1 py-0.5",
                    columns,
                    set.done && "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]",
                  )}
                >
                  <span role="cell" className="text-center font-mono text-sm text-[var(--foreground-muted)]">
                    {index + 1}
                  </span>
                  <span
                    role="cell"
                    className="truncate font-mono text-xs text-[var(--foreground-muted)]"
                    aria-label={
                      previousSet && isValidSet(previousSet)
                        ? `Anterior: ${formatLoggedSet(previousSet, previous?.kind ?? exercise.kind)}`
                        : "Sin serie anterior"
                    }
                  >
                    {previousSet && isValidSet(previousSet)
                      ? formatCompactSet(previousSet, previous?.kind ?? exercise.kind)
                      : "—"}
                  </span>
                  {exercise.kind === "time" ? null : (
                    <span role="cell">
                      <Input
                        aria-label={`Serie ${index + 1}: ${exercise.kind === "bodyweight" ? "lastre en kg" : "kg"}`}
                        inputMode="decimal"
                        value={set.kg}
                        placeholder={placeholder.kg}
                        onChange={(event) => onField(index, "kg", event.target.value)}
                        className="h-11 px-1 text-center text-base tabular-nums"
                      />
                    </span>
                  )}
                  <span role="cell">
                    <Input
                      aria-label={`Serie ${index + 1}: ${exercise.kind === "time" ? (factor === 60 ? "minutos" : "segundos") : "reps"}`}
                      inputMode={exercise.kind === "time" && factor === 60 ? "decimal" : "numeric"}
                      value={exercise.kind === "time" ? set.secs : set.reps}
                      placeholder={exercise.kind === "time" ? placeholder.secs : placeholder.reps}
                      onChange={(event) =>
                        onField(index, exercise.kind === "time" ? "secs" : "reps", event.target.value)
                      }
                      className="h-11 px-1 text-center text-base tabular-nums"
                    />
                  </span>
                  <span role="cell" className="flex justify-center">
                    <button
                      type="button"
                      aria-pressed={set.done}
                      aria-label={set.done ? `Desmarcar serie ${index + 1}` : `Marcar serie ${index + 1} como hecha`}
                      onClick={() => onToggleDone(index, placeholder)}
                      className={cn(
                        "pressable grid size-11 place-items-center rounded-full border",
                        set.done
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                          : "border-[var(--border-strong)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                      )}
                    >
                      <Check className="size-5" strokeWidth={3} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" disabled={exercise.history.length === 0} onClick={onShowHistory}>
              <History className="size-4" />
              Historial
            </Button>
            <Button type="button" variant="ghost" onClick={onShowDetail}>
              <Info className="size-4" />
              Técnica
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function SuggestionLine({
  suggestion,
  target,
  exercise,
  hasHistory,
}: {
  suggestion: Suggestion | null;
  target: PlanTarget | null;
  exercise: DayExercise;
  hasHistory: boolean;
}) {
  const text = describeSuggestion({ suggestion, target, exercise, hasHistory });

  if (!text) return null;

  return (
    <p className="flex items-start gap-2 text-[13px] leading-5 text-[var(--foreground)]">
      <TrendingUp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--accent-bright)]" />
      {text}
    </p>
  );
}

function SyncIndicator({
  status,
  hasStarted,
  onRetry,
}: {
  status: SyncStatus;
  hasStarted: boolean;
  onRetry: () => void;
}) {
  if (status.state === "error") {
    return (
      <Button type="button" variant="outline" className="shrink-0 text-[var(--danger)]" onClick={onRetry}>
        <TriangleAlert className="size-4" />
        Reintentar
      </Button>
    );
  }

  if (status.state === "offline") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--warning)]">
        <CloudOff aria-hidden="true" className="size-4" />
        Sin conexión
      </span>
    );
  }

  if (status.state === "pending" || status.state === "saving") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--foreground-muted)]">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Guardando
      </span>
    );
  }

  return hasStarted ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--foreground-muted)]">
      <Check aria-hidden="true" className="size-4 text-[var(--accent-bright)]" />
      Guardado
    </span>
  ) : null;
}

function RestBar({
  remainingSeconds,
  onAdd,
  onSkip,
}: {
  remainingSeconds: number;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] px-4 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      <p className="flex items-center gap-2">
        <Timer aria-hidden="true" className="size-5 text-[var(--accent-bright)]" />
        <span className="font-mono text-2xl font-medium tabular-nums text-[var(--foreground)]">
          {minutes}:{seconds}
        </span>
        <span className="text-[13px] text-[var(--foreground-muted)]">descanso</span>
      </p>
      <div className="flex gap-1">
        <Button type="button" variant="ghost" onClick={onAdd}>
          +15 s
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Saltar
        </Button>
      </div>
    </div>
  );
}

function buildInitialState(props: DayWorkoutClientProps, restoreQueue: boolean) {
  const queued = restoreQueue
    ? props.openSessionId
      ? getQueuedSession(props.userId, props.openSessionId)
      : findQueuedSessionForDay(props.userId, props.savedRoutineId, props.routineDayId)
    : null;
  const queuedByRoutineItemId = new Map(
    Object.values(queued?.items ?? {}).map((item) => [item.routineItemId, item]),
  );

  const drafts: Record<string, ExerciseDraft> = Object.fromEntries(
    props.exercises.map((exercise) => {
      const queuedItem = queuedByRoutineItemId.get(exercise.routineItemId);
      const source =
        queuedItem && (!exercise.saved || queuedItem.rev > exercise.saved.rev)
          ? { id: queuedItem.id, sets: queuedItem.sets, rev: queuedItem.rev }
          : exercise.saved;

      return [
        exercise.routineItemId,
        {
          itemId: source?.id ?? null,
          sets: padSets(source?.sets ?? [], exercise.series).map((set) => toDraftSet(set, timeFactor(exercise))),
          rev: source?.rev ?? 0,
        },
      ];
    }),
  );

  return {
    sessionId: props.openSessionId ?? queued?.id ?? null,
    drafts,
    firstPendingId:
      props.exercises.find(
        (exercise) => countValidDrafts(drafts[exercise.routineItemId], exercise) < exercise.series,
      )?.routineItemId ?? null,
  };
}

/** El descanso se cuenta contra una hora de fin: sigue siendo correcto aunque la pantalla se bloquee. */
function createRestTimer(seconds: number): RestTimer {
  const now = Date.now();

  return { endsAt: now + seconds * 1000, now, totalSeconds: seconds };
}
