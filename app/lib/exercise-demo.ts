import "server-only";

import { getExerciseById } from "@/app/lib/exercises";

const EXERCISEDB_BASE_URL = "https://exercisedb.p.rapidapi.com";
const EXERCISEDB_HOST = "exercisedb.p.rapidapi.com";
const DEFAULT_DEMO_RESOLUTION = "360";
const ALLOWED_RESOLUTIONS = new Set(["180", "360", "720", "1080"]);

type ExerciseDbExercise = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  instructions?: string[];
  description?: string;
  difficulty?: string;
  category?: string;
};

export type ExerciseDemo =
  | {
      available: true;
      source: "manual" | "exercisedb";
      name: string;
      mediaUrl: string;
      mediaType: "video" | "gif";
      providerExerciseId?: string;
      instructions?: string[];
      imageUrl?: string;
    }
  | {
      available: false;
      reason: "missing-api-key" | "not-found" | "provider-error";
      message: string;
    };

const EXERCISE_SEARCH_TERMS: Record<string, string> = {
  "abduccion de cadera": "hip abduction",
  "aperturas con mancuernas": "dumbbell fly",
  "cruce de poleas": "cable crossover",
  "crunch abdominal": "crunch",
  "curl alterno mancuernas": "alternate dumbbell curl",
  "curl barra recta": "barbell curl",
  "curl concentrado": "concentration curl",
  "curl en polea": "cable curl",
  "curl femoral acostado": "lying leg curl",
  "curl inclinado": "incline dumbbell curl",
  "curl martillo": "hammer curl",
  "curl predicador": "preacher curl",
  "dominadas pronas": "pull up",
  "dominadas supinas": "chin up",
  "elevacion de piernas": "leg raise",
  "elevaciones frontales": "front raise",
  "elevaciones laterales": "lateral raise",
  "encogimientos trapecio": "shrug",
  "extension cuerda sobre cabeza": "overhead cable triceps extension",
  "extension de cuadriceps": "leg extension",
  "extension triceps mancuerna": "dumbbell triceps extension",
  "extension triceps polea": "triceps pushdown",
  "face pull": "face pull",
  "farmer walk": "farmer walk",
  "flexion diamante": "diamond push up",
  "flexiones de brazos": "push up",
  "fondos banco": "bench dip",
  "fondos en paralelas": "parallel bar dip",
  "gemelos de pie": "standing calf raise",
  "hip thrust": "hip thrust",
  "jalon al pecho": "lat pulldown",
  "mountain climbers": "mountain climber",
  "pajaros posteriores": "rear delt fly",
  "pallof press": "pallof press",
  "patada triceps": "triceps kickback",
  "peso muerto convencional": "deadlift",
  "peso muerto rumano": "romanian deadlift",
  "plancha frontal": "plank",
  "prensa 45": "leg press",
  "press arnold": "arnold press",
  "press banca inclinado": "incline dumbbell bench press",
  "press banca plano": "barbell bench press",
  "press cerrado": "close grip bench press",
  "press en maquina pecho": "chest press",
  "press hombros sentado": "seated dumbbell shoulder press",
  "press militar de pie": "standing military press",
  "pull over con mancuerna": "dumbbell pullover",
  "pullover en polea": "cable pullover",
  "remo al menton": "upright row",
  "remo con barra": "barbell row",
  "remo con mancuerna": "dumbbell row",
  "remo sentado en polea": "seated cable row",
  "rompecraneos barra z": "ez bar skullcrusher",
  "rueda abdominal": "ab wheel rollout",
  "russian twist": "russian twist",
  "sentadilla frontal": "front squat",
  "sentadilla goblet": "goblet squat",
  "sentadilla trasera": "barbell squat",
  "step up con mancuernas": "dumbbell step up",
  "zancadas caminando": "walking lunge",
};

const EQUIPMENT_TERMS: Record<string, string[]> = {
  Barra: ["barbell", "ez bar"],
  Mancuernas: ["dumbbell"],
  Maquina: ["machine", "lever"],
  Polea: ["cable"],
  "Peso corporal": ["body weight", "bodyweight"],
  Kettlebell: ["kettlebell"],
};

