import { readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const DEFAULT_MANIFEST = path.join(PROJECT_ROOT, "scripts", "media", "generated-image-manifest.json");
const MIME_BY_EXT = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

loadDotEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const supabase = createClient(
  getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const manifestPath = resolveArg("--manifest") ?? DEFAULT_MANIFEST;
  const onlyKind = resolveArg("--kind");
  const manifest = JSON.parse(stripBom(await readFile(manifestPath, "utf8")));
  const remoteAssets = manifest.assets.filter(
    (asset) => asset.bucket && asset.storagePath && (!onlyKind || asset.kind === onlyKind),
  );
  const missingFiles = [];
  let uploaded = 0;

  for (const asset of remoteAssets) {
    const filePath = path.resolve(PROJECT_ROOT, asset.localPath);
    let bytes;

    try {
      bytes = await readFile(filePath);
    } catch {
      missingFiles.push(asset.localPath);
      continue;
    }

    const contentType = MIME_BY_EXT.get(path.extname(filePath).toLowerCase());
    if (!contentType) {
      throw new Error(`Unsupported image extension: ${asset.localPath}`);
    }

    const { error: uploadError } = await supabase.storage.from(asset.bucket).upload(asset.storagePath, bytes, {
      cacheControl: manifest.defaults?.upload?.cacheControl ?? "31536000",
      contentType,
      upsert: manifest.defaults?.upload?.upsert ?? true,
    });

    if (uploadError) {
      throw new Error(`Could not upload ${asset.localPath}: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(asset.bucket).getPublicUrl(asset.storagePath);
    asset.publicUrl = data.publicUrl;
    asset.status = "linked";

    if (asset.kind === "exercise") {
      await updateTable("exercises", asset.id, data.publicUrl);
    } else if (asset.kind === "routine") {
      await updateTable("routine_templates", asset.id, data.publicUrl);
    } else if (asset.kind === "recipe") {
      await updateTable("recipes", asset.id, data.publicUrl);
    } else if (asset.kind === "food") {
      await updateTable("foods", asset.id, data.publicUrl);
    }

    uploaded += 1;
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (missingFiles.length > 0) {
    console.warn(`Skipped ${missingFiles.length} missing files:`);
    for (const file of missingFiles) {
      console.warn(`- ${file}`);
    }
  }

  console.log(`Uploaded and linked ${uploaded} assets.`);
}

function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

async function updateTable(table, id, imageUrl) {
  const { error } = await supabase.from(table).update({ image_url: imageUrl }).eq("id", id);
  if (error) {
    throw new Error(`Could not update ${table}.${id}: ${error.message}`);
  }
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
