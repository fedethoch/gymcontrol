import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  availableDayCounts,
  carouselIndex,
  catalogAnnouncement,
  catalogResultLabel,
  dayCountLabel,
  displayRoutineName,
  emptyResultsMessage,
  featureCtaTone,
  filterCatalog,
  fractionalIndex,
  highlightSegments,
  matchesQuery,
  neighborDayCounts,
  nextRadioIndex,
  normalizeSearch,
  optionCounts,
  parseCatalogSort,
  parseDayOption,
  parseLevelFilter,
  parseObjectiveFilter,
  pickLevelFeatured,
  resolveDayOption,
  resultsHeading,
  routineCountLabel,
  searchTokens,
  sharedLevel,
  sortCatalog,
  toCatalogRoutine,
  weekSplit,
  wheelGlyph,
} from "../../app/lib/routine-catalog.ts";

/** Plantilla con la forma de `RoutineTemplate`: los ejercicios van en el primer día y reparten las series. */
function template({ id, name, description, imageUrl = "", difficulty, objective, days, items, series }) {
  const perItem = Math.floor(series / items);
  const itemList = Array.from({ length: items }, (_, index) => ({
    series: index === items - 1 ? series - perItem * (items - 1) : perItem,
  }));
  return {
    id,
    name,
    description,
    imageUrl,
    difficulty,
    objective,
    days: Array.from({ length: days }, (_, index) => ({ items: index === 0 ? itemList : [] })),
  };
}

// Las 10 plantillas reales del catálogo, en el orden de la base (created_at desc).
const TEMPLATES = [
  template({ id: "mayores", name: "Full Body Mayores", description: "Rutina de 2 días para adultos mayores. Lunes: pierna, bícep y abs. Martes: espalda y trícep.", difficulty: "principiante", objective: "mantenimiento", days: 2, items: 15, series: 37 }),
  template({ id: "arnold6", name: "Arnold Split 6 dias", description: "Division clasica de seis dias con pecho y espalda, hombros y brazos, y piernas en dos vueltas semanales.", imageUrl: "a.png", difficulty: "avanzado", objective: "hipertrofia", days: 6, items: 38, series: 128 }),
  template({ id: "ppl6", name: "Push Pull Legs 6 dias", description: "Frecuencia alta con dos vueltas semanales de empuje, tiron y piernas.", imageUrl: "p.png", difficulty: "avanzado", objective: "hipertrofia", days: 6, items: 27, series: 93 }),
  template({ id: "ppl5", name: "Push Pull Legs 5 dias", description: "Division PPL de cinco sesiones para sostener volumen alto con una pierna semanal.", imageUrl: "p.png", difficulty: "intermedio", objective: "hipertrofia", days: 5, items: 21, series: 73 }),
  template({ id: "pplxa6", name: "Push Pull Legs x Arnold Split 6 dias", description: "Hibrido PPL y Arnold Split con foco extra en torso, hombros y brazos.", imageUrl: "x.png", difficulty: "avanzado", objective: "hipertrofia", days: 6, items: 24, series: 84 }),
  template({ id: "pplxa5", name: "Push Pull Legs x Arnold Split 5 dias", description: "Hibrido PPL y Arnold Split condensado en cinco sesiones.", imageUrl: "x.png", difficulty: "intermedio", objective: "hipertrofia", days: 5, items: 20, series: 70 }),
  template({ id: "ul4", name: "Upper Lower 4 dias", description: "Torso pierna de cuatro dias con frecuencia dos y volumen equilibrado.", imageUrl: "u.png", difficulty: "intermedio", objective: "hipertrofia", days: 4, items: 17, series: 57 }),
  template({ id: "fb3", name: "Fullbody 3 dias", description: "Cuerpo completo de tres dias para progresar con frecuencia alta y volumen moderado.", imageUrl: "f.png", difficulty: "principiante", objective: "hipertrofia", days: 3, items: 12, series: 36 }),
  template({ id: "fbm3", name: "Fullbody mantenimiento 3 dias", description: "Cuerpo completo de tres dias para sostener fuerza, tecnica y condicion.", imageUrl: "m.png", difficulty: "principiante", objective: "mantenimiento", days: 3, items: 12, series: 35 }),
  template({ id: "prio5", name: "Prio Legs(woman) 5 dias", description: "Cinco dias con prioridad de gluteos y piernas, manteniendo torso.", imageUrl: "l.png", difficulty: "intermedio", objective: "hipertrofia", days: 5, items: 20, series: 71 }),
];

