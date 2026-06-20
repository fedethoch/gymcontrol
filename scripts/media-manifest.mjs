import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const DEFAULT_OUT = path.join(PROJECT_ROOT, "scripts", "media", "generated-image-manifest.json");
const EXERCISE_IMAGE_BUCKET = "exercise-images";
const ROUTINE_IMAGE_BUCKET = "routine-images";
const RECIPE_IMAGE_BUCKET = "recipe-images";

loadDotEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const supabase = createClient(
  getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const MEAL_TYPES = [
  {
    id: "desayuno",
    name: "Desayuno",
    localPath: "public/images/meals/desayuno.png",
    prompt:
      "Use case: photorealistic-natural. Asset type: mobile nutrition card. Primary request: an energizing healthy breakfast with oats, fruit, yogurt and coffee. Style: premium natural food photography. Composition: horizontal 16:9, close table scene, no text, no logo, no watermark.",
  },
  {
    id: "almuerzo",
    name: "Almuerzo",
    localPath: "public/images/meals/almuerzo.png",
    prompt:
      "Use case: photorealistic-natural. Asset type: mobile nutrition card. Primary request: a balanced lunch plate with lean protein, rice and vegetables. Style: premium natural food photography. Composition: horizontal 16:9, clean gym nutrition aesthetic, no text, no logo, no watermark.",
  },
  {
    id: "merienda",
    name: "Merienda",
    localPath: "public/images/meals/merienda.png",
    prompt:
      "Use case: photorealistic-natural. Asset type: mobile nutrition card. Primary request: an afternoon snack with yogurt, fruit, nuts and a small toast. Style: premium natural food photography. Composition: horizontal 16:9, warm afternoon light, no text, no logo, no watermark.",
  },
  {
    id: "cena",
    name: "Cena",
    localPath: "public/images/meals/cena.png",
    prompt:
      "Use case: photorealistic-natural. Asset type: mobile nutrition card. Primary request: a healthy dinner with salmon or chicken, roasted vegetables and salad. Style: premium natural food photography. Composition: horizontal 16:9, evening table lighting, no text, no logo, no watermark.",
  },
  {
    id: "snack",
    name: "Snack",
    localPath: "public/images/meals/snack.png",
    prompt:
      "Use case: photorealistic-natural. Asset type: mobile nutrition card. Primary request: a compact high-protein snack with nuts, fruit and yogurt. Style: premium natural food photography. Composition: horizontal 16:9, clean macro-friendly snack scene, no text, no logo, no watermark.",
  },
];

const DASHBOARD_ASSETS = [
  {
    kind: "dashboard",
    id: "hoy-toca-fallback",
    name: "Hoy toca fallback",
    localPath: "public/images/dashboard/hoy-toca-fallback.png",
    prompt:
      "Use case: photorealistic-natural. Asset type: app dashboard hero. Primary request: a premium gym training scene with weights, bench and soft dramatic lighting, no person identity focus. Composition: horizontal 16:9, generous dark overlay-friendly space, no text, no logo, no watermark.",
  },
];

async function main() {
  const outPath = resolveArg("--out") ?? DEFAULT_OUT;
  const onlyKind = resolveArg("--kind");
  const [exercises, recipes, routines] = await Promise.all([fetchExercises(), fetchRecipes(), fetchRoutines()]);
  const manifest = {
    generatedAt: new Date().toISOString(),
    defaults: {
      style:
        "Photorealistic editorial image, horizontal 16:9, premium gym/nutrition app card, no text, no logo, no watermark.",
      upload: {
        cacheControl: "31536000",
        upsert: true,
      },
    },
    assets: [
      ...MEAL_TYPES.map((meal) => ({
        kind: "meal-type",
        bucket: null,
        storagePath: null,
        publicUrl: null,
        status: "needs-generation",
        ...meal,
      })),
      ...DASHBOARD_ASSETS.map((asset) => ({
        bucket: null,
        storagePath: null,
        publicUrl: null,
        status: "needs-generation",
        ...asset,
      })),
      ...exercises.map((exercise) => exerciseToAsset(exercise)),
      ...routines.map((routine) => routineToAsset(routine)),
      ...recipes.map((recipe) => recipeToAsset(recipe)),
    ].filter((asset) => !onlyKind || asset.kind === onlyKind),
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${manifest.assets.length} assets to ${path.relative(PROJECT_ROOT, outPath)}`);
}

async function fetchExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, description, image_url, muscle_group, equipment")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not fetch exercises: ${error.message}`);
  }

  return (data ?? []).filter((exercise) => !isTestExercise(exercise.name));
}

