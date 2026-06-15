export const EXERCISE_MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Biceps",
  "Triceps",
  "Core",
] as const;

export const EXERCISE_EQUIPMENT_OPTIONS = [
  "Barra",
  "Mancuernas",
  "Maquina",
  "Polea",
  "Peso corporal",
  "Kettlebell",
] as const;

export type ExerciseMuscleGroup = (typeof EXERCISE_MUSCLE_GROUPS)[number];
export type ExerciseEquipment = (typeof EXERCISE_EQUIPMENT_OPTIONS)[number];

export type ExerciseFormField =
  | "name"
  | "description"
  | "imageUrl"
  | "muscleGroup"
  | "equipment"
  | "videoUrl"
  | "minReps"
  | "maxReps"
  | "steps"
  | "tips";

export type ExerciseFormPayload = {
  exerciseId?: string;
  name: string;
  description: string;
  imageUrl: string;
  muscleGroup: string;
  equipment: string;
  videoUrl: string;
  minReps: string;
  maxReps: string;
  steps: string[];
  tips: string[];
};

export type ExerciseFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Partial<Record<ExerciseFormField, string>>;
};

export const INITIAL_EXERCISE_FORM_STATE: ExerciseFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export const MUSCLE_LABELS: Record<string, string> = {
  Biceps: "Bíceps",
  Triceps: "Tríceps",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  Maquina: "Máquina",
};

export const MUSCLE_BADGE_STYLES: Record<string, string> = {
  Pecho: "border-[#5b2ab3] bg-[#251740] text-[#eee0ff]",
  Espalda: "border-[#1a3a7b] bg-[#0c1e42] text-[#bdd4ff]",
  Piernas: "border-[#255936] bg-[#101f15] text-[#b8f0c4]",
  Hombros: "border-[#5a3c00] bg-[#221500] text-[#ffe09a]",
  Biceps: "border-[#521a8a] bg-[#1e0b38] text-[#e5b8ff]",
  Triceps: "border-[#7a2e10] bg-[#2d1008] text-[#ffb894]",
  Core: "border-[#323949] bg-[#141a26] text-[#b0bcd4]",
};

export const MUSCLE_GRADIENTS: Record<string, string> = {
  Pecho: "linear-gradient(140deg,#2e1a58 0%,#141828 55%,#08090f 100%)",
  Espalda: "linear-gradient(135deg,#0f2040 0%,#0c1424 55%,#060810 100%)",
  Piernas: "linear-gradient(140deg,#0e2612 0%,#0d1820 50%,#070a10 100%)",
  Hombros: "linear-gradient(140deg,#2e1c00 0%,#181420 50%,#080a12 100%)",
  Biceps: "linear-gradient(140deg,#280d40 0%,#160f26 50%,#080810 100%)",
  Triceps: "linear-gradient(140deg,#321005 0%,#1a1020 50%,#090810 100%)",
  Core: "linear-gradient(140deg,#141c32 0%,#0d1522 50%,#070910 100%)",
};

export function muscleLabel(value: string | null) {
  if (!value) return null;
  return MUSCLE_LABELS[value] ?? value;
}

export function equipmentLabel(value: string | null) {
  if (!value) return null;
  return EQUIPMENT_LABELS[value] ?? value;
}