const CATALOG = TEMPLATES.map(toCatalogRoutine);
const ALL = { query: "", days: "all", level: "all", objective: "all" };
const ids = (list) => list.map((routine) => routine.id);

describe("toCatalogRoutine", () => {
  it("resume días, ejercicios y series sin copiar el árbol", () => {
    const arnold = CATALOG[1];
    assert.deepEqual(arnold, {
      id: "arnold6",
      name: "Arnold Split 6 dias",
      displayName: "Arnold Split 6 días",
      description: TEMPLATES[1].description,
      imageUrl: "a.png",
      difficulty: "avanzado",
      objective: "hipertrofia",
      dayCount: 6,
      itemCount: 38,
      seriesCount: 128,
    });
  });

  it("una plantilla sin días queda en cero", () => {
    const empty = toCatalogRoutine({ ...TEMPLATES[0], days: [] });
    assert.equal(empty.dayCount, 0);
    assert.equal(empty.itemCount, 0);
    assert.equal(empty.seriesCount, 0);
  });
});

describe("displayRoutineName", () => {
  it("pone la tilde en día/días respetando mayúsculas", () => {
    assert.equal(displayRoutineName("Arnold Split 6 dias"), "Arnold Split 6 días");
    assert.equal(displayRoutineName("PPL 5 DIAS"), "PPL 5 DÍAS");
    assert.equal(displayRoutineName("Dias de fuerza"), "Días de fuerza");
    assert.equal(displayRoutineName("Rutina de 1 dia"), "Rutina de 1 día");
  });

  it("no toca palabras que solo contienen las letras", () => {
    assert.equal(displayRoutineName("Media sentadilla"), "Media sentadilla");
    assert.equal(displayRoutineName("Diaspora"), "Diaspora");
    assert.equal(displayRoutineName("Full Body Mayores"), "Full Body Mayores");
    assert.equal(displayRoutineName("Torso 4 días"), "Torso 4 días");
  });
});

describe("búsqueda", () => {
  it("normaliza tildes, mayúsculas y espacios", () => {
    assert.equal(normalizeSearch("Días GLÚTEOS"), "dias gluteos");
    assert.deepEqual(searchTokens("  Push   PULL "), ["push", "pull"]);
    assert.deepEqual(searchTokens("   "), []);
  });

  it("todas las palabras tienen que aparecer en nombre o descripción", () => {
    assert.equal(matchesQuery(CATALOG[2], "push 6"), true);
    assert.equal(matchesQuery(CATALOG[3], "push 6"), false);
    assert.equal(matchesQuery(CATALOG[9], "glúteos"), true);
    assert.equal(matchesQuery(CATALOG[0], ""), true);
  });

  it("filtra el catálogo real", () => {
    assert.equal(filterCatalog(CATALOG, { ...ALL, query: "legs" }).length, 5);
    assert.deepEqual(filterCatalog(CATALOG, { ...ALL, query: "legs", level: "principiante" }), []);
    // "Full Body Mayores" entra por su descripción ("2 días").
    assert.equal(filterCatalog(CATALOG, { ...ALL, query: "dias" }).length, 10);
    assert.deepEqual(ids(filterCatalog(CATALOG, { ...ALL, query: "push 6" })), ["ppl6", "pplxa6"]);
    assert.deepEqual(ids(filterCatalog(CATALOG, { ...ALL, query: "glúteos" })), ["prio5"]);
    assert.equal(filterCatalog(CATALOG, { ...ALL, query: "   " }).length, 10);
  });

  it("combina días, nivel y objetivo manteniendo el orden de entrada", () => {
    assert.deepEqual(ids(filterCatalog(CATALOG, { ...ALL, days: 5 })), ["ppl5", "pplxa5", "prio5"]);
    assert.deepEqual(ids(filterCatalog(CATALOG, { ...ALL, level: "avanzado" })), ["arnold6", "ppl6", "pplxa6"]);
    assert.deepEqual(filterCatalog(CATALOG, { ...ALL, level: "avanzado", objective: "mantenimiento" }), []);
  });
});

