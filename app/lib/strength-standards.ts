import {
  LIFT_AGE_CURVE,
  PLANK_AGE_CURVE,
  STRENGTH_STANDARD_TABLES,
  type StandardRow,
  type StrengthStandardKey,
} from "@/app/lib/strength-standards-data";
import { findBestSet, isValidSet, type ExerciseKind, type LoggedSet } from "@/app/lib/workout-progression";

/**
 * Nivel de fuerza por grupo muscular (docs/STRENGTH_STANDARDS.md §9–§14).
 * Manda un solo ejercicio por grupo: el de mayor prioridad que esté en la rutina activa y tenga registro.
 * Se compara su mejor 1RM estimado (o su mejor tiempo) contra la tabla de StrengthLevel para el sexo,
 * el peso corporal (interpolado) y la edad del usuario.
 */

export const STRENGTH_GROUPS = [
  "Pecho",
  "Espalda",
  "Cuadriceps",
  "Isquios",
  "Gluteos",
  "Hombros",
  "Biceps",
  "Triceps",
  "Core",
] as const;
export type StrengthGroup = (typeof STRENGTH_GROUPS)[number];

export const STRENGTH_LEVELS = ["principiante", "novato", "intermedio", "avanzado", "elite"] as const;
export type StrengthLevel = (typeof STRENGTH_LEVELS)[number];
/** Élite no se divide: su división es null. */
export type StrengthDivision = 1 | 2 | 3;

export type StrengthSex = "male" | "female";
export type StrengthProfile = { sex: StrengthSex; bodyweightKg: number; age: number };

type MeasurementExercise = {
  /** Nombre exacto del ejercicio en el catálogo. */
  name: string;
  standard: StrengthStandardKey;
  /** Versión a un brazo de un ejercicio bilateral: el peso cuenta doble contra la tabla bilateral. */
  multiplier?: number;
};

/** Ejercicios de medición en orden de prioridad (§9, §11, §12, §14). */
export const MEASUREMENT_EXERCISES: Record<StrengthGroup, readonly MeasurementExercise[]> = {
  Pecho: [
    { name: "Press banca plano", standard: "bench-press" },
    { name: "Press banca inclinado", standard: "incline-dumbbell-bench-press" },
    { name: "Press en maquina pecho", standard: "chest-press" },
  ],
  Espalda: [
    { name: "Jalon al pecho", standard: "lat-pulldown" },
    { name: "Remo sentado en polea", standard: "seated-cable-row" },
  ],
  Cuadriceps: [
    { name: "Sentadilla trasera", standard: "squat" },
    { name: "Extension de cuadriceps", standard: "leg-extension" },
  ],
  Isquios: [
    { name: "Peso muerto rumano", standard: "romanian-deadlift" },
    { name: "Curl femoral acostado", standard: "lying-leg-curl" },
    { name: "Curl de piernas", standard: "seated-leg-curl" },
  ],
  Gluteos: [
    { name: "Hip thrust", standard: "hip-thrust" },
    { name: "Patada de gluteo en polea", standard: "cable-kickback" },
  ],
  Hombros: [
    { name: "Press militar de pie", standard: "military-press" },
    { name: "Press hombros sentado", standard: "dumbbell-shoulder-press" },
    { name: "Elevaciones laterales en polea", standard: "cable-lateral-raise" },
  ],
  Biceps: [
    { name: "Curl barra recta", standard: "barbell-curl" },
    { name: "Curl alterno mancuernas", standard: "dumbbell-curl" },
    { name: "Curl martillo", standard: "hammer-curl" },
  ],
  Triceps: [
    { name: "Extension triceps polea", standard: "tricep-pushdown" },
    { name: "Rompecraneos barra z", standard: "lying-tricep-extension" },
    { name: "Extensión de tríceps en polea unilateral", standard: "tricep-pushdown", multiplier: 2 },
  ],
  Core: [{ name: "Plancha frontal", standard: "plank" }],
};

