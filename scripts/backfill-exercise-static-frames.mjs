/**
 * Backfill static frame images for exercises that have a GIF in image_url.
 *
 * For each exercise where gif_url is null and image_url ends in .gif:
 *   1. Set gif_url = current image_url (GIF already in Supabase, no re-upload).
 *   2. Download the GIF, extract frame 0 with sharp, upload as .png.
 *   3. Set image_url = new .png public URL.
 *
 * Usage:
 *   node scripts/backfill-exercise-static-frames.mjs           # dry run
 *   node scripts/backfill-exercise-static-frames.mjs --apply   # update DB
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const PROJECT_ROOT = process.cwd();
loadDotEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const BUCKET = "exercise-images";

async function main() {
  const apply = process.argv.includes("--apply");

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabase = createClient(
    supabaseUrl,
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  console.log("Fetching exercises without gif_url that have a GIF image_url…");
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, image_url, gif_url")
    .is("gif_url", null)
    .like("image_url", "%.gif")
    .order("name", { ascending: true });

  if (error) throw new Error(`DB fetch failed: ${error.message}`);
  console.log(`  ${exercises.length} exercises to process\n`);

  if (exercises.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const results = [];

  for (const exercise of exercises) {
    process.stdout.write(`  ${exercise.name} → `);
    try {
      const gifUrl = exercise.image_url;

      // Download GIF
      const res = await fetch(gifUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}: ${gifUrl}`);
      const gifBytes = Buffer.from(await res.arrayBuffer());

      // Extract frame 0 (sharp reads first frame by default — no animated:true)
      const pngBytes = await sharp(gifBytes).png().toBuffer();

      const storagePath = `exercises/${exercise.id}.png`;
      const pngPublicUrl = await uploadToSupabase(supabase, storagePath, pngBytes);

      console.log(`✓ ${pngPublicUrl}`);
      results.push({ exercise, gifUrl, pngPublicUrl });
    } catch (err) {
      console.log(`✗ ${err.message}`);
      results.push({ exercise, gifUrl: null, pngPublicUrl: null });
    }
  }

  const succeeded = results.filter((r) => r.pngPublicUrl);
  const failed = results.filter((r) => !r.pngPublicUrl);

  console.log(`\nProcessed: ${succeeded.length} OK, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.map((r) => r.exercise.name).join(", ")}`);
  }

  if (!apply) {
    console.log("\nDry run. Pass --apply to update DB.");
    return;
  }

  console.log("\nUpdating DB…");
  let updated = 0;
  for (const { exercise, gifUrl, pngPublicUrl } of succeeded) {
    process.stdout.write(`  ${exercise.name} → `);
    const { error: updateError } = await supabase
      .from("exercises")
      .update({ image_url: pngPublicUrl, gif_url: gifUrl })
      .eq("id", exercise.id);

    if (updateError) {
      console.log(`✗ ${updateError.message}`);
    } else {
      console.log(`✓`);
      updated++;
    }
  }
  console.log(`\nDone: ${updated} / ${succeeded.length} updated.`);
}

async function uploadToSupabase(supabase, storagePath, bytes) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true,
    });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
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
