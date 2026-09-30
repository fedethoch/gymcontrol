/**
 * Replace exercise media with hand-verified GIFs from ExerciseGymGifsDB (360x360, ExerciseDB catalog).
 *
 * Each exercise maps to one exact GIF path (no search): every entry was checked frame by frame.
 * Exercises missing from EXERCISE_GIFS keep their current media (their GIF was already correct).
 * For each mapped exercise:
 *   1. Download the GIF from jsDelivr (pinned tag).
 *   2. Extract frame 0 with sharp as the static PNG.
 *   3. Upload both as exercises/{id}-{VERSION}.{gif,png} (bump VERSION on any change: files are cached for 1 year).
 *   4. Set image_url / gif_url to the new public URLs.
 *
 * Usage:
 *   node scripts/sync-exercise-gifs.mjs           # dry run (download + report)
 *   node scripts/sync-exercise-gifs.mjs --apply   # upload + update DB
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const PROJECT_ROOT = process.cwd();
loadDotEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const BUCKET = "exercise-images";
const SOURCE_BASE = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/";
const VERSION = "v3";

const EXERCISE_GIFS = {
  "Abduccion de cadera": "abductors/lever-seated-hip-abduction.gif",
  "Aperturas con mancuernas": "pectorals/dumbbell-fly.gif",
  "Aperturas en máquina": "pectorals/lever-seated-fly.gif",
  "Cruce de poleas": "pectorals/cable-cross-over-variation.gif",
  "Crunch abdominal": "abs/crunch-floor.gif",
  "Curl alterno mancuernas": "biceps/dumbbell-alternate-biceps-curl.gif",
  "Curl barra recta": "biceps/barbell-curl.gif",
  "Curl concentrado": "biceps/dumbbell-concentration-curl.gif",
  "Curl de piernas": "hamstrings/lever-seated-leg-curl.gif",
  "Curl en polea": "biceps/cable-curl.gif",
  "Curl femoral acostado": "hamstrings/lever-lying-leg-curl.gif",
  "Curl inclinado": "biceps/dumbbell-incline-curl.gif",
  "Curl martillo": "biceps/dumbbell-hammer-curl.gif",
  "Curl predicador": "biceps/lever-preacher-curl.gif",
  "Dominadas pronas": "lats/pull-up.gif",
  "Dominadas supinas": "lats/chin-up.gif",
  "Elevacion de piernas": "abs/hanging-straight-leg-raise.gif",
  "Elevaciones frontales": "delts/dumbbell-front-raise.gif",
  "Elevaciones laterales": "delts/dumbbell-lateral-raise.gif",
  "Elevaciones laterales en polea": "delts/cable-lateral-raise.gif",
  "Encogimientos trapecio": "traps/dumbbell-shrug.gif",
  "Extension cuerda sobre cabeza": "triceps/cable-overhead-triceps-extension-rope-attachment.gif",
  "Extension de cuadriceps": "quads/lever-leg-extension.gif",
  "Extensión de tríceps en polea unilateral": "triceps/cable-one-arm-tricep-pushdown.gif",
  "Extensión trasnuca en polea": "triceps/cable-rope-high-pulley-overhead-tricep-extension.gif",
  "Extension triceps mancuerna": "triceps/dumbbell-seated-triceps-extension.gif",
  "Extension triceps polea": "triceps/cable-pushdown.gif",
  "Face pull": "delts/cable-rear-delt-row-with-rope.gif",
  "Farmer walk": "quads/farmers-walk.gif",
  "Flexion diamante": "triceps/diamond-push-up.gif",
  "Flexiones de brazos": "pectorals/push-up.gif",
  "Fondos banco": "triceps/bench-dip-knees-bent.gif",
  "Fondos en paralelas": "pectorals/chest-dip.gif",
  "Gemelos de pie": "calves/lever-standing-calf-raise.gif",
  "Jalon al pecho": "lats/cable-pulldown.gif",
  "Mountain climbers": "cardio/mountain-climber.gif",
  "Pajaros posteriores": "delts/dumbbell-rear-lateral-raise.gif",
  "Patada de gluteo en polea": "glutes/cable-standing-hip-extension.gif",
  "Patada triceps": "triceps/dumbbell-kickback.gif",
  "Peso muerto convencional": "glutes/barbell-deadlift.gif",
  "Peso muerto rumano": "glutes/barbell-romanian-deadlift.gif",
  "Prensa 45": "glutes/sled-45-leg-press.gif",
  "Press Arnold": "delts/dumbbell-arnold-press.gif",
  "Press banca inclinado": "pectorals/dumbbell-incline-bench-press.gif",
  "Press banca plano": "pectorals/barbell-bench-press.gif",
  "Press cerrado": "triceps/barbell-close-grip-bench-press.gif",
  "Press en maquina pecho": "pectorals/lever-chest-press.gif",
  "Press hombros sentado": "delts/dumbbell-seated-shoulder-press.gif",
  "Press inclinado en máquina": "pectorals/lever-incline-chest-press.gif",
  "Press militar de pie": "delts/barbell-standing-close-grip-military-press.gif",
  "Pull over con mancuerna": "pectorals/dumbbell-pullover.gif",
  "Pullover en polea": "lats/cable-straight-arm-pulldown.gif",
  "Remo al menton": "delts/barbell-upright-row.gif",
  "Remo con barra": "upper-back/barbell-bent-over-row.gif",
  "Remo con mancuerna": "upper-back/dumbbell-one-arm-bent-over-row.gif",
  "Remo en máquina": "upper-back/lever-seated-row.gif",
  "Remo sentado en polea": "upper-back/cable-seated-row.gif",
  "Remo T-Bar": "upper-back/lever-t-bar-row.gif",
  "Rompecraneos barra z": "triceps/ez-bar-lying-close-grip-triceps-extension-behind-head.gif",
  "Rueda abdominal": "abs/wheel-rollerout.gif",
  "Russian twist": "abs/russian-twist.gif",
  "Sentadilla frontal": "glutes/barbell-front-squat.gif",
  "Sentadilla goblet": "glutes/kettlebell-goblet-squat.gif",
  "Sentadilla trasera": "glutes/barbell-full-squat.gif",
  "Step up con mancuernas": "glutes/dumbbell-step-up.gif",
  "Zancadas caminando": "glutes/walking-lunge.gif",
};

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: exercises, error } = await supabase.from("exercises").select("id, name");
  if (error) throw new Error(`DB fetch failed: ${error.message}`);

  const byName = new Map(exercises.map((exercise) => [exercise.name, exercise]));
  const missing = Object.keys(EXERCISE_GIFS).filter((name) => !byName.has(name));
  if (missing.length > 0) throw new Error(`Exercises not found in DB: ${missing.join(", ")}`);

  const unmapped = exercises.filter((exercise) => !(exercise.name in EXERCISE_GIFS));
  console.log(`Mapped: ${Object.keys(EXERCISE_GIFS).length}. Kept as is: ${unmapped.map((e) => e.name).join(", ") || "none"}\n`);

  let failed = 0;
  for (const [name, sourcePath] of Object.entries(EXERCISE_GIFS)) {
    const exercise = byName.get(name);
    process.stdout.write(`  ${name} ← ${sourcePath} → `);
    try {
      const res = await fetch(SOURCE_BASE + sourcePath);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const gifBytes = Buffer.from(await res.arrayBuffer());
      // sharp reads frame 0 by default (no animated: true)
      const pngBytes = await sharp(gifBytes).png().toBuffer();

      if (!apply) {
        console.log(`ok (${Math.round(gifBytes.length / 1024)} KB)`);
        continue;
      }

      const gifUrl = await upload(supabase, `exercises/${exercise.id}-${VERSION}.gif`, gifBytes, "image/gif");
      const imageUrl = await upload(supabase, `exercises/${exercise.id}-${VERSION}.png`, pngBytes, "image/png");
      const { error: updateError } = await supabase
        .from("exercises")
        .update({ image_url: imageUrl, gif_url: gifUrl })
        .eq("id", exercise.id);
      if (updateError) throw new Error(`DB update failed: ${updateError.message}`);
      console.log("✓");
    } catch (err) {
      failed++;
      console.log(`✗ ${err.message}`);
    }
  }

  console.log(`\n${failed === 0 ? "Done" : `${failed} failed`}.${apply ? "" : " Dry run: pass --apply to upload and update DB."}`);
  if (failed > 0) process.exit(1);
}

async function upload(supabase, storagePath, bytes, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType, cacheControl: "31536000", upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
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
