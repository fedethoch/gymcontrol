import type { ExerciseDetail } from "@/app/components/shared/ExerciseDetailModal";
import type { DraftSet, ExerciseDraft, ExercisePlan } from "@/app/lib/day-workout";
import type { LoggedSet, SetPlan } from "@/app/lib/workout-progression";
import type { ExerciseHistoryEntry } from "@/app/lib/workout-tracking";

/** Un ejercicio del día tal como llega del server: plan, ficha, lo guardado y el historial. */
export type DayExercise = ExercisePlan & {
  number: number;
  exercise: ExerciseDetail;
  rir: number;
  rest: string;
  saved: { id: string; sets: LoggedSet[]; rev: number } | null;
  history: ExerciseHistoryEntry[];
  /** Objetivo de hoy por serie según la progresión semanal (ver `planWeeklyProgression`). */
  progression: SetPlan[];
};

/** Handlers del registro: los dos árboles (mobile y desktop) usan los mismos. */
export type WorkoutHandlers = {
  onField: (exercise: DayExercise, index: number, field: "kg" | "reps" | "secs", value: string) => void;
  onToggleDone: (exercise: DayExercise, index: number, placeholder: DraftSet) => void;
  onShowDetail: (exercise: DayExercise) => void;
  onShowHistory: (exercise: DayExercise) => void;
};

export type Drafts = Record<string, ExerciseDraft>;
