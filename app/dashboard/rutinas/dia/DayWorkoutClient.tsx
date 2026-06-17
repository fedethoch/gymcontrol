"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Clock3, Dumbbell, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { autosaveWorkoutSessionItemAction } from "@/app/dashboard/rutinas/dia/actions";
import {
  ExerciseDetailModal,
  type ExerciseDetail,
} from "@/app/components/shared/ExerciseDetailModal";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { AnimatedProgressRing } from "@/app/components/ui/ProgressRing";
import { cn } from "@/app/lib/utils";

const AUTOSAVE_DELAY_MS = 700;

function splitSeriesValues(value: string, series: number) {
  const parts = value.split("/").map((part) => part.trim());

  return Array.from({ length: Math.max(series, 0) }, (_, i) => parts[i] ?? "");
}

function joinSeriesValues(values: string[], index: number, nextValue: string) {
  const next = [...values];
  next[index] = nextValue;

  return next.join("/");
}

function isAtOrAboveMaxReps(value: string, maxReps: number) {
  const tokens = value.split("/").map((token) => Number.parseFloat(token.trim()));
  const lastValue = tokens.at(-1);

  return lastValue != null && !Number.isNaN(lastValue) && lastValue >= maxReps;
}

type DayWorkoutRow = {
  id: string;
  number: number;
  exercise: ExerciseDetail;
  series: number;
  repsTarget: string;
  rir: string;
  rest: string;
  performedReps: string | null;
  usedWeight: string | null;
  isCompleted: boolean;
};

type DayWorkoutClientProps = {
  savedRoutineId: string;
  routineDayId: string;
  routineName: string;
  difficultyLabel: string;
  dayOrder: number;
  dayName: string;
  rows: DayWorkoutRow[];
  sessionStatus: "in_progress" | "completed" | null;
};

type DraftState = {
  performedReps: string;
  usedWeight: string;
};

type RowSaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

