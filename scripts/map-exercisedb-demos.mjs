import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const DEFAULT_OUT = path.join(PROJECT_ROOT, "scripts", "media", "exercisedb-demo-report.json");
const EXERCISEDB_BASE_URL = "https://exercisedb.p.rapidapi.com";
const EXERCISEDB_HOST = "exercisedb.p.rapidapi.com";
const MIN_APPLY_SCORE = 6;

loadDotEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const EXERCISE_SEARCH_TERMS = {
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

const EQUIPMENT_TERMS = {
  Barra: ["barbell", "ez bar"],
  Mancuernas: ["dumbbell"],
  Maquina: ["machine", "lever"],
  Polea: ["cable"],
  "Peso corporal": ["body weight", "bodyweight"],
  Kettlebell: ["kettlebell"],
};

const MUSCLE_TERMS = {
  Pecho: ["chest", "pectorals"],
  Espalda: ["back", "lats"],
  Piernas: ["legs", "glutes", "quads", "hamstrings", "calves"],
  Hombros: ["shoulders", "delts"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Core: ["waist", "abs", "core"],
};

async function main() {
  const apply = process.argv.includes("--apply");
  const outPath = resolveArg("--out") ?? DEFAULT_OUT;
  const apiKey = getExerciseDbApiKey();

  if (!apiKey) {
    throw new Error("Missing EXERCISEDB_API_KEY or EXERCISEDB_RAPIDAPI_KEY");
  }

  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const exercises = await fetchExercises(supabase);
  const results = [];

  for (const exercise of exercises) {
    const searchTerm = resolveSearchTerm(exercise.name);
    const candidates = await searchExerciseDb(searchTerm, apiKey);
    const ranked = rankCandidates(candidates, {
      name: searchTerm,
      muscleGroup: exercise.muscle_group,
      equipment: exercise.equipment,
    });
    const best = ranked[0] ?? null;

    results.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      currentExerciseDbId: exercise.exercisedb_id,
      searchTerm,
      status: best && best.score >= MIN_APPLY_SCORE ? "matched" : "needs-review",
      selected: best,
      candidates: ranked.slice(0, 5),
    });
  }

  if (apply) {
    const updates = results.filter(
      (result) => result.status === "matched" && result.selected && result.currentExerciseDbId !== result.selected.id,
    );

    for (const update of updates) {
      const { error } = await supabase
        .from("exercises")
        .update({ exercisedb_id: update.selected.id })
        .eq("id", update.exerciseId);

      if (error) {
        throw new Error(`Could not update ${update.exerciseName}: ${error.message}`);
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: apply ? "apply" : "dry-run",
    minApplyScore: MIN_APPLY_SCORE,
    totals: {
      exercises: results.length,
      matched: results.filter((result) => result.status === "matched").length,
      needsReview: results.filter((result) => result.status === "needs-review").length,
      updated: apply
        ? results.filter(
            (result) =>
              result.status === "matched" && result.selected && result.currentExerciseDbId !== result.selected.id,
          ).length
        : 0,
    },
    results,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(
    `${report.mode}: ${report.totals.matched}/${report.totals.exercises} matched, ${report.totals.needsReview} need review, ${report.totals.updated} updated`,
  );
  console.log(`Report: ${path.relative(PROJECT_ROOT, outPath)}`);
}

async function fetchExercises(supabase) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment, video_url, exercisedb_id")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not fetch exercises: ${error.message}`);
  }

  return data ?? [];
}

async function searchExerciseDb(name, apiKey) {
  const url = new URL(`/exercises/name/${encodeURIComponent(name)}`, EXERCISEDB_BASE_URL);
  url.searchParams.set("limit", "10");

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": EXERCISEDB_HOST,
    },
  });

  if (!response.ok) {
    throw new Error(`ExerciseDB request failed for "${name}": ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function rankCandidates(candidates, exercise) {
  return candidates
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      bodyPart: candidate.bodyPart,
      target: candidate.target,
      equipment: candidate.equipment,
      score: scoreCandidate(candidate, exercise),
    }))
    .sort((left, right) => right.score - left.score);
}

function scoreCandidate(candidate, exercise) {
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

function resolveSearchTerm(name) {
  const normalized = normalizeText(name);
  return EXERCISE_SEARCH_TERMS[normalized] ?? normalized;
}

function includesAny(value, terms) {
  const normalized = normalizeText(value ?? "");
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function resolveArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function getExerciseDbApiKey() {
  return process.env.EXERCISEDB_API_KEY?.trim() || process.env.EXERCISEDB_RAPIDAPI_KEY?.trim() || "";
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function loadDotEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Optional local env file.
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
