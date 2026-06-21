import { readFileSync } from "node:fs";
loadDotEnvFile(".env.local");

const r = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
const db = await r.json();

const searches = [
  { name: "Abduccion de cadera", terms: ["hip abduction", "abduction"] },
  { name: "Crunch abdominal",    terms: ["crunch"] },
  { name: "Elevacion de piernas",terms: ["leg raise"] },
  { name: "Farmer walk",         terms: ["farmer"] },
  { name: "Flexion diamante",    terms: ["diamond"] },
  { name: "Mountain climbers",   terms: ["mountain"] },
  { name: "Patada triceps",      terms: ["kickback"] },
  { name: "Pullover en polea",   terms: ["pullover", "cable pullover"] },
  { name: "Rueda abdominal",     terms: ["ab wheel", "rollout"] },
];

for (const s of searches) {
  const hits = db
    .filter(e => s.terms.some(t => e.name.toLowerCase().includes(t.toLowerCase())))
    .slice(0, 5);
  console.log(`\n── ${s.name} ──`);
  if (!hits.length) { console.log("  (sin resultados)"); continue; }
  for (const h of hits) {
    console.log(`  [${h.id}]\n    ${h.name} | ${h.equipment} | ${h.primaryMuscles?.join(", ")}`);
  }
}

function loadDotEnvFile(f) {
  try {
    for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = /^([A-Za-z_]\w*)=(.*)$/.exec(l.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