describe("highlightSegments", () => {
  it("marca la coincidencia sin tildes y conserva el texto original", () => {
    assert.deepEqual(highlightSegments("Push Pull Legs 5 días", "dias"), [
      { text: "Push Pull Legs 5 ", match: false },
      { text: "días", match: true },
    ]);
  });

  it("marca cada palabra de la búsqueda", () => {
    assert.deepEqual(highlightSegments("Push Pull Legs x Arnold Split 6 días", "push SPLIT"), [
      { text: "Push", match: true },
      { text: " Pull Legs x Arnold ", match: false },
      { text: "Split", match: true },
      { text: " 6 días", match: false },
    ]);
  });

  it("une rangos que se superponen o se tocan", () => {
    assert.deepEqual(highlightSegments("Pushpush", "push ushp"), [{ text: "Pushpush", match: true }]);
  });

  it("sin búsqueda o sin coincidencia devuelve un solo segmento", () => {
    assert.deepEqual(highlightSegments("Upper Lower", ""), [{ text: "Upper Lower", match: false }]);
    assert.deepEqual(highlightSegments("Upper Lower", "push"), [{ text: "Upper Lower", match: false }]);
  });
});

describe("sortCatalog", () => {
  it("recientes respeta el orden de la base", () => {
    assert.deepEqual(ids(sortCatalog(CATALOG, "recent")), ids(CATALOG));
  });

  it("nombre ordena en español con números naturales", () => {
    const sorted = ids(sortCatalog(CATALOG, "name"));
    assert.equal(sorted[0], "arnold6");
    assert.equal(sorted.at(-1), "ul4");
    assert.ok(sorted.indexOf("ppl5") < sorted.indexOf("ppl6"));
    assert.ok(sorted.indexOf("ppl6") < sorted.indexOf("pplxa5"));
    assert.ok(sorted.indexOf("mayores") < sorted.indexOf("fb3"));
  });

  it("más ejercicios es estable ante empates", () => {
    assert.deepEqual(ids(sortCatalog(CATALOG, "items")), [
      "arnold6",
      "ppl6",
      "pplxa6",
      "ppl5",
      "pplxa5",
      "prio5",
      "ul4",
      "mayores",
      "fb3",
      "fbm3",
    ]);
  });

  it("no muta la lista original", () => {
    const copy = [...CATALOG];
    sortCatalog(CATALOG, "name");
    assert.deepEqual(CATALOG, copy);
  });
});

describe("parsers", () => {
  it("valores desconocidos caen en el default", () => {
    assert.equal(parseLevelFilter("intermedio"), "intermedio");
    assert.equal(parseLevelFilter("experto"), "all");
    assert.equal(parseObjectiveFilter("fuerza"), "fuerza");
    assert.equal(parseObjectiveFilter("cardio"), "all");
    assert.equal(parseCatalogSort("name"), "name");
    assert.equal(parseCatalogSort("days"), "recent");
  });

  it("?dias= acepta solo 1 a 7", () => {
    assert.equal(parseDayOption("4"), 4);
    assert.equal(parseDayOption(undefined), "all");
    assert.equal(parseDayOption("0"), "all");
    assert.equal(parseDayOption("8"), "all");
    assert.equal(parseDayOption("12"), "all");
    assert.equal(parseDayOption("4.5"), "all");
    assert.equal(parseDayOption("todas"), "all");
  });
});

describe("días disponibles", () => {
  it("lista las cantidades con rutinas según nivel y objetivo", () => {
    assert.deepEqual(availableDayCounts(CATALOG, { level: "all", objective: "all" }), [2, 3, 4, 5, 6]);
    assert.deepEqual(availableDayCounts(CATALOG, { level: "intermedio", objective: "all" }), [4, 5]);
    assert.deepEqual(availableDayCounts(CATALOG, { level: "all", objective: "mantenimiento" }), [2, 3]);
    assert.deepEqual(availableDayCounts(CATALOG, { level: "avanzado", objective: "mantenimiento" }), []);
  });

  it("descarta cantidades imposibles", () => {
    const odd = [toCatalogRoutine({ ...TEMPLATES[0], id: "cero", days: [] }), toCatalogRoutine({ ...TEMPLATES[0], id: "ocho", days: Array.from({ length: 8 }, () => ({ items: [] })) })];
    assert.deepEqual(availableDayCounts(odd, { level: "all", objective: "all" }), []);
  });

  it("vuelve a Todas si el valor ya no está", () => {
    assert.equal(resolveDayOption(5, [6]), "all");
    assert.equal(resolveDayOption(5, [4, 5]), 5);
    assert.equal(resolveDayOption("all", []), "all");
  });

  it("sugiere las cantidades vecinas", () => {
    assert.deepEqual(neighborDayCounts([2, 3, 4, 5, 6], 5), [4, 6]);
    assert.deepEqual(neighborDayCounts([2, 3, 4, 5, 6], 2), [3]);
    assert.deepEqual(neighborDayCounts([2, 3, 4, 5, 6], 6), [5]);
    assert.deepEqual(neighborDayCounts([4, 5], 4), [5]);
    assert.deepEqual(neighborDayCounts([6], 6), []);
    assert.deepEqual(neighborDayCounts([2, 5], 5), [2]);
  });
});

