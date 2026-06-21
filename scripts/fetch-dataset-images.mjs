/**
 * fetch-dataset-images.mjs
 *
 * Downloads food and recipe images from open datasets into localPath locations
 * so upload-generated-images.mjs can push them to Supabase.
 *
 * Sources:
 *   foods    → TheMealDB ingredient thumbnails (uniform white bg) + meal search + OFF fallback
 *   recipes  → TheMealDB meal search (strMealThumb = real dish photo)
 *
 * Usage:
 *   node scripts/fetch-dataset-images.mjs [--kind food|recipe] [--replace]
 *
 * Flags:
 *   --kind food     process only foods (default: both)
 *   --kind recipe   process only recipes
 *   --replace       also process assets with status "linked" (e.g. to replace AI images)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const DEFAULT_MANIFEST = path.join(PROJECT_ROOT, "scripts", "media", "generated-image-manifest.json");
const NAME_MAP_PATH = path.join(PROJECT_ROOT, "scripts", "media", "food-name-map.json");
const MISSES_PATH = path.join(PROJECT_ROOT, "scripts", "media", "fetch-misses.json");

const MEALDB_INGREDIENT_BASE = "https://www.themealdb.com/images/ingredients";
const MEALDB_SEARCH_BASE = "https://www.themealdb.com/api/json/v1/1/search.php";
const OFF_SEARCH_BASE = "https://world.openfoodfacts.org/cgi/search.pl";

const DELAY_MS = 300;

// TheMealDB meal search terms for composite/prepared foods that have no ingredient thumbnail.
// Key = foods.name exactly; value = search query for TheMealDB meal search.
const DISH_SEARCH_MAP = {
  "Albondigas magras": "meatballs",
  "Arepa": "arepa",
  "Bagel integral": "bagel",
  "Barra de cereal": "granola bar",
  "Bowl de quinoa y pollo": "chicken quinoa",
  "Bowl mediterraneo": "mediterranean salad",
  "Burrito de pollo": "chicken burrito",
  "Carne picada magra": "ground beef",
  "Crackers integrales": "crackers",
  "Cuadril magro": "beef steak",
  "Empanada de carne al horno": "empanada",
  "Empanada de pollo al horno": "chicken empanada",
  "Ensalada caesar con pollo": "caesar salad",
  "Ensalada completa de garbanzos": "chickpea salad",
  "Galletas de arroz": "rice cakes",
  "Guiso de lentejas": "lentil stew",
  "Hamburguesa casera magra": "hamburger",
  "Hamburguesa completa casera": "hamburger",
  "Higado vacuno": "liver",
  "Kefir natural": "yoghurt",
  "Lasagna de carne magra": "lasagne",
  "Locro liviano": "beef stew",
  "Mandioca hervida": "cassava",
  "Merluza": "fish fillet",
  "Mermelada reducida": "jam",
  "Milanesa de carne al horno": "milanesa",
  "Milanesa de pollo al horno": "chicken milanesa",
  "Mijo cocido": "millet",
  "Mix de ensalada": "green salad",
  "Nalga vacuna": "beef steak",
  "Nioquis de papa": "gnocchi",
  "Omelette de verduras": "omelette",
  "Palmitos": "salad",
  "Peceto": "beef roast",
  "Pejerrey": "fish fillet",
  "Pesto casero": "pesto pasta",
  "Pickles": "gherkins",
  "Pizza integral de muzzarella": "pizza",
  "Polenta cocida": "polenta",
  "Proteina whey": "protein shake",
  "Pure de papa": "mashed potato",
  "Queso cottage": "cottage cheese",
  "Queso port salut light": "cheese",
  "Rabanito": "radish salad",
  "Risotto simple": "risotto",
  "Roast beef magro": "roast beef",
  "Salsa de tomate natural": "tomato sauce",
  "Sandwich de atun integral": "tuna sandwich",
  "Sandwich de pollo integral": "chicken sandwich",
  "Seitan": "seitan stir fry",
  "Semillas de girasol": "sunflower seeds",
  "Semillas de lino": "flaxseed",
  "Semillas de zapallo": "pumpkin seeds",
  "Sopa crema de calabaza": "pumpkin soup",
  "Tarta de atun": "tuna pie",
  "Tarta de verduras": "vegetable pie",
  "Tortilla de papa al horno": "spanish omelette",
  "Tostadas integrales": "toast",
  "Uvas": "grapes",
  "Vegetales grillados": "grilled vegetables",
  "Wok de pollo y vegetales": "chicken stir fry",
  "Wok de tofu y arroz": "tofu stir fry",
  "Wrap vegetariano": "vegetable wrap",
};

// For food misses: fallback to a representative TheMealDB ingredient thumbnail.
// Only uses names confirmed to exist in TheMealDB (verified by earlier hits in this session).
const FOOD_INGREDIENT_FALLBACK = {
  "Avellanas": "Walnuts",
  "Berro": "Spinach",
  "Bowl mediterraneo": "Chickpeas",
  "Burrito de pollo": "Flour Tortilla",
  "Carne picada magra": "Beef",
  "Cebada cocida": "Oats",
  "Coliflor": "Broccoli",
  "Cuadril magro": "Beef",
  "Durazno": "Mango",
  "Edamame": "Peas",
  "Empanada de pollo al horno": "Chicken",
  "Ensalada caesar con pollo": "Chicken",
  "Ensalada completa de garbanzos": "Chickpeas",
  "Escarola": "Lettuce",
  "Fideos integrales cocidos": "Pasta",
  "Galletas de arroz": "Oats",
  "Granola simple": "Oats",
  "Hamburguesa casera magra": "Beef",
  "Hamburguesa completa casera": "Beef",
  "Lenguado": "Salmon",
  "Merluza": "Salmon",
  "Milanesa de pollo al horno": "Chicken Breast",
  "Mix de ensalada": "Lettuce",
  "Nalga vacuna": "Beef",
  "Nioquis de papa": "Potato",
  "Peceto": "Beef",
  "Pejerrey": "Trout",
  "Pesto casero": "Basil",
  "Rabanito": "Tomatoes",
  "Roast beef magro": "Beef",
  "Sandwich de atun integral": "Tuna",
  "Sandwich de pollo integral": "Chicken",
  "Semillas de lino": "Chia Seeds",
  "Semillas de zapallo": "Pumpkin",
  "Tarta de atun": "Tuna",
  "Tortilla de papa al horno": "Potato",
  "Uvas": "Mango",
  "Vegetales grillados": "Courgette",
  "Wok de pollo y vegetales": "Chicken",
  "Wok de tofu y arroz": "Tofu",
  "Wrap vegetariano": "Flour Tortilla",
};

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
  const onlyKind = resolveArg("--kind");
  const replace = process.argv.includes("--replace");

  const manifest = JSON.parse(stripBom(await readFile(manifestPath, "utf8")));
  const nameMap = JSON.parse(readFileSync(NAME_MAP_PATH, "utf8"));

  const targets = manifest.assets.filter((asset) => {
    if (asset.kind !== "food" && asset.kind !== "recipe") return false;
    if (onlyKind && asset.kind !== onlyKind) return false;
    // skip already downloaded or already linked (unless --replace)
    if (asset.status === "needs-upload") return false;
    if (asset.status === "linked" && !replace) return false;
    return true;
  });

  console.log(`Processing ${targets.length} assets (kind=${onlyKind ?? "food+recipe"}, replace=${replace})`);

  const misses = [];
  let hits = 0;

  for (const asset of targets) {
    await sleep(DELAY_MS);

    try {
      let bytes = null;
      let source = null;

      if (asset.kind === "food") {
        [bytes, source] = await fetchFoodImage(asset.name, nameMap, asset.category);
      } else if (asset.kind === "recipe") {
        [bytes, source] = await fetchRecipeImage(asset.name);
      }

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
// Food image: ingredient thumbnail → dish meal search → OFF fallback
// ---------------------------------------------------------------------------

async function fetchFoodImage(name, nameMap, category) {
  const enName = nameMap[name];

  // 1. TheMealDB ingredient thumbnail (consistent white background)
  if (enName) {
    const encodedName = enName.replace(/ /g, "_");
    const url = `${MEALDB_INGREDIENT_BASE}/${encodedName}.png`;
    const bytes = await fetchBytes(url);
    if (bytes) return [bytes, `themealdb:${enName}`];
  }

  // 2. TheMealDB meal search (for composite/prepared dishes)
  const dishQuery = DISH_SEARCH_MAP[name] ?? (enName ? null : null);
  if (dishQuery || category === "mixed") {
    const query = dishQuery ?? name;
    const result = await mealSearch(query);
    if (result) return result;
  }

  // 3. Open Food Facts — only if product name contains a word from the search term
  const offResult = await fetchOff(enName ?? name, name);
  if (offResult) return offResult;

  // 4. Known-safe ingredient thumbnail fallback (represents the food visually)
  const ingredientFallback = FOOD_INGREDIENT_FALLBACK[name];
  if (ingredientFallback) {
    const encodedName = ingredientFallback.replace(/ /g, "_");
    const bytes = await fetchBytes(`${MEALDB_INGREDIENT_BASE}/${encodedName}.png`);
    if (bytes) return [bytes, `themealdb-fallback:${ingredientFallback}`];
  }

  return [null, null];
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

async function fetchOff(enTerm, esTerm) {
  const query = enTerm ?? esTerm;
  const url = `${OFF_SEARCH_BASE}?search_terms=${encodeURIComponent(query)}&json=1&fields=product_name,image_url&page_size=10`;
  const data = await fetchJson(url);
  const products = data?.products ?? [];

  // Only accept a product whose name contains at least one keyword from the search
  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  for (const product of products) {
    if (!product.image_url) continue;
    const productNameLower = (product.product_name ?? "").toLowerCase();
    const relevant = keywords.some((kw) => productNameLower.includes(kw));
    if (!relevant) continue;
    const bytes = await fetchBytes(product.image_url);
    if (bytes) return [bytes, `openfoodfacts:${product.product_name ?? query}`];
  }

  return null;
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