async function fetchRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, description, image_url, category, servings, recipe_items(grams, foods(name))")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not fetch recipes: ${error.message}`);
  }

  return data ?? [];
}

async function fetchRoutines() {
  const { data, error } = await supabase
    .from("routine_templates")
    .select(
      "id, name, description, image_url, difficulty, objective, routine_days(day_order, routine_items(row_order, exercise:exercises(name, muscle_group, equipment)))",
    )
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not fetch routines: ${error.message}`);
  }

  return (data ?? []).filter((routine) => !isTestRoutine(routine.name));
}

function exerciseToAsset(exercise) {
  const slug = slugify(exercise.name);

  return {
    kind: "exercise",
    id: exercise.id,
    name: exercise.name,
    bucket: EXERCISE_IMAGE_BUCKET,
    storagePath: `${exercise.id}-${slug}.png`,
    localPath: `scripts/media/generated/exercises/${exercise.id}-${slug}.png`,
    publicUrl: exercise.image_url || null,
    status: exercise.image_url ? "linked" : "needs-generation",
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
    prompt:
      `Use case: photorealistic-natural. Asset type: exercise catalog card. Primary request: ${exercise.name}. ` +
      `Description: ${exercise.description}. Muscle group: ${exercise.muscle_group ?? "general"}. Equipment: ${exercise.equipment ?? "none"}. ` +
      "Scene: one clear gym exercise setup matching the movement and equipment. Composition: horizontal 16:9, premium fitness photography, no text, no logo, no watermark.",
  };
}

function routineToAsset(routine) {
  const exercises = collectRoutineExercises(routine).slice(0, 10);
  const muscleGroups = [...new Set(exercises.map((exercise) => exercise.muscle_group).filter(Boolean))];
  const slug = slugify(routine.name);

  return {
    kind: "routine",
    id: routine.id,
    name: routine.name,
    bucket: ROUTINE_IMAGE_BUCKET,
    storagePath: `${routine.id}-${slug}.png`,
    localPath: `scripts/media/generated/routines/${routine.id}-${slug}.png`,
    publicUrl: routine.image_url || null,
    status: routine.image_url ? "linked" : "needs-generation",
    prompt:
      `Use case: photorealistic-natural. Asset type: routine catalog card. Primary request: ${routine.name}, ${routine.description ?? "gym training routine"}. ` +
      `Training context: ${routine.difficulty} level, objective ${routine.objective}, muscle groups ${muscleGroups.join(", ") || "full body"}, exercises ${exercises.map((exercise) => exercise.name).join(", ")}. ` +
      "Scene: coherent gym setup that matches the routine focus. Composition: horizontal 16:9, premium fitness photography, no text, no logo, no watermark.",
  };
}

function recipeToAsset(recipe) {
  const slug = slugify(recipe.name);
  const ingredients = (recipe.recipe_items ?? [])
    .map((item) => {
      const food = Array.isArray(item.foods) ? item.foods[0] : item.foods;
      return food?.name ? `${food.name} ${item.grams}g` : null;
    })
    .filter(Boolean)
    .join(", ");

  return {
    kind: "recipe",
    id: recipe.id,
    name: recipe.name,
    bucket: RECIPE_IMAGE_BUCKET,
    storagePath: `${recipe.id}-${slug}.png`,
    localPath: `scripts/media/generated/recipes/${recipe.id}-${slug}.png`,
    publicUrl: recipe.image_url || null,
    status: recipe.image_url ? "linked" : "needs-generation",
    prompt:
      `Use case: photorealistic-natural. Asset type: recipe catalog card. Primary request: ${recipe.name}. ` +
      `Description: ${recipe.description ?? ""}. Category: ${recipe.category}. Servings: ${recipe.servings}. Ingredients: ${ingredients}. ` +
      "Scene: show the finished dish accurately matching the ingredients. Composition: horizontal 16:9, premium food photography, no text, no logo, no watermark.",
  };
}

function collectRoutineExercises(routine) {
  return (routine.routine_days ?? [])
    .slice()
    .sort((left, right) => left.day_order - right.day_order)
    .flatMap((day) =>
      (day.routine_items ?? [])
        .slice()
        .sort((left, right) => left.row_order - right.row_order)
        .map((item) => (Array.isArray(item.exercise) ? item.exercise[0] : item.exercise))
        .filter(Boolean),
    );
}

function isTestRoutine(name) {
  const normalized = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return normalized.includes("test") || normalized.includes("qa ");
}

function isTestExercise(name) {
  const normalized = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return normalized.includes("test") || normalized.includes("qa ");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function resolveArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
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
  console.error(error);
  process.exit(1);
});