export function DayWorkoutClient({
  savedRoutineId,
  routineDayId,
  routineName,
  difficultyLabel,
  dayOrder,
  dayName,
  rows,
  sessionStatus,
}: DayWorkoutClientProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.id,
        {
          performedReps: row.performedReps?.toString() ?? "",
          usedWeight: row.usedWeight?.toString() ?? "",
        },
      ]),
    ),
  );
  const [completedByItemId, setCompletedByItemId] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.isCompleted])),
  );
  const [saveStateByItemId, setSaveStateByItemId] = useState<Record<string, RowSaveState>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, { status: "idle" } satisfies RowSaveState])),
  );
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});
  const requestVersionRef = useRef<Record<string, number>>({});
  const [, startAutosaveTransition] = useTransition();
  const isCompletedSession = sessionStatus === "completed";

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of Object.values(timers)) {
        if (timer) {
          clearTimeout(timer);
        }
      }
    };
  }, []);

  const completedCount = useMemo(
    () => rows.reduce((total, row) => total + (completedByItemId[row.id] ? 1 : 0), 0),
    [completedByItemId, rows],
  );
  const progressPercent = rows.length > 0 ? Math.round((completedCount / rows.length) * 100) : 0;

  function isAllCompleted(overrideId?: string, overrideValue?: boolean) {
    return rows.every((row) => {
      if (overrideId && row.id === overrideId) {
        return overrideValue;
      }

      return completedByItemId[row.id] ?? false;
    });
  }

  function scheduleAutosave(
    routineItemId: string,
    draft: DraftState,
    isCompleted: boolean,
    immediate = false,
    complete = isAllCompleted(),
  ) {
    const existingTimer = timersRef.current[routineItemId];

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const runAutosave = () => {
      const nextVersion = (requestVersionRef.current[routineItemId] ?? 0) + 1;
      requestVersionRef.current[routineItemId] = nextVersion;
      setSaveStateByItemId((current) => ({
        ...current,
        [routineItemId]: { status: "saving" },
      }));

      startAutosaveTransition(async () => {
        const result = await autosaveWorkoutSessionItemAction({
          savedRoutineId,
          routineDayId,
          day: dayOrder,
          routineItemId,
          series: rows.find((row) => row.id === routineItemId)?.series ?? 0,
          performedReps: draft.performedReps,
          usedWeight: draft.usedWeight,
          isCompleted,
          complete,
        });

        if (requestVersionRef.current[routineItemId] !== nextVersion) {
          return;
        }

        setSaveStateByItemId((current) => ({
          ...current,
          [routineItemId]:
            result.status === "success"
              ? { status: "saved" }
              : { status: "error", message: result.message },
        }));
      });
    };

    if (immediate) {
      runAutosave();
      return;
    }

    timersRef.current[routineItemId] = setTimeout(runAutosave, AUTOSAVE_DELAY_MS);
  }

  function handleDraftChange(
    routineItemId: string,
    field: keyof DraftState,
    value: string,
  ) {
    setDrafts((current) => {
      const nextDraft = {
        ...(current[routineItemId] ?? { performedReps: "", usedWeight: "" }),
        [field]: value,
      };
      const nextDrafts = {
        ...current,
        [routineItemId]: nextDraft,
      };

      scheduleAutosave(routineItemId, nextDraft, completedByItemId[routineItemId] ?? false);

      return nextDrafts;
    });
  }

  function handleToggleCompleted(routineItemId: string) {
    const nextCompleted = !(completedByItemId[routineItemId] ?? false);
    setCompletedByItemId((current) => ({
      ...current,
      [routineItemId]: nextCompleted,
    }));

    scheduleAutosave(
      routineItemId,
      drafts[routineItemId] ?? { performedReps: "", usedWeight: "" },
      nextCompleted,
      true,
      isAllCompleted(routineItemId, nextCompleted),
    );
  }

  return (
    <>
      <div className="page-frame auto-rows-max content-start gap-4 bg-[radial-gradient(circle_at_12%_0%,rgba(137,76,255,0.16),transparent_32%),linear-gradient(180deg,#030a13_0%,#07111d_46%,#030812_100%)] xl:gap-4 xl:p-6">
        <header className="grid gap-1 sm:pt-1">
          <div className="flex items-start gap-4">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="mt-2 size-11 shrink-0 rounded-full border-[#253149] bg-[#07101b]/86 text-[#d8e0f1] hover:border-[#9d5cff] hover:bg-[#0b1524]"
            >
              <Link href="/dashboard/rutinas">
                <ArrowLeft className="size-5" />
                <span className="sr-only">Volver a mis rutinas</span>
              </Link>
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c25cff]">
                  Semana activa
                </p>
                {isCompletedSession ? (
                  <Badge
                    variant="success"
                    className="border-[#285f43] bg-[#0d2218] px-2.5 py-1 text-[10px] text-[#91efb5]"
                  >
                    Completado
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-2 font-display text-2xl font-semibold leading-none tracking-normal text-white sm:text-3xl lg:text-[2.65rem]">
                {`Dia ${dayOrder} - ${dayName}`}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#d3d8e4] sm:text-base">
                Completa tu entrenamiento de hoy y registra tu rendimiento
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-[#172236] bg-[linear-gradient(180deg,rgba(9,18,31,0.94),rgba(6,13,23,0.98))] px-5 py-3 shadow-[0_24px_70px_rgba(0,0,0,0.28)] xl:px-8 xl:py-4">
          {/* Mobile layout: ring left, data right */}
          <div className="flex items-center gap-5 xl:hidden">
            <AnimatedProgressRing
              value={progressPercent}
              size={69.6}
              strokeWidth={8}
              progressColor="#a855ff"
              trackColor="rgba(24,37,57,0.86)"
            >
              <div className="grid size-[3.35rem] place-items-center rounded-full border border-[#1c2b42] bg-[#07101b] text-center leading-none">
                <span className="text-sm font-semibold text-white">
                  {completedCount}/{rows.length}
                </span>
              </div>
            </AnimatedProgressRing>
            <div className="flex min-w-0 flex-col gap-3">
              <div>
                <p className="text-[10px] text-[#aeb8cc]">Tiempo estimado</p>
                <p className="text-sm font-semibold text-white">
                  {rows.length > 0 ? "60 min" : "Sin carga"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#aeb8cc]">Ejercicios</p>
                <p className="text-sm font-semibold text-white">{rows.length} ejercicios</p>
              </div>
            </div>
          </div>
          {/* Desktop layout: original 4-col grid */}
          <div className="hidden xl:grid xl:grid-cols-[1.35fr_0.8fr_0.95fr_1.25fr]">
            <SummaryMetric
              label="Rutina activa"
              labelClassName="text-base leading-6"
              value={routineName}
              trailing={
                <Badge
                  variant="accent"
                  className="border-[#4e2a92] bg-[#251345] px-3 py-1 text-[10px] text-[#caa6ff]"
                >
                  {difficultyLabel}
                </Badge>
              }
            />
            <SummaryMetric
              icon={Dumbbell}
              label="Ejercicios"
              value={`${rows.length} ejercicios`}
              className="xl:border-l xl:border-[#18263d] xl:pl-8"
            />
            <SummaryMetric
              icon={Clock3}
              label="Tiempo estimado"
              value={rows.length > 0 ? "60 min" : "Sin carga"}
              className="xl:border-l xl:border-[#18263d] xl:pl-8"
            />
            <div className="flex items-center gap-4 xl:border-l xl:border-[#18263d] xl:pl-8">
              <AnimatedProgressRing
                value={progressPercent}
                size={69.6}
                strokeWidth={8}
                progressColor="#a855ff"
                trackColor="rgba(24,37,57,0.86)"
              >
                <div className="grid size-[3.35rem] place-items-center rounded-full border border-[#1c2b42] bg-[#07101b] text-base font-medium text-white">
                  {progressPercent}%
                </div>
              </AnimatedProgressRing>
              <div className="min-w-0">
                <p className="text-sm leading-5 text-[#aeb8cc]">Progreso del dia</p>
                <p className="mt-1 text-lg font-medium leading-6 text-white">
                  {completedCount} de {rows.length} ejercicios
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold tracking-normal text-white sm:text-lg">
              Tu entrenamiento de hoy
            </h2>
          </div>

          {rows.length > 0 ? (
            <div className="grid gap-3">
              {rows.map((row, index) => {
                const draft = drafts[row.id] ?? { performedReps: "", usedWeight: "" };
                const isCompleted = completedByItemId[row.id] ?? false;
                const saveState = saveStateByItemId[row.id] ?? { status: "idle" };
                const isExpanded = expandedId === row.id;

                return (
                  <motion.article
                    key={row.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "overflow-hidden rounded-xl border bg-[linear-gradient(180deg,rgba(9,18,31,0.96),rgba(7,14,24,0.98))] shadow-[0_14px_36px_rgba(0,0,0,0.16)] transition-colors",
                      isCompleted ? "border-[#1e754a]" : "border-[#172236]",
                    )}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedId((current) => (current === row.id ? null : row.id));
                        }
                      }}
                      className="flex cursor-pointer items-center gap-4 px-5 py-3.5 xl:px-6"
                    >
                      <WorkoutStatusToggle
                        number={row.number}
                        complete={isCompleted}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleCompleted(row.id);
                        }}
                      />

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedExercise(row.exercise);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-base font-semibold leading-5 text-white underline-offset-4 hover:underline">
                          {row.exercise.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#8a93a8]">
                          {row.series} series · {row.repsTarget} reps · RIR {row.rir} · {row.rest}
                        </p>
                        <RowSaveIndicator state={saveState} className="mt-1" />
                      </button>

                      <ChevronDown
                        className={cn(
                          "size-5 shrink-0 text-[#7887a6] transition-transform",
                          isExpanded ? "rotate-180" : "",
                        )}
                      />
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="grid gap-4 border-t border-[#172236] px-5 py-4 xl:px-6">
                            <SeriesInputsGroup
                              rowId={row.id}
                              series={row.series}
                              performedReps={draft.performedReps}
                              usedWeight={draft.usedWeight}
                              onPerformedRepsChange={(value) =>
                                handleDraftChange(row.id, "performedReps", value)
                              }
                              onUsedWeightChange={(value) =>
                                handleDraftChange(row.id, "usedWeight", value)
                              }
                            />

                            {row.exercise.maxReps != null &&
                            isAtOrAboveMaxReps(draft.performedReps, row.exercise.maxReps) ? (
                              <div className="flex items-center gap-2 rounded-lg border border-[#3a2d5c] bg-[#1c1438] px-3 py-2 text-sm text-[#cbb8ff]">
                                <TrendingUp className="size-4 shrink-0" />
                                Llegaste al tope del rango ideal ({row.exercise.minReps}-
                                {row.exercise.maxReps} reps). Proba aumentar el peso la proxima serie.
                              </div>
                            ) : null}

                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 w-full rounded-lg border-[#26364f] bg-[#07111d] px-4 text-sm font-medium sm:w-auto sm:justify-self-start"
                              onClick={() => setSelectedExercise(row.exercise)}
                            >
                              Ver detalle
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#25324b] bg-[#08101b]/88 p-8 text-center">
              <p className="font-display text-2xl font-semibold text-white">
                Este dia todavia no tiene ejercicios
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#96a3be]">
                Cuando el admin cargue filas en esta plantilla, esta vista mostrara el registro real
                del entrenamiento y permitira finalizar la sesion del dia.
              </p>
            </div>
          )}
        </section>
      </div>

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={selectedExercise !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
      />
    </>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  labelClassName,
  value,
  className,
  trailing,
}: {
  icon?: typeof Dumbbell;
  label: string;
  labelClassName?: string;
  value: string;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-4", className)}>
      {Icon ? (
        <span className="grid size-10 shrink-0 place-items-center text-[#b9cdf5]">
          <Icon className="size-7 stroke-[1.6]" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className={cn("text-sm leading-5 text-[#aeb8cc]", labelClassName)}>{label}</p>
        <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-3">
          <p className="truncate text-xl font-semibold leading-6 text-white">{value}</p>
          {trailing}
        </div>
      </div>
    </div>
  );
}

function WorkoutStatusToggle({
  number,
  complete,
  onClick,
}: {
  number: number;
  complete: boolean;
  onClick: (event: MouseEvent) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={{ scale: complete ? [1, 1.15, 1] : 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full border text-base font-medium transition-colors",
        complete
          ? "border-[#35ea75] bg-[#0b2418] text-[#52f58a] shadow-[0_0_0_1px_rgba(53,234,117,0.18)]"
          : "border-[#2b3a54] bg-[#08111d] text-[#d7def0] hover:border-[#7d8dab]",
      )}
      aria-pressed={complete}
      aria-label={
        complete
          ? `Marcar ejercicio ${number} como pendiente`
          : `Marcar ejercicio ${number} como completado`
      }
    >
      {complete ? <Check className="size-6" /> : number}
    </motion.button>
  );
}

function RowSaveIndicator({
  state,
  className,
}: {
  state: RowSaveState;
  className?: string;
}) {
  if (state.status !== "error") {
    return null;
  }

  const config = { label: "Error", className: "text-[#ffb8c4]" };

  return (
    <span
      className={cn(
        "items-center text-[10px] font-semibold uppercase tracking-[0.14em]",
        config.className,
        className,
      )}
      title={state.status === "error" ? state.message : undefined}
    >
      {config.label}
    </span>
  );
}

function SeriesInputsGroup({
  rowId,
  series,
  performedReps,
  usedWeight,
  onPerformedRepsChange,
  onUsedWeightChange,
}: {
  rowId: string;
  series: number;
  performedReps: string;
  usedWeight: string;
  onPerformedRepsChange: (value: string) => void;
  onUsedWeightChange: (value: string) => void;
}) {
  const repsValues = splitSeriesValues(performedReps, series);
  const weightValues = splitSeriesValues(usedWeight, series);

  if (series <= 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7887a6]">
        <span />
        <span className="text-center">Reps</span>
        <span className="text-center">Peso (kg)</span>
      </div>
      {Array.from({ length: series }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2"
        >
          <span className="text-center text-xs font-semibold text-[#7887a6]">#{index + 1}</span>
          <SeriesCell
            name={`performedReps:${rowId}:${index}`}
            value={repsValues[index] ?? ""}
            onChange={(value) =>
              onPerformedRepsChange(joinSeriesValues(repsValues, index, value))
            }
          />
          <SeriesCell
            name={`usedWeight:${rowId}:${index}`}
            value={weightValues[index] ?? ""}
            onChange={(value) => onUsedWeightChange(joinSeriesValues(weightValues, index, value))}
          />
        </div>
      ))}
    </div>
  );
}

function SeriesCell({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputMode="decimal"
      className="h-10 w-full rounded-md border-[#20304a] bg-[#07111d] text-center text-base text-white placeholder:text-[#748098]"
    />
  );
}
