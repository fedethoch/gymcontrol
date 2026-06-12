export const ROUTINE_DIFFICULTIES = [
  "principiante",
  "intermedio",
  "avanzado",
] as const;

export const ROUTINE_OBJECTIVES = [
  "hipertrofia",
  "fuerza",
  "mantenimiento",
] as const;

export type RoutineDifficulty = (typeof ROUTINE_DIFFICULTIES)[number];
export type RoutineObjective = (typeof ROUTINE_OBJECTIVES)[number];

export const ROUTINE_DIFFICULTY_LABELS: Record<RoutineDifficulty, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const ROUTINE_OBJECTIVE_LABELS: Record<RoutineObjective, string> = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  mantenimiento: "Mantenimiento",
};
