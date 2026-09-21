"use client";

import {
  ExerciseListSheet,
  type ExerciseListRow,
} from "@/app/components/workout/ExerciseListSheet";
import { ExerciseStage } from "@/app/components/workout/ExerciseStage";
import { SetFocus, type StepperField } from "@/app/components/workout/SetFocus";
import { SetList, type SetRow } from "@/app/components/workout/SetList";
import {
  FinishConfirm,
  RestCard,
  SetDoneButton,
} from "@/app/components/workout/WorkoutAction";
import {
  EmptyDay,
  WorkoutSummary,
} from "@/app/components/workout/WorkoutSummary";
import { WorkoutTopBar } from "@/app/components/workout/WorkoutTopBar";
import type {
  DayExercise,
  Drafts,
  WorkoutHandlers,
} from "@/app/components/workout/types";
import {
  buildPlaceholder,
  countDoneSets,
  countPlannedSets,
  countValidDrafts,
  currentSetIndex,
  describeSuggestion,
  exerciseFractions,
  formatCompactSet,
  resolveDayState,
  stepValue,
  timeFactor,
  toLoggedSet,
  type DraftSet,
} from "@/app/lib/day-workout";
import {
  isValidSet,
  parsePlanTarget,
} from "@/app/lib/workout-progression";
import type { SyncStatus } from "@/app/lib/workout-sync-queue";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const subscribeNothing = () => () => {};

type RestState = { remainingSeconds: number; totalSeconds: number } | null;

/**
 * Registro del día en mobile (DESIGN.md §11): un ejercicio por pantalla, la serie actual como
 * protagonista, la acción debajo de los steppers y la lista completa en un sheet.
 * El estado y la sincronización viven en el padre.
 */
