/**
 * Scrape fitnessprogramer.com for exercise GIF URLs and store them in image_url.
 *
 * Usage:
 *   node scripts/sync-fitnessprogramer-images.mjs            # dry run
 *   node scripts/sync-fitnessprogramer-images.mjs --apply    # update DB
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
loadDotEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const BASE = "https://fitnessprogramer.com";
const DELAY_MS = 800;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,*/*;q=0.9",
  "Accept-Language": "en-US,en;q=0.9",
};

const EXERCISE_SEARCH_TERMS = {
  "abduccion de cadera": "hip abduction",
  "aperturas con mancuernas": "dumbbell fly",
  "cruce de poleas": "cable crossover",
  "crunch abdominal": "crunch abdominal",
  "curl alterno mancuernas": "alternating dumbbell curl",
  "curl barra recta": "barbell curl",
  "curl concentrado": "concentration curl",
  "curl en polea": "cable curl",
  "curl femoral acostado": "lying leg curl",
  "curl inclinado": "incline dumbbell curl",
  "curl martillo": "hammer curl",
  "curl predicador": "preacher curl",
  "dominadas pronas": "pull-up",
  "dominadas supinas": "chin up",
  "elevacion de piernas": "hanging leg raise",
  "elevaciones frontales": "front raise",
  "elevaciones laterales": "lateral raise",
  "encogimientos trapecio": "barbell shrug",
  "extension cuerda sobre cabeza": "overhead cable triceps extension",
  "extension de cuadriceps": "leg extension",
  "extension triceps mancuerna": "dumbbell triceps extension",
  "extension triceps polea": "triceps pushdown",
  "face pull": "face pull",
  "farmer walk": "farmer walk",
  "flexion diamante": "diamond push up",
  "flexiones de brazos": "push-up",
  "fondos banco": "bench dip",
  "fondos en paralelas": "parallel bar dip",
  "gemelos de pie": "standing calf raise",
  "hip thrust": "hip thrust",
  "jalon al pecho": "lat pulldown exercise",
  "mountain climbers": "mountain climbers exercise",
  "pajaros posteriores": "rear delt fly",
  "pallof press": "pallof press",
  "patada triceps": "triceps kickback",
  "peso muerto convencional": "barbell deadlift",
  "peso muerto rumano": "romanian deadlift",
  "plancha frontal": "forearm plank",
  "prensa 45": "leg press machine",
  "press arnold": "arnold press",
  "press banca inclinado": "incline barbell bench press",
  "press banca plano": "barbell bench press",
  "press cerrado": "close grip bench press",
  "press en maquina pecho": "chest press machine",
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

// Direct URL slugs for exercises hard to find via search
const DIRECT_SLUGS = {
  "crunch abdominal": "crunch",
  "dominadas pronas": "pull-up",
  "elevacion de piernas": "hanging-leg-raise",
  "encogimientos trapecio": "barbell-shrug",
  "flexiones de brazos": "push-up",
  "jalon al pecho": "lat-pulldown",
  "mountain climbers": "mountain-climber",
  "peso muerto convencional": "deadlift",
  "plancha frontal": "plank",
  "prensa 45": "leg-press",
};

async function main() {
  const apply = process.argv.includes("--apply");

  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  console.log("Fetching exercises from DB…");
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(`DB fetch failed: ${error.message}`);
  console.log(`  ${exercises.length} exercises\n`);

  const results = [];

  for (const exercise of exercises) {
    const searchTerm = resolveSearchTerm(exercise.name);
    process.stdout.write(`  ${exercise.name} (${searchTerm}) → `);

    try {
      const normalized = normalize(exercise.name);
      let exerciseUrl = await findExerciseUrl(searchTerm);

      // fallback: try direct slug URL
      if (!exerciseUrl && DIRECT_SLUGS[normalized]) {
        const directUrl = `${BASE}/exercise/${DIRECT_SLUGS[normalized]}/`;
        const html = await fetchHtml(directUrl);
        if (html && html.includes("wp-content")) exerciseUrl = directUrl;
      }

      if (!exerciseUrl) {
        console.log("✗ not found in search");
        results.push({ exercise, gifUrl: null });
        continue;
      }

      const gifUrl = await extractGifUrl(exerciseUrl);
      if (!gifUrl) {
        console.log(`✗ no GIF on ${exerciseUrl}`);
        results.push({ exercise, gifUrl: null });
        continue;
      }

      console.log(`✓ ${gifUrl}`);
      results.push({ exercise, gifUrl });
    } catch (err) {
      console.log(`✗ error: ${err.message}`);
      results.push({ exercise, gifUrl: null });
    }

    await delay(DELAY_MS);
  }

  const matched = results.filter((r) => r.gifUrl);
  const failed = results.filter((r) => !r.gifUrl);

  console.log(`\nMatched: ${matched.length} / ${exercises.length}`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.map((r) => r.exercise.name).join(", ")}`);
  }

  if (!apply) {
    console.log("\nDry run. Pass --apply to update DB.");
    return;
  }

  console.log("\nUpdating DB…");
  let updated = 0;
  for (const { exercise, gifUrl } of matched) {
    const { error: updateError } = await supabase
      .from("exercises")
      .update({ image_url: gifUrl })
      .eq("id", exercise.id);
    if (updateError) {
      console.log(`  ✗ ${exercise.name}: ${updateError.message}`);
    } else {
      console.log(`  ✓ ${exercise.name}`);
      updated++;
    }
  }
  console.log(`\nDone: ${updated} updated.`);
}

async function findExerciseUrl(searchTerm) {
  const url = `${BASE}/?s=${encodeURIComponent(searchTerm)}`;
  const html = await fetchHtml(url);
  if (!html) return null;

  // extract first /exercise/ link from search results
  const match = html.match(/href="(https:\/\/fitnessprogramer\.com\/exercise\/[^"]+)"/);
  return match ? match[1] : null;
}

async function extractGifUrl(exerciseUrl) {
  const html = await fetchHtml(exerciseUrl);
  if (!html) return null;

  // main exercise gif has class "size-full wp-image-XXXX aligncenter"
  const mainGifMatch = html.match(
    /<img[^>]+class="[^"]*size-full[^"]*aligncenter[^"]*"[^>]+src="([^"]+\.gif)"/,
  );
  if (mainGifMatch) return mainGifMatch[1];

  // fallback: first gif in content area
  const anyGifMatch = html.match(
    /class="entry-content[^"]*"[\s\S]*?<img[^>]+src="([^"]+\.gif)"/,
  );
  if (anyGifMatch) return anyGifMatch[1];

  return null;
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return res.text();
}

function resolveSearchTerm(name) {
  const n = normalize(name);
  return EXERCISE_SEARCH_TERMS[n] ?? n;
}

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
