/**
 * One-off: delete all objects from the exercise-images bucket.
 * Run: node scripts/clear-exercise-images.mjs
 * After this, upload new PNGs named by convention: {slugifiedname}.png
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
loadDotEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const supabase = createClient(
  getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const BUCKET = "exercise-images";
  const { data: objects, error: listError } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });

  if (listError) throw new Error(`list failed: ${listError.message}`);
  if (!objects || objects.length === 0) {
    console.log("Bucket already empty.");
    return;
  }

  const paths = objects.map((obj) => obj.name);
  console.log(`Deleting ${paths.length} objects…`);

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
  if (removeError) throw new Error(`remove failed: ${removeError.message}`);

  console.log(`Done. Deleted: ${paths.join(", ")}`);
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
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

main().catch((err) => { console.error(err.message); process.exit(1); });
