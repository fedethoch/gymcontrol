/**
 * fetch-dataset-images.mjs
 *
 * Downloads recipe images from open datasets into localPath locations
 * so upload-generated-images.mjs can push them to Supabase.
 * Foods have no images since 2026-09-16 (DESIGN.md §13, AL-D6).
 *
 * Sources:
 *   recipes  → TheMealDB meal search (strMealThumb = real dish photo)
 *
 * Usage:
 *   node scripts/fetch-dataset-images.mjs [--replace]
 *
 * Flags:
 *   --replace       also process assets with status "linked" (e.g. to replace AI images)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const DEFAULT_MANIFEST = path.join(PROJECT_ROOT, "scripts", "media", "generated-image-manifest.json");
const MISSES_PATH = path.join(PROJECT_ROOT, "scripts", "media", "fetch-misses.json");

const MEALDB_INGREDIENT_BASE = "https://www.themealdb.com/images/ingredients";
const MEALDB_SEARCH_BASE = "https://www.themealdb.com/api/json/v1/1/search.php";

const DELAY_MS = 300;

// For recipe misses: fallback to a representative ingredient thumbnail instead of a meal photo.
// Key = recipe name; value = TheMealDB ingredient name.
const RECIPE_INGREDIENT_FALLBACK = {
  "Avena con banana y maní": "Banana",
  "Avena proteica con banana": "Banana",
  "Burrito de pollo": "Flour Tortilla",
  "Carne magra con papa y ensalada": "Beef",
  "Ensalada completa de garbanzos": "Chickpeas",
  "Ensalada de atún": "Tuna",
  "Tostadas con huevo y palta": "Avocado",
  "Tostadas integrales con huevo y palta": "Avocado",
  "Tostada con manteca de mani": "Peanut Butter",
  "Smoothie proteico": "Banana",
};

// Better search terms for recipe misses (ES name → TheMealDB search query)
const RECIPE_SEARCH_MAP = {
  "Atun con arroz y vegetales": "tuna",
  "Avena con banana y maní": "banana oats",
  "Avena proteica con banana": "banana oats",
  "Burrito de pollo": "chicken burrito",
  "Carne magra con papa y ensalada": "beef steak",
  "Ensalada completa de garbanzos": "chickpea salad",
  "Ensalada de atún": "tuna salad",
  "Panqueques de avena y clara": "pancakes",
  "Smoothie proteico": "smoothie",
  "Tostadas con huevo y palta": "avocado toast",
  "Tostadas integrales con huevo y palta": "avocado toast",
  "Tostada con manteca de mani": "peanut butter toast",
  "Wok de tofu y arroz": "tofu stir fry",
};

async function main() {
  const manifestPath = resolveArg("--manifest") ?? DEFAULT_MANIFEST;
  const replace = process.argv.includes("--replace");

  const manifest = JSON.parse(stripBom(await readFile(manifestPath, "utf8")));

  const targets = manifest.assets.filter((asset) => {
    if (asset.kind !== "recipe") return false;
    // skip already downloaded or already linked (unless --replace)
    if (asset.status === "needs-upload") return false;
    if (asset.status === "linked" && !replace) return false;
    return true;
  });

  console.log(`Processing ${targets.length} recipe assets (replace=${replace})`);

  const misses = [];
  let hits = 0;

  for (const asset of targets) {
    await sleep(DELAY_MS);

    try {
      const [bytes, source] = await fetchRecipeImage(asset.name);

      if (!bytes) {
        misses.push({ kind: asset.kind, id: asset.id, name: asset.name });
        console.warn(`  MISS  ${asset.kind} "${asset.name}"`);
        continue;
      }

      await mkdir(path.dirname(path.resolve(PROJECT_ROOT, asset.localPath)), { recursive: true });
      await writeFile(path.resolve(PROJECT_ROOT, asset.localPath), bytes);

      asset.status = "needs-upload";
      hits++;
      console.log(`  HIT   ${asset.kind} "${asset.name}" [${source}]`);
    } catch (err) {
      misses.push({ kind: asset.kind, id: asset.id, name: asset.name, error: err.message });
      console.warn(`  ERROR ${asset.kind} "${asset.name}": ${err.message}`);
    }
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(MISSES_PATH, `${JSON.stringify(misses, null, 2)}\n`, "utf8");

  console.log(`\nDone: ${hits} downloaded, ${misses.length} misses → ${path.relative(PROJECT_ROOT, MISSES_PATH)}`);
}

// ---------------------------------------------------------------------------
// Recipe image: custom search map → meal search → first-word fallback
// ---------------------------------------------------------------------------

async function fetchRecipeImage(name) {
  const customQuery = RECIPE_SEARCH_MAP[name];
  if (customQuery) {
    const result = await mealSearch(customQuery);
    if (result) return result;
    await sleep(DELAY_MS);
  }

  // Try exact name
  const exactResult = await mealSearch(name);
  if (exactResult) return exactResult;
  await sleep(DELAY_MS);

  // Try first meaningful word
  const firstWord = name.split(" ").find((w) => w.length > 3);
  if (firstWord && firstWord.toLowerCase() !== name.toLowerCase()) {
    const fallbackResult = await mealSearch(firstWord);
    if (fallbackResult) return fallbackResult;
  }

  // Last resort: ingredient thumbnail for primary ingredient
  const ingredientFallback = RECIPE_INGREDIENT_FALLBACK[name];
  if (ingredientFallback) {
    const encodedName = ingredientFallback.replace(/ /g, "_");
    const bytes = await fetchBytes(`${MEALDB_INGREDIENT_BASE}/${encodedName}.png`);
    if (bytes) return [bytes, `themealdb-ingredient:${ingredientFallback}`];
  }

  return [null, null];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mealSearch(query) {
  const url = `${MEALDB_SEARCH_BASE}?s=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const meal = data?.meals?.[0];
  if (!meal?.strMealThumb) return null;
  const bytes = await fetchBytes(meal.strMealThumb);
  if (!bytes) return null;
  return [bytes, `themealdb-meal:${meal.strMeal}`];
}

async function fetchBytes(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "gymcontrol-image-fetcher/1.0" } });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "gymcontrol-image-fetcher/1.0" } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function resolveArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
