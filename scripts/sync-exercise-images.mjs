/**
 * Downloads exercise images from free-exercise-db and uploads them to Supabase Storage.
 * Naming convention: exercise-images/{slug}.png where slug = lowercased name, no diacritics, no non-alphanumeric.
 *
 * Usage:
 *   node scripts/sync-exercise-images.mjs            # dry run (report only)
 *   node scripts/sync-exercise-images.mjs --apply    # download + upload + save
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const PROJECT_ROOT = process.cwd();
const FREE_EXERCISE_DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const FREE_EXERCISE_DB_IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
const BUCKET = "exercise-images";
const MIN_SCORE = 6;

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
  Barra: ["barbell", "ez bar", "ez-bar"],
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

  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  console.log("Fetching exercises from DB…");
  const exercises = await fetchDbExercises(supabase);
  console.log(`  ${exercises.length} exercises`);

  console.log("Fetching free-exercise-db…");
  const freeDb = await fetchFreeExerciseDb();
  console.log(`  ${freeDb.length} exercises in source`);

  const matched = [];
  const unmatched = [];

  for (const exercise of exercises) {
    const searchTerm = resolveSearchTerm(exercise.name);
    const best = findBestMatch(freeDb, searchTerm, exercise);

    if (best) {
      matched.push({ exercise, match: best, searchTerm });
    } else {
      unmatched.push({ exercise, searchTerm });
    }
  }

  console.log(`\nMatched: ${matched.length} / ${exercises.length}`);

  if (unmatched.length > 0) {
    console.log(`\nUnmatched (${unmatched.length}):`);
    for (const { exercise, searchTerm } of unmatched) {
      console.log(`  ✗ ${exercise.name} (searched: "${searchTerm}")`);
    }
  }

  if (!apply) {
    console.log("\nDry run. Pass --apply to download and upload images.");
    console.log("\nMatched exercises:");
    for (const { exercise, match } of matched) {
      console.log(`  ✓ ${exercise.name} → ${match.name} [score ${match.score}]`);
    }
    return;
  }

  console.log("\nDownloading and uploading…");
  let uploaded = 0;
  let failed = 0;

  for (const { exercise, match } of matched) {
    const slug = exerciseImageSlug(exercise.name);
    const storagePath = `${slug}.png`;
    const imgUrl = `${FREE_EXERCISE_DB_IMG_BASE}/${encodeURIComponent(match.id)}/0.jpg`;

    process.stdout.write(`  ${exercise.name} → `);

    try {
      const response = await fetch(imgUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const jpgBuffer = Buffer.from(await response.arrayBuffer());
      const pngBuffer = await sharp(jpgBuffer).png().toBuffer();

      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, pngBuffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "31536000",
      });

      if (error) throw new Error(error.message);

      console.log(`✓ ${storagePath}`);
      uploaded += 1;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed += 1;
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed, ${unmatched.length} unmatched.`);
}

async function fetchDbExercises(supabase) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment")
    .order("name", { ascending: true });
  if (error) throw new Error(`DB fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchFreeExerciseDb() {
  const response = await fetch(FREE_EXERCISE_DB_URL);
  if (!response.ok) throw new Error(`free-exercise-db fetch failed: ${response.status}`);
  return response.json();
}

function findBestMatch(freeDb, searchTerm, exercise) {
  const ranked = freeDb
    .map((candidate) => ({ ...candidate, score: score(candidate, searchTerm, exercise) }))
    .filter((c) => c.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
  return ranked[0] ?? null;
}

function score(candidate, searchTerm, exercise) {
  const cName = normalize(candidate.name);
  const sName = normalize(searchTerm);
  let s = 0;

  if (cName === sName) {
    s += 6;
  } else if (cName.includes(sName) || sName.includes(cName)) {
    s += 4;
  } else {
    const tokens = sName.split(" ").filter((t) => t.length > 2);
    s += tokens.filter((t) => cName.includes(t)).length;
  }

  const eqTerms = EQUIPMENT_TERMS[exercise.equipment] ?? [];
  if (eqTerms.length && eqTerms.some((t) => normalize(candidate.equipment ?? "").includes(normalize(t)))) {
    s += 2;
  }

  const muscleTerms = MUSCLE_TERMS[exercise.muscle_group] ?? [];
  const muscles = [candidate.primaryMuscles ?? [], candidate.secondaryMuscles ?? []].flat().join(" ");
  if (muscleTerms.length && muscleTerms.some((t) => normalize(muscles).includes(normalize(t)))) {
    s += 2;
  }

  return s;
}

function resolveSearchTerm(name) {
  const n = normalize(name);
  return EXERCISE_SEARCH_TERMS[n] ?? n;
}

function exerciseImageSlug(name) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
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
    // no-op
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
