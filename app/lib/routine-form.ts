import type { RoutineDifficulty, RoutineObjective } from "@/app/lib/routine-metadata";

export type RoutineFormField = "name" | "description" | "difficulty" | "objective";

export type RoutineItemFormField =
  | "exerciseId"
  | "series"
  | "repetitions"
  | "rir"
  | "rest";

export type RoutineFormItemPayload = {
  id?: string;
  clientId: string;
  exerciseId: string;
  series: string;
  repetitions: string;
  rir: string;
  rest: string;
};

export type RoutineFormDayPayload = {
  id?: string;
  clientId: string;
  dayName: string;
  items: RoutineFormItemPayload[];
};

export type RoutineFormPayload = {
  routineId?: string;
  name: string;
  description: string;
  difficulty: RoutineDifficulty | "";
  objective: RoutineObjective | "";
  days: RoutineFormDayPayload[];
};

export type RoutineItemWriteInput = {
  exerciseId: string;
  series: number;
  repetitions: string;
  rir: number;
  rest: string;
  rowOrder: number;
};

export type RoutineDayWriteInput = {
  dayOrder: number;
  dayName: string;
  items: RoutineItemWriteInput[];
};

export type RoutineWriteInput = {
  name: string;
  description: string;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  days: RoutineDayWriteInput[];
};

export type RoutineStructureErrors = {
  days?: string;
  dayErrors: Record<
    string,
    {
      dayName?: string;
      items?: string;
      itemErrors: Record<string, Partial<Record<RoutineItemFormField, string>>>;
    }
  >;
};

export type RoutineFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Partial<Record<RoutineFormField, string>>;
  structureErrors: RoutineStructureErrors;
};

export const INITIAL_ROUTINE_FORM_STATE: RoutineFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  structureErrors: {
    dayErrors: {},
  },
};