const MUSCLE_TERMS: Record<string, string[]> = {
  Pecho: ["chest", "pectorals"],
  Espalda: ["back", "lats"],
  Piernas: ["legs", "glutes", "quads", "hamstrings", "calves"],
  Hombros: ["shoulders", "delts"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Core: ["waist", "abs", "core"],
};

export async function getExerciseDemo(exerciseId: string): Promise<ExerciseDemo | null> {
  const exercise = await getExerciseById(exerciseId);

  if (!exercise) {
    return null;
  }

  if (exercise.videoUrl) {
    return {
      available: true,
      source: "manual",
      name: exercise.name,
      mediaUrl: exercise.videoUrl,
      mediaType: "video",
    };
  }

  const apiKey = getExerciseDbApiKey();

  if (!apiKey) {
    return {
      available: false,
      reason: "missing-api-key",
      message: "La demostracion no esta configurada.",
    };
  }

  if (exercise.exerciseDbId) {
    return {
      available: true,
      source: "exercisedb",
      name: exercise.name,
      mediaUrl: buildExerciseDbImageUrl(exercise.exerciseDbId),
      mediaType: "gif",
      providerExerciseId: exercise.exerciseDbId,
      instructions: exercise.steps,
      imageUrl: buildExerciseDbStaticImageUrl(exercise.exerciseDbId),
    };
  }

  const searchTerm = resolveSearchTerm(exercise.name);
  const candidates = await searchExerciseDb(searchTerm, apiKey);
  const match = findBestMatch(candidates, {
    name: searchTerm,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
  });

  if (!match) {
    return {
      available: false,
      reason: "not-found",
      message: "No encontramos una demostracion confiable para este ejercicio.",
    };
  }

  return {
    available: true,
    source: "exercisedb",
    name: match.name,
    mediaUrl: buildExerciseDbImageUrl(match.id),
    mediaType: "gif",
    providerExerciseId: match.id,
    instructions: match.instructions,
    imageUrl: buildExerciseDbStaticImageUrl(match.id),
  };
}

export async function fetchExerciseDbImage(providerExerciseId: string, resolution: string) {
  const apiKey = getExerciseDbApiKey();

  if (!apiKey) {
    return null;
  }

  const safeResolution = ALLOWED_RESOLUTIONS.has(resolution) ? resolution : DEFAULT_DEMO_RESOLUTION;
  const url = new URL("/image", EXERCISEDB_BASE_URL);
  url.searchParams.set("exerciseId", providerExerciseId);
  url.searchParams.set("resolution", safeResolution);

  return fetch(url, {
    cache: "no-store",
    headers: exerciseDbHeaders(apiKey),
  });
}

function getExerciseDbApiKey() {
  return process.env.EXERCISEDB_API_KEY?.trim() || process.env.EXERCISEDB_RAPIDAPI_KEY?.trim() || "";
}

function buildExerciseDbImageUrl(providerExerciseId: string) {
  return `/api/exercises/demo-image?providerExerciseId=${encodeURIComponent(providerExerciseId)}&resolution=${DEFAULT_DEMO_RESOLUTION}`;
}

function buildExerciseDbStaticImageUrl(providerExerciseId: string) {
  return `/api/exercises/demo-image?providerExerciseId=${encodeURIComponent(providerExerciseId)}&resolution=360`;
}

async function searchExerciseDb(name: string, apiKey: string) {
  const url = new URL(`/exercises/name/${encodeURIComponent(name)}`, EXERCISEDB_BASE_URL);
  url.searchParams.set("limit", "10");

  const response = await fetch(url, {
    cache: "no-store",
    headers: exerciseDbHeaders(apiKey),
  });

  if (!response.ok) {
    throw new Error(`ExerciseDB request failed: ${response.status}`);
  }

  const data: unknown = await response.json();
  return Array.isArray(data) ? (data as ExerciseDbExercise[]) : [];
}

function exerciseDbHeaders(apiKey: string) {
  return {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": EXERCISEDB_HOST,
  };
}

function resolveSearchTerm(name: string) {
  const normalized = normalizeText(name);
  return EXERCISE_SEARCH_TERMS[normalized] ?? normalized;
}

function findBestMatch(
  candidates: ExerciseDbExercise[],
  exercise: { name: string; muscleGroup: string | null; equipment: string | null },
) {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, exercise),
    }))
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  return best && best.score >= 4 ? best.candidate : null;
}

function scoreCandidate(
  candidate: ExerciseDbExercise,
  exercise: { name: string; muscleGroup: string | null; equipment: string | null },
) {
  const candidateName = normalizeText(candidate.name);
  const searchName = normalizeText(exercise.name);
  let score = 0;

  if (candidateName === searchName) {
    score += 6;
  } else if (candidateName.includes(searchName) || searchName.includes(candidateName)) {
    score += 4;
  } else {
    const tokens = searchName.split(" ").filter((token) => token.length > 2);
    score += tokens.filter((token) => candidateName.includes(token)).length;
  }

  if (exercise.equipment && includesAny(candidate.equipment, EQUIPMENT_TERMS[exercise.equipment] ?? [])) {
    score += 2;
  }

  if (
    exercise.muscleGroup &&
    (includesAny(candidate.bodyPart, MUSCLE_TERMS[exercise.muscleGroup] ?? []) ||
      includesAny(candidate.target, MUSCLE_TERMS[exercise.muscleGroup] ?? []))
  ) {
    score += 2;
  }

  return score;
}

function includesAny(value: string, terms: string[]) {
  const normalized = normalizeText(value);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
