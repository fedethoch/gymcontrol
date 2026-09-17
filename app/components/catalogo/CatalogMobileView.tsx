"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";

import { CatalogEmpty, CatalogNoResults } from "@/app/components/catalogo/CatalogEmptyState";
import { CatalogFeatureCard } from "@/app/components/catalogo/CatalogFeatureCard";
import { CatalogRoutineList } from "@/app/components/catalogo/CatalogRoutineRow";
import { CatalogTopBar } from "@/app/components/catalogo/CatalogTopBar";
import { CompactDayBar } from "@/app/components/catalogo/CompactDayBar";
import { DayCountWheel } from "@/app/components/catalogo/DayCountWheel";
import { LevelCarousel } from "@/app/components/catalogo/LevelCarousel";
import { WeekBar } from "@/app/components/catalogo/WeekBar";
import { FilterDrawer, type FilterGroup } from "@/app/components/shared/FilterPanel";
import { premiumEase } from "@/app/components/ui/motion";
import {
  CATALOG_SORTS,
  availableDayCounts,
  catalogAnnouncement,
  catalogResultLabel,
  dayCountLabel,
  emptyResultsMessage,
  featureCtaTone,
  filterCatalog,
  neighborDayCounts,
  optionCounts,
  parseCatalogSort,
  parseLevelFilter,
  parseObjectiveFilter,
  pickLevelFeatured,
  resolveDayOption,
  resultsHeading,
  sharedLevel,
  sortCatalog,
  type CatalogRoutine,
  type CatalogSort,
  type DayOption,
  type LevelFilter,
  type ObjectiveFilter,
  type SavedStatus,
} from "@/app/lib/routine-catalog";
import {
  ROUTINE_DIFFICULTIES,
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVES,
  ROUTINE_OBJECTIVE_LABELS,
} from "@/app/lib/routine-metadata";
import { cn } from "@/app/lib/utils";

const H2_CLASS = "font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]";

/**
 * Catálogo mobile "Planificador" (DESIGN.md §16): pregunta + rueda de días, resultados que se adaptan,
 * búsqueda inline, barra compacta al scrollear y un solo sheet de filtros.
 */