describe("optionCounts", () => {
  it("cuenta con los demás filtros aplicados e ignora el propio", () => {
    assert.deepEqual(optionCounts(CATALOG, ALL, "level"), { principiante: 3, intermedio: 4, avanzado: 3 });
    assert.deepEqual(optionCounts(CATALOG, ALL, "objective"), { hipertrofia: 8, fuerza: 0, mantenimiento: 2 });
    assert.deepEqual(optionCounts(CATALOG, { ...ALL, days: 5 }, "level"), { principiante: 0, intermedio: 3, avanzado: 0 });
    assert.deepEqual(optionCounts(CATALOG, { ...ALL, query: "legs" }, "level"), { principiante: 0, intermedio: 3, avanzado: 2 });
    assert.deepEqual(optionCounts(CATALOG, { ...ALL, level: "avanzado" }, "level"), { principiante: 3, intermedio: 4, avanzado: 3 });
    assert.deepEqual(optionCounts(CATALOG, { ...ALL, level: "avanzado" }, "objective"), { hipertrofia: 3, fuerza: 0, mantenimiento: 0 });
  });
});

describe("destacadas", () => {
  it("toma la más reciente de cada nivel, de principiante a avanzado", () => {
    assert.deepEqual(ids(pickLevelFeatured(CATALOG)), ["mayores", "ppl5", "arnold6"]);
    assert.deepEqual(ids(pickLevelFeatured(filterCatalog(CATALOG, { ...ALL, level: "intermedio" }))), ["ppl5"]);
  });

  it("detecta un nivel compartido", () => {
    assert.equal(sharedLevel(filterCatalog(CATALOG, { ...ALL, days: 5 })), "intermedio");
    assert.equal(sharedLevel(CATALOG), null);
    assert.equal(sharedLevel([]), null);
  });

  it("el CTA emerald es de la card actual que no sea tu rutina activa", () => {
    assert.equal(featureCtaTone({ isCurrent: true, status: null }), "primary");
    assert.equal(featureCtaTone({ isCurrent: true, status: "saved" }), "primary");
    assert.equal(featureCtaTone({ isCurrent: true, status: "active" }), "neutral");
    assert.equal(featureCtaTone({ isCurrent: false, status: null }), "neutral");
  });
});

describe("textos", () => {
  it("reparte la semana", () => {
    assert.deepEqual(weekSplit(5), { train: 5, rest: 2, label: "5 entrenos · 2 descansos" });
    assert.equal(weekSplit(6).label, "6 entrenos · 1 descanso");
    assert.equal(weekSplit(1).label, "1 entreno · 6 descansos");
    assert.equal(weekSplit(7).label, "7 entrenos · sin descanso");
    assert.equal(weekSplit(9).train, 7);
  });

  it("conjuga singular y plural", () => {
    assert.equal(routineCountLabel(1), "1 rutina");
    assert.equal(routineCountLabel(3), "3 rutinas");
    assert.equal(dayCountLabel(1), "1 día");
    assert.equal(dayCountLabel(5), "5 días");
    assert.equal(catalogResultLabel(1), "Ver 1 rutina");
    assert.equal(catalogResultLabel(3), "Ver 3 rutinas");
  });

  it("titula los resultados", () => {
    assert.equal(resultsHeading(3, 5), "3 rutinas de 5 días");
    assert.equal(resultsHeading(1, 2), "1 rutina de 2 días");
    assert.equal(resultsHeading(10, "all"), "Las 10 rutinas");
    assert.equal(resultsHeading(1, "all"), "1 rutina");
    assert.equal(resultsHeading(0, "all"), "Sin rutinas");
  });

  it("anuncia el resultado a lectores de pantalla", () => {
    assert.equal(catalogAnnouncement({ searching: true, query: "push", count: 4, days: "all" }), "4 resultados para push");
    assert.equal(catalogAnnouncement({ searching: true, query: "push", count: 1, days: "all" }), "1 resultado para push");
    assert.equal(catalogAnnouncement({ searching: true, query: "legs", count: 0, days: "all" }), "Sin resultados para legs");
    assert.equal(catalogAnnouncement({ searching: true, query: " ", count: 10, days: "all" }), "10 rutinas");
    assert.equal(catalogAnnouncement({ searching: false, query: "push", count: 3, days: 5 }), "3 rutinas de 5 días");
  });

  it("explica por qué no hay resultados", () => {
    assert.equal(
      emptyResultsMessage({ query: "legs", level: "principiante", objective: "all", countWithoutFilters: 5 }),
      'Ninguna rutina de nivel principiante incluye "legs". Sin filtros hay 5.',
    );
    assert.equal(
      emptyResultsMessage({ query: "legs", level: "all", objective: "mantenimiento", countWithoutFilters: 5 }),
      'Ninguna rutina de objetivo mantenimiento incluye "legs". Sin filtros hay 5.',
    );
    assert.equal(
      emptyResultsMessage({ query: "legs", level: "principiante", objective: "mantenimiento", countWithoutFilters: 5 }),
      'Ninguna rutina de nivel principiante y objetivo mantenimiento incluye "legs". Sin filtros hay 5.',
    );
    assert.equal(
      emptyResultsMessage({ query: " xyz ", level: "all", objective: "all", countWithoutFilters: 0 }),
      'Ninguna rutina incluye "xyz".',
    );
    assert.equal(
      emptyResultsMessage({ query: "", level: "avanzado", objective: "mantenimiento", countWithoutFilters: 10 }),
      "No hay rutinas de nivel avanzado y objetivo mantenimiento. Sin filtros hay 10.",
    );
  });
});