/** Comparación de nombres sin tildes ni mayúsculas. */
export function normalizeExerciseName(name: string) {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

export const MEASUREMENT_EXERCISE_NAMES = new Set(
  Object.values(MEASUREMENT_EXERCISES).flatMap((exercises) => exercises.map(({ name }) => normalizeExerciseName(name))),
);

/** Mejor marca de un ejercicio: 1RM estimado en kg, o segundos para la plancha. */
export type StrengthRecord =
  | { unit: "kg"; value: number; kg: number; reps: number }
  | { unit: "s"; value: number };

/** Mejor marca de una sesión: series `reps` por 1RM estimado (Epley, 1–12 reps), series `time` por segundos. */
export function bestStrengthRecord(kind: ExerciseKind, sets: LoggedSet[]): StrengthRecord | null {
  if (kind === "time") {
    const secs = Math.max(0, ...sets.filter(isValidSet).map((set) => set.secs ?? 0));
    return secs > 0 ? { unit: "s", value: secs } : null;
  }

  const best = findBestSet(sets, kind);
  return best ? { unit: "kg", value: best.e1rm, kg: best.kg, reps: best.reps } : null;
}

/** Se queda con la mejor de dos marcas del mismo ejercicio. */
export function betterRecord(current: StrengthRecord | undefined, next: StrengthRecord) {
  return !current || next.value > current.value ? next : current;
}

function interpolate(points: ReadonlyArray<readonly [number, number]>, x: number) {
  if (x <= points[0][0]) return points[0][1];
  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    if (x <= x1) {
      const [x0, y0] = points[index - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/** Factor de edad: 1 hasta los 40 (plancha: 50) y después la curva de StrengthLevel. */
export function ageFactor(standard: StrengthStandardKey, age: number) {
  return interpolate(standard === "plank" ? PLANK_AGE_CURVE : LIFT_AGE_CURVE, age);
}

/**
 * Cortes Principiante/Novato/Intermedio/Avanzado/Élite para el peso corporal (interpolado entre filas; fuera
 * de la tabla se usa la fila del extremo) y ajustados por edad.
 */
export function strengthThresholds(standard: StrengthStandardKey, profile: StrengthProfile) {
  const rows: readonly StandardRow[] = STRENGTH_STANDARD_TABLES[standard][profile.sex];
  const factor = ageFactor(standard, profile.age);

  return [1, 2, 3, 4, 5].map(
    (column) => interpolate(rows.map((row) => [row[0], row[column]] as const), profile.bodyweightKg) * factor,
  ) as [number, number, number, number, number];
}

/**
 * Nivel y división de una marca. Cada nivel (menos Élite) se parte en tercios del tramo en kg hasta el nivel
 * siguiente. Por debajo del corte de Principiante cuenta como Principiante 1.
 */
export function resolveStrengthLevel(
  value: number,
  thresholds: readonly number[],
): { level: StrengthLevel; division: StrengthDivision | null } {
  if (value >= thresholds[4]) {
    return { level: "elite", division: null };
  }

  let band = 0;
  while (band < 3 && value >= thresholds[band + 1]) band += 1;

  const lower = thresholds[band];
  const step = (thresholds[band + 1] - lower) / 3;
  const division: StrengthDivision = value < lower + step ? 1 : value < lower + 2 * step ? 2 : 3;

  return { level: STRENGTH_LEVELS[band], division };
}

export type MuscleStrengthSummary = {
  muscleGroup: StrengthGroup;
  /** Ejercicios de medición del grupo que están en la rutina activa, por prioridad. */
  candidates: string[];
  /** Ejercicio que midió; null = sin datos. */
  exerciseName: string | null;
  /** Mejor serie tal como se registró (sin el ×2 unilateral). */
  record: StrengthRecord | null;
  /** La marca contó doble (ejercicio a un brazo contra la tabla bilateral). */
  doubled: boolean;
  level: StrengthLevel | null;
  division: StrengthDivision | null;
};

/**
 * Un resumen por grupo. Solo cuentan los ejercicios de medición que están en la rutina activa; entre ellos
 * manda el de mayor prioridad con registro, sin promedios.
 */
export function resolveMuscleStrength(args: {
  /** Mejor marca por ejercicio, con clave `normalizeExerciseName`. */
  records: ReadonlyMap<string, StrengthRecord>;
  /** Ejercicios de la rutina activa, con clave `normalizeExerciseName`. */
  activeExerciseNames: ReadonlySet<string>;
  profile: StrengthProfile;
}): MuscleStrengthSummary[] {
  return STRENGTH_GROUPS.map((muscleGroup) => {
    const inRoutine = MEASUREMENT_EXERCISES[muscleGroup].filter((exercise) =>
      args.activeExerciseNames.has(normalizeExerciseName(exercise.name)),
    );
    const candidates = inRoutine.map(({ name }) => name);

    for (const exercise of inRoutine) {
      const record = args.records.get(normalizeExerciseName(exercise.name));

      if (!record) continue;

      const multiplier = exercise.multiplier ?? 1;
      const { level, division } = resolveStrengthLevel(
        record.value * multiplier,
        strengthThresholds(exercise.standard, args.profile),
      );

      return { muscleGroup, candidates, exerciseName: exercise.name, record, doubled: multiplier > 1, level, division };
    }

    return { muscleGroup, candidates, exerciseName: null, record: null, doubled: false, level: null, division: null };
  });
}

/** Marca para mostrar: corta ("80 kg", "75 s") y completa ("80 kg × 8"). */
export function formatStrengthRecord(record: StrengthRecord) {
  if (record.unit === "s") {
    const short = `${record.value} s`;
    return { short, full: short };
  }

  const kg = String(record.kg).replace(".", ",");
  return { short: `${kg} kg`, full: `${kg} kg × ${record.reps}` };
}