export function WorkoutMobile({
  exercises,
  drafts,
  handlers,
  subtitle,
  eyebrow,
  focusExerciseId,
  rest,
  syncStatus,
  hasStarted,
  repeatedThisWeek,
  finishing,
  onRetrySync,
  onAddRest,
  onSkipRest,
  onFinish,
  onExit,
}: {
  exercises: DayExercise[];
  drafts: Drafts;
  handlers: WorkoutHandlers;
  subtitle: string;
  eyebrow: string;
  /** Ejercicio al que el padre quiere mover el pager (al completar uno). */
  focusExerciseId: string | null;
  rest: RestState;
  syncStatus: SyncStatus;
  hasStarted: boolean;
  repeatedThisWeek: boolean;
  finishing: boolean;
  onRetrySync: () => void;
  onAddRest: () => void;
  onSkipRest: () => void;
  onFinish: () => void;
  onExit: () => void;
}) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );
  const [panel, setPanel] = useState(() =>
    Math.max(
      0,
      exercises.findIndex(
        (exercise) =>
          countValidDrafts(drafts[exercise.routineItemId], exercise) <
          exercise.series
      )
    )
  );
  const [selectedSets, setSelectedSets] = useState<Record<string, number>>({});
  const [listOpen, setListOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const plannedSets = countPlannedSets(exercises);
  const doneSets = countDoneSets(exercises, drafts);
  const state = resolveDayState({ exercises, drafts, resting: rest !== null });
  const visible = exercises[Math.min(panel, exercises.length - 1)] ?? null;

  /** Mover el pager es tocar el DOM: el índice lo actualiza `onScroll` cuando el scroll asienta. */
  const scrollToPanel = useCallback((next: number) => {
    const pager = pagerRef.current;
    if (!pager) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    pager.scrollTo({
      left: next * pager.clientWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  useLayoutEffect(() => {
    const pager = pagerRef.current;
    if (mounted && pager) pager.scrollLeft = panel * pager.clientWidth;
    // Solo al montar: después manda el scroll del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!focusExerciseId) return;
    const index = exercises.findIndex(
      (exercise) => exercise.routineItemId === focusExerciseId
    );
    if (index >= 0) scrollToPanel(index);
  }, [focusExerciseId, exercises, scrollToPanel]);

  function onScroll() {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const pager = pagerRef.current;
      if (!pager || pager.clientWidth === 0) return;
      setPanel(
        Math.min(
          exercises.length - 1,
          Math.max(0, Math.round(pager.scrollLeft / pager.clientWidth))
        )
      );
    }, 90);
  }

  if (exercises.length === 0) {
    return <EmptyDay eyebrow={eyebrow} />;
  }

  const finishConfirm = (
    <FinishConfirm
      doneSets={doneSets}
      plannedSets={plannedSets}
      offline={syncStatus.state === "offline"}
      finishing={finishing}
      onCancel={() => setConfirming(false)}
      onConfirm={onFinish}
    />
  );

  function restCard(nextLabel: string | null) {
    return rest ? (
      <RestCard
        remainingSeconds={rest.remainingSeconds}
        totalSeconds={rest.totalSeconds}
        nextLabel={nextLabel}
        onAdd={onAddRest}
        onSkip={onSkipRest}
      />
    ) : null;
  }

  /** Z3b · la acción de cada panel: confirmar terminar, descanso o marcar la serie activa. */
  function actionFor(exercise: DayExercise) {
    if (confirming) return finishConfirm;

    const draft = drafts[exercise.routineItemId];
    if (rest) return restCard(nextSetLabel(exercise, draft));

    const index = activeSetIndex(exercise, draft, selectedSets);
    const label = activeSetDone(exercise, draft, selectedSets)
      ? `Deshacer serie ${index + 1}`
      : `Serie ${index + 1} hecha`;

    return (
      <SetDoneButton
        label={label}
        onDone={() => {
          // La selección manual sirve para editar una serie puntual: al tocar el CTA se vuelve al flujo normal.
          setSelectedSets((current) => {
            if (!(exercise.routineItemId in current)) return current;

            const rest = { ...current };
            delete rest[exercise.routineItemId];

            return rest;
          });
          handlers.onToggleDone(
            exercise,
            index,
            placeholderFor(exercise, draft, index)
          );
        }}
      />
    );
  }

  const listRows: ExerciseListRow[] = exercises.map((exercise) => ({
    id: exercise.routineItemId,
    name: exercise.exercise.name,
    imageUrl: exercise.exercise.imageUrl,
    meta: `${exercise.series} × ${exercise.target} · RIR ${exercise.rir}`,
    done: countValidDrafts(drafts[exercise.routineItemId], exercise),
    series: exercise.series,
    current: exercise.routineItemId === visible?.routineItemId,
  }));

  return (
    <div className="flex min-h-full flex-1 flex-col gap-4">
      <div className="flex flex-1 flex-col gap-4 short:gap-3">
        <WorkoutTopBar
          fractions={exerciseFractions(exercises, drafts)}
          doneSets={doneSets}
          plannedSets={plannedSets}
          subtitle={subtitle}
          status={syncStatus}
          hasStarted={hasStarted}
          exerciseCount={exercises.length}
          onExit={() => (doneSets > 0 ? setConfirming(true) : onExit())}
          onOpenList={() => setListOpen(true)}
          onRetry={onRetrySync}
        />

        {state === "all_done" ? (
          <>
            <WorkoutSummary
              eyebrow={eyebrow}
              plannedSets={plannedSets}
              exerciseCount={exercises.length}
            />
            {confirming ? (
              finishConfirm
            ) : rest ? (
              restCard(null)
            ) : (
              <button
                type="button"
                onClick={onFinish}
                disabled={finishing}
                className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-base font-bold text-[var(--accent-foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                Terminar entrenamiento
              </button>
            )}
          </>
        ) : (
          <>
            {repeatedThisWeek && !hasStarted ? (
              <p className="text-[13px] text-[var(--foreground-muted)]">
                Ya registraste este día esta semana. Si lo repetís, se guarda
                como otro entreno.
              </p>
            ) : null}

            <div
              ref={pagerRef}
              onScroll={onScroll}
              className="-mx-4 flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.routineItemId}
                  className="relative flex w-full shrink-0 snap-start px-4"
                  aria-hidden={mounted ? index !== panel : undefined}
                  inert={mounted && index !== panel ? true : undefined}
                >
                  <ExercisePanel
                    exercise={exercise}
                    draft={drafts[exercise.routineItemId]}
                    position={`${index + 1} de ${exercises.length}`}
                    selectedSet={selectedSets[exercise.routineItemId]}
                    resting={rest !== null}
                    action={actionFor(exercise)}
                    onSelectSet={(setIndex) =>
                      setSelectedSets((current) => ({
                        ...current,
                        [exercise.routineItemId]: setIndex,
                      }))
                    }
                    handlers={handlers}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ExerciseListSheet
        open={listOpen}
        rows={listRows}
        doneSets={doneSets}
        plannedSets={plannedSets}
        onOpenChange={setListOpen}
        onSelect={(index) => {
          setListOpen(false);
          scrollToPanel(index);
        }}
        onFinish={() => {
          setListOpen(false);
          if (doneSets >= plannedSets) {
            onFinish();
            return;
          }
          setConfirming(true);
        }}
      />
    </div>
  );
}

function ExercisePanel({
  exercise,
  draft,
  position,
  selectedSet,
  resting,
  action,
  onSelectSet,
  handlers,
}: {
  exercise: DayExercise;
  draft: Drafts[string];
  position: string;
  selectedSet: number | undefined;
  resting: boolean;
  action: React.ReactNode;
  onSelectSet: (index: number) => void;
  handlers: WorkoutHandlers;
}) {
  const target = parsePlanTarget(exercise.target);
  const previous = exercise.history[0] ?? null;
  const { suggestion, phase } = exercise.progression;
  const index = clampSet(
    selectedSet ?? currentSetIndex(draft, exercise),
    draft.sets.length
  );
  const set = draft.sets[index];
  const placeholder = buildPlaceholder({
    exercise,
    suggestion,
    target,
    previousSet: previous?.sets[index] ?? null,
  });
  const factor = timeFactor(exercise);
  const fields: StepperField[] =
    exercise.kind === "time"
      ? [
          {
            field: "secs",
            unit: factor === 60 ? "min" : "seg",
            label: `Serie ${index + 1}: ${
              factor === 60 ? "minutos" : "segundos"
            }`,
            value: set.secs,
            placeholder: placeholder.secs,
            allowDecimal: factor === 60,
          },
        ]
      : [
          {
            field: "kg",
            unit: exercise.kind === "bodyweight" ? "+kg" : "kg",
            label: `Serie ${index + 1}: ${
              exercise.kind === "bodyweight" ? "lastre en kg" : "kg"
            }`,
            value: set.kg,
            placeholder: placeholder.kg,
            allowDecimal: true,
          },
          {
            field: "reps",
            unit: "reps",
            label: `Serie ${index + 1}: reps`,
            value: set.reps,
            placeholder: placeholder.reps,
            allowDecimal: false,
          },
        ];

  const previousSet = previous?.sets[index] ?? null;
  const previousLabel =
    previousSet && isValidSet(previousSet)
      ? `Anterior ${formatCompactSet(
          previousSet,
          previous?.kind ?? exercise.kind
        )}`
      : "Sin registro anterior";

  const rows: SetRow[] = draft.sets.map((draftSet, rowIndex) => {
    const done = isValidSet(toLoggedSet(draftSet, exercise));
    const rowPlaceholder = buildPlaceholder({
      exercise,
      suggestion,
      target,
      previousSet: previous?.sets[rowIndex] ?? null,
    });

    return {
      value: describeSet(done ? draftSet : rowPlaceholder, exercise),
      state: done ? "done" : rowIndex === index ? "current" : "pending",
    };
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 short:gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3 short:gap-2">
        <ExerciseStage
          imageUrl={exercise.exercise.imageUrl}
          name={exercise.exercise.name}
          position={position}
          hasHistory={exercise.history.length > 0}
          onTechnique={() => handlers.onShowDetail(exercise)}
          onHistory={() => handlers.onShowHistory(exercise)}
        />

        <div className="grid gap-1">
          <h1 className="font-display text-[1.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--foreground)]">
            {exercise.exercise.name}
          </h1>
          <p className="text-[13px] text-[var(--foreground-muted)]">
            {exercise.series} × {exercise.target} · RIR {exercise.rir} · descanso{" "}
            {exercise.rest}
          </p>
        </div>
      </div>

      <div className="grid gap-3 short:gap-2">
        {resting ? null : (
          <SetFocus
            setLabel={`Serie ${index + 1} de ${exercise.series}`}
            previousLabel={previousLabel}
            suggestion={describeSuggestion({
              suggestion,
              phase,
              target,
              exercise,
              hasHistory: Boolean(previous),
            })}
            fields={fields}
            onChange={(field, value) =>
              handlers.onField(exercise, index, field, value)
            }
            onStep={(field, direction) =>
              handlers.onField(
                exercise,
                index,
                field,
                stepValue({
                  value:
                    fields.find((candidate) => candidate.field === field)
                      ?.value ?? "",
                  placeholder:
                    fields.find((candidate) => candidate.field === field)
                      ?.placeholder ?? "",
                  field,
                  exercise,
                  direction,
                })
              )
            }
          />
        )}

        {action}
      </div>

      <SetList rows={rows} onSelect={onSelectSet} />
    </div>
  );
}

function clampSet(index: number, length: number) {
  return Math.min(Math.max(0, index), Math.max(0, length - 1));
}

function activeSetIndex(
  exercise: DayExercise,
  draft: Drafts[string],
  selected: Record<string, number>
) {
  return clampSet(
    selected[exercise.routineItemId] ?? currentSetIndex(draft, exercise),
    draft.sets.length
  );
}

/** La serie sobre la que actúa el CTA ya está registrada: deshace en vez de volver a marcar. */
function activeSetDone(
  exercise: DayExercise,
  draft: Drafts[string],
  selected: Record<string, number>
) {
  const index = activeSetIndex(exercise, draft, selected);

  return isValidSet(toLoggedSet(draft.sets[index], exercise));
}

function placeholderFor(
  exercise: DayExercise,
  draft: Drafts[string],
  index: number
) {
  const target = parsePlanTarget(exercise.target);
  const previous = exercise.history[0] ?? null;

  return buildPlaceholder({
    exercise,
    suggestion: exercise.progression.suggestion,
    target,
    previousSet: previous?.sets[index] ?? null,
  });
}

/** Próxima serie a cargar, para adelantarla durante el descanso. */
function nextSetLabel(exercise: DayExercise, draft: Drafts[string]) {
  const index = currentSetIndex(draft, exercise);

  if (isValidSet(toLoggedSet(draft.sets[index], exercise))) return null;

  return `serie ${index + 1} · ${describeSet(
    placeholderFor(exercise, draft, index),
    exercise
  )}`;
}

/** "40 × 10", "+10 × 8", "45 seg". Vacío queda como guion. */
function describeSet(set: DraftSet, exercise: DayExercise) {
  if (exercise.kind === "time") {
    return set.secs
      ? `${set.secs} ${timeFactor(exercise) === 60 ? "min" : "seg"}`
      : "—";
  }

  const reps = set.reps || "—";

  if (!set.kg) return `${reps} reps`;

  return `${exercise.kind === "bodyweight" ? "+" : ""}${set.kg} × ${reps}`;
}