describe("rueda y carrusel", () => {
  it("mueve la selección con teclado como un radiogroup", () => {
    assert.equal(nextRadioIndex("ArrowRight", 5, 6), 0);
    assert.equal(nextRadioIndex("ArrowDown", 1, 6), 2);
    assert.equal(nextRadioIndex("ArrowLeft", 0, 6), 5);
    assert.equal(nextRadioIndex("ArrowUp", 3, 6), 2);
    assert.equal(nextRadioIndex("Home", 3, 6), 0);
    assert.equal(nextRadioIndex("End", 0, 6), 5);
    assert.equal(nextRadioIndex("Enter", 0, 6), null);
    assert.equal(nextRadioIndex("ArrowRight", 0, 0), null);
  });

  it("interpola la posición entre centros", () => {
    assert.equal(fractionalIndex([100, 200, 300], 150), 0.5);
    assert.equal(fractionalIndex([100, 200, 300], 50), 0);
    assert.equal(fractionalIndex([100, 200, 300], 400), 2);
    assert.equal(fractionalIndex([100, 240, 320], 270), 1.375);
    assert.equal(fractionalIndex([100], 900), 0);
    assert.equal(fractionalIndex([], 900), 0);
  });

  it("elige el slide más cercano y el último al llegar al final", () => {
    assert.equal(carouselIndex([0, 312, 624], 0, 700), 0);
    assert.equal(carouselIndex([0, 312, 624], 290, 700), 1);
    assert.equal(carouselIndex([0, 312, 624], 699.5, 700), 2);
    assert.equal(carouselIndex([0, 312, 624], 188, 188), 2);
    assert.equal(carouselIndex([0, 312, 624], 100, 188), 0);
    assert.equal(carouselIndex([0, 312, 624], 0, 0), 0);
  });

  it("escala y apaga los glifos según la distancia al centro", () => {
    assert.deepEqual(wheelGlyph(0, "number"), { scale: 1, color: "var(--foreground)" });
    assert.deepEqual(wheelGlyph(1, "number"), { scale: 0.3929, color: "var(--foreground-subtle)" });
    assert.deepEqual(wheelGlyph(0.5, "number"), {
      scale: 0.6964,
      color: "color-mix(in oklab, var(--foreground) 50%, var(--foreground-subtle))",
    });
    const far = wheelGlyph(2, "number");
    assert.equal(far.scale, 0.25);
    assert.equal(far.color, "color-mix(in oklab, var(--foreground-subtle) 70%, var(--border-strong))");
    assert.deepEqual(wheelGlyph(5, "number"), far);
    assert.deepEqual(wheelGlyph(-1, "number"), wheelGlyph(1, "number"));
    assert.equal(wheelGlyph(1, "word").scale, 0.3846);
    assert.equal(wheelGlyph(2, "word").scale, 0.3077);
  });
});