export function CatalogMobileView({
  routines,
  statusById,
  initialDays = "all",
}: {
  routines: CatalogRoutine[];
  statusById: Record<string, SavedStatus>;
  /** `?dias=` al volver del detalle (DESIGN.md §19). */
  initialDays?: DayOption;
}) {
  const questionId = useId();
  const [days, setDays] = useState<DayOption>(initialDays);
  const [level, setLevel] = useState<LevelFilter>("all");
  const [objective, setObjective] = useState<ObjectiveFilter>("all");
  const [sort, setSort] = useState<CatalogSort>("recent");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wheelAbove, setWheelAbove] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wheelBlockRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const available = availableDayCounts(routines, { level, objective });
  const options: DayOption[] = ["all", ...available];
  const effectiveDays = searchOpen ? "all" : resolveDayOption(days, available);
  const filters = { query: searchOpen ? query : "", days: effectiveDays, level, objective };
  const matching = filterCatalog(routines, filters);
  const results = sortCatalog(matching, sort);
  const activeFilterCount = (level === "all" ? 0 : 1) + (objective === "all" ? 0 : 1);
  const announcementText = catalogAnnouncement({
    searching: searchOpen,
    query,
    count: results.length,
    days: effectiveDays,
  });

  useEffect(() => {
    if (!interacted) return;
    const timer = window.setTimeout(() => setAnnouncement(announcementText), searchOpen ? 600 : 150);
    return () => window.clearTimeout(timer);
  }, [announcementText, interacted, searchOpen]);

  // Barra compacta: aparece cuando la rueda salió por arriba (patrón de RoutineWeekView).
  useEffect(() => {
    const target = wheelBlockRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setWheelAbove(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0));
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [searchOpen, available.length]);

  if (routines.length === 0) return <CatalogEmpty />;

  function markInteracted() {
    if (!interacted) setInteracted(true);
  }

  function revealResults() {
    const heading = resultsHeadingRef.current;
    if (!heading || heading.getBoundingClientRect().top > 120) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }

  function changeDays(next: DayOption, reveal = false) {
    markInteracted();
    if (next === effectiveDays) return;
    if (navigator.userActivation?.hasBeenActive && "vibrate" in navigator) navigator.vibrate(8);
    if (!reveal) {
      setDays(next);
      return;
    }
    flushSync(() => setDays(next));
    revealResults();
  }

  function changeLevel(value: string) {
    markInteracted();
    const next = parseLevelFilter(value);
    setLevel(next);
    setDays((current) => resolveDayOption(current, availableDayCounts(routines, { level: next, objective })));
  }

  function changeObjective(value: string) {
    markInteracted();
    const next = parseObjectiveFilter(value);
    setObjective(next);
    setDays((current) => resolveDayOption(current, availableDayCounts(routines, { level, objective: next })));
  }

  function clearFilters() {
    markInteracted();
    setLevel("all");
    setObjective("all");
    setSort("recent");
  }

  function openSearch() {
    markInteracted();
    flushSync(() => setSearchOpen(true));
    inputRef.current?.closest(".shell-main")?.scrollTo({ top: 0 });
    // En iOS el teclado solo se abre si el foco llega dentro del mismo toque.
    inputRef.current?.focus({ preventScroll: true });
  }

  function closeSearch() {
    flushSync(() => {
      setSearchOpen(false);
      setQuery("");
    });
    searchButtonRef.current?.focus({ preventScroll: true });
  }

  function openFilters(event: MouseEvent<HTMLButtonElement>) {
    markInteracted();
    returnFocusRef.current = event.currentTarget;
    setFiltersOpen(true);
  }

  function handleFiltersOpenChange(open: boolean) {
    // Si el botón que abrió el sheet ya no existe (la barra compacta se fue), el foco vuelve al de arriba.
    if (!open && !returnFocusRef.current?.isConnected) returnFocusRef.current = filterButtonRef.current;
    setFiltersOpen(open);
  }

  const levelCounts = optionCounts(routines, filters, "level");
  const objectiveCounts = optionCounts(routines, filters, "objective");
  const groups: FilterGroup[] = [
    {
      label: "Nivel",
      value: level,
      onChange: changeLevel,
      options: ROUTINE_DIFFICULTIES.map((key) => ({
        value: key,
        label: ROUTINE_DIFFICULTY_LABELS[key],
        count: levelCounts[key],
      })),
    },
    {
      label: "Objetivo",
      value: objective,
      onChange: changeObjective,
      options: ROUTINE_OBJECTIVES.map((key) => ({
        value: key,
        label: ROUTINE_OBJECTIVE_LABELS[key],
        count: objectiveCounts[key],
      })),
    },
    {
      label: "Ordenar por",
      kind: "sort",
      value: sort,
      onChange: (value) => {
        markInteracted();
        setSort(parseCatalogSort(value));
      },
      options: CATALOG_SORTS.map(({ value, label }) => ({ value, label })),
    },
  ];

  const trimmedQuery = query.trim();
  const featured = !searchOpen && effectiveDays === "all" ? pickLevelFeatured(matching) : [];
  const [lead, ...rest] = results;
  const leadStatus = lead ? (statusById[lead.id] ?? null) : null;
  const neighbors = effectiveDays === "all" ? [] : neighborDayCounts(available, effectiveDays);
  const levelOfResults = sharedLevel(results);

  const headingText = searchOpen
    ? trimmedQuery
      ? "Resultados"
      : resultsHeading(results.length, "all")
    : resultsHeading(results.length, effectiveDays);

  const resultsHeader = (aside: string | null) => (
    <div className="flex items-baseline justify-between gap-3">
      <h2
        ref={resultsHeadingRef}
        className={cn(H2_CLASS, "scroll-mt-[calc(env(safe-area-inset-top)+6.5rem)]")}
      >
        {headingText}
      </h2>
      {aside ? <span className="shrink-0 text-[13px] text-[var(--foreground-muted)]">{aside}</span> : null}
    </div>
  );

  let body;
  if (results.length === 0) {
    body = (
      <CatalogNoResults
        message={emptyResultsMessage({
          query: filters.query,
          level,
          objective,
          countWithoutFilters: filterCatalog(routines, { ...filters, level: "all", objective: "all" }).length,
        })}
        onRemoveFilters={activeFilterCount > 0 ? clearFilters : undefined}
        onClearSearch={searchOpen && trimmedQuery ? () => setQuery("") : undefined}
      />
    );
  } else if (searchOpen) {
    body = (
      <section className="grid gap-3">
        {resultsHeader(trimmedQuery ? String(results.length) : null)}
        <CatalogRoutineList routines={results} statusById={statusById} query={query} />
      </section>
    );
  } else if (effectiveDays !== "all" && lead) {
    body = (
      <section className="grid gap-3">
        {resultsHeader(levelOfResults ? ROUTINE_DIFFICULTY_LABELS[levelOfResults] : null)}
        <CatalogFeatureCard
          routine={lead}
          status={leadStatus}
          ctaTone={featureCtaTone({ isCurrent: true, status: leadStatus })}
          className="mt-1"
        />
        {rest.length > 0 ? <CatalogRoutineList routines={rest} statusById={statusById} /> : null}
        {results.length <= 3 && neighbors.length > 0 ? (
          <p className="text-[13px] leading-relaxed text-[var(--foreground-muted)]">
            ¿Pocas opciones? Probá con{" "}
            {neighbors.map((count, index) => (
              <Fragment key={count}>
                {index > 0 ? " o " : null}
                <button
                  type="button"
                  onClick={() => changeDays(count, true)}
                  className="pressable inline-flex min-h-11 items-center rounded-md px-0.5 font-semibold text-[var(--foreground)] underline decoration-[var(--border-strong)] underline-offset-4 outline-none focus-visible:shadow-[var(--focus-glow)]"
                >
                  {index === neighbors.length - 1 ? dayCountLabel(count) : count}
                </button>
              </Fragment>
            ))}
            .
          </p>
        ) : null}
      </section>
    );
  } else {
    body = (
      <>
        {featured.length >= 2 ? (
          <LevelCarousel key={featured.map((routine) => routine.id).join()} routines={featured} statusById={statusById} />
        ) : null}
        <section className="grid gap-3">
          {resultsHeader(null)}
          <CatalogRoutineList routines={results} statusById={statusById} />
        </section>
      </>
    );
  }

  return (
    <>
      <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 h-0">
        <AnimatePresence>
          {wheelAbove && !searchOpen ? (
            <motion.div
              key="compact-bar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: premiumEase }}
              className="absolute inset-x-0 top-0"
            >
              <CompactDayBar
                options={options}
                value={effectiveDays}
                onChange={(next) => changeDays(next, true)}
                onOpenSearch={openSearch}
                activeFilterCount={activeFilterCount}
                onOpenFilters={openFilters}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <CatalogTopBar
        searchOpen={searchOpen}
        query={query}
        onQueryChange={(value) => {
          markInteracted();
          setQuery(value);
        }}
        onOpenSearch={openSearch}
        onCloseSearch={closeSearch}
        inputRef={inputRef}
        searchButtonRef={searchButtonRef}
        filterButtonRef={filterButtonRef}
        activeFilterCount={activeFilterCount}
        onOpenFilters={openFilters}
      />

      {searchOpen ? (
        <h1 className="sr-only">Buscar en el catálogo de rutinas</h1>
      ) : (
        <div ref={wheelBlockRef} className="mt-1 grid">
          <h1
            id={questionId}
            className="text-balance font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-[var(--foreground)]"
          >
            ¿Cuántos días por semana podés entrenar?
          </h1>
          {available.length > 0 ? (
            <div className="mt-3">
              <DayCountWheel
                options={options}
                value={effectiveDays}
                onChange={(next) => changeDays(next)}
                labelledBy={questionId}
              />
            </div>
          ) : null}
          {effectiveDays !== "all" ? <WeekBar days={effectiveDays} className="mt-5" /> : null}
        </div>
      )}

      <div
        key={searchOpen ? "search" : String(effectiveDays)}
        className={cn("mt-8 grid content-start gap-8", interacted && "motion-empty-state")}
      >
        {body}
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <FilterDrawer
        open={filtersOpen}
        onOpenChange={handleFiltersOpenChange}
        returnFocusRef={returnFocusRef}
        groups={groups}
        onClear={clearFilters}
        resultLabel={catalogResultLabel(results.length)}
      />
    </>
  );
}
