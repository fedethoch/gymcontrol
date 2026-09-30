"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";
import { formatTimeInAppZone } from "@/app/lib/local-date";
import { toggleSupplementIntakeAction } from "@/app/lib/supplement-actions";
import {
  HOME_SUPPLEMENTS_VISIBLE,
  parseSupplementTime,
  SUPPLEMENTS_LINK_PARAM,
  type HomeSupplement,
} from "@/app/lib/supplements";
import { cn } from "@/app/lib/utils";

const EDIT_HREF = "/configuracion?panel=suplementos";
const SECTION_ID = "home-suplementos";
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Z7 · Suplementos de hoy (DESIGN.md §10.1): filas con círculo, hasta 3 a la vista y "Ver todos (N)".
 * El orden llega del server (pendientes primero, SU-D5) y tildar no lo cambia.
 */
export function HomeSupplements({
  initialItems,
  nowMinutes,
  variant = "section",
}: {
  initialItems: HomeSupplement[];
  /** Hora argentina del render: un pendiente cuya hora no llegó va más tenue. */
  nowMinutes: number;
  variant?: "section" | "card";
}) {
  const [items, setItems] = useState(initialItems);
  const [expanded, setExpanded] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const busyRef = useRef(new Set<string>());
  const reduceMotion = useReducedMotion();
  const listId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  // Desde el aviso con un pendiente oculto: se scrollea cuando termina de desplegarse (si no, el alto nuevo
  // todavía no existe y el scroll queda corto).
  const scrollAfterExpandRef = useRef(false);

  // Desde el aviso (`/?suplementos=hoy`): bajar hasta acá, desplegar si un pendiente quedó oculto y resaltar.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(SUPPLEMENTS_LINK_PARAM)) return;

    url.searchParams.delete(SUPPLEMENTS_LINK_PARAM);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);

    const section = sectionRef.current;
    if (!section || section.offsetParent === null) return;

    const hiddenPending = initialItems.slice(HOME_SUPPLEMENTS_VISIBLE).some((item) => !item.takenAt);
    let inner = 0;
    // Diferido: el efecto no dispara renders en cadena y el scroll corre con el layout ya pintado.
    const frame = requestAnimationFrame(() => {
      setHighlight(true);

      if (!hiddenPending) {
        scrollToSection(section, reduceMotion);
        return;
      }

      setExpanded(true);
      if (reduceMotion) {
        inner = requestAnimationFrame(() => scrollToSection(section, true));
      } else {
        scrollAfterExpandRef.current = true;
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(inner);
    };
  }, [initialItems, reduceMotion]);

  async function toggle(item: HomeSupplement) {
    if (busyRef.current.has(item.id)) return;
    busyRef.current.add(item.id);
    setHighlight(false);

    const taken = !item.takenAt;
    const optimistic = taken ? formatTimeInAppZone(new Date()) : null;
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, takenAt: optimistic } : row)));

    const result = await toggleSupplementIntakeAction(item.id, taken).catch(() => null);
    busyRef.current.delete(item.id);

    if (!result?.ok) {
      toast.error(result?.message ?? (taken ? "No se pudo tildar." : "No se pudo destildar."));
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, takenAt: item.takenAt } : row)));
      return;
    }

    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, takenAt: result.takenAt } : row)));
  }

  const visible = items.slice(0, HOME_SUPPLEMENTS_VISIBLE);
  const hidden = items.slice(HOME_SUPPLEMENTS_VISIBLE);
  const takenCount = items.filter((item) => item.takenAt).length;
  const isCard = variant === "card";

  const row = (item: HomeSupplement) => (
    <SupplementRow
      key={item.id}
      item={item}
      later={!item.takenAt && parseSupplementTime(item.time) > nowMinutes}
      highlight={highlight && !item.takenAt}
      reduceMotion={Boolean(reduceMotion)}
      bleed={isCard ? "card" : "page"}
      onToggle={() => void toggle(item)}
    />
  );

  return (
    <section
      ref={sectionRef}
      id={isCard ? undefined : SECTION_ID}
      aria-labelledby={`${listId}-title`}
      className={cn(
        isCard ? "flex flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4" : "grid gap-3",
      )}
    >
      {isCard ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 id={`${listId}-title`} className="font-display text-sm font-semibold text-[var(--foreground)]">
              Suplementos de hoy
            </h3>
            <p className="mt-0.5 text-xs tabular-nums text-[var(--foreground-muted)]">
              {takenCount} de {items.length} tomados
            </p>
          </div>
          <Link
            href={EDIT_HREF}
            className="pressable -mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[var(--accent-bright)] hover:text-[var(--accent-strong)]"
          >
            Editar
          </Link>
        </div>
      ) : (
        <HomeSectionHeader id={`${listId}-title`} title="Suplementos" action={{ href: EDIT_HREF, label: "Editar" }} />
      )}

      <div>
        <ul aria-label="Suplementos de hoy">{visible.map(row)}</ul>

        {hidden.length > 0 ? (
          <>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.ul
                  id={`${listId}-more`}
                  aria-label="Más suplementos"
                  key="more"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  onAnimationComplete={() => {
                    if (!scrollAfterExpandRef.current || !sectionRef.current) return;
                    scrollAfterExpandRef.current = false;
                    scrollToSection(sectionRef.current, false);
                  }}
                  className="overflow-hidden [&>li:first-child]:border-t"
                >
                  {hidden.map(row)}
                </motion.ul>
              ) : null}
            </AnimatePresence>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`${listId}-more`}
              onClick={() => setExpanded((open) => !open)}
              className="flex min-h-[52px] w-full items-center justify-center gap-1.5 border-t border-[var(--border)] text-sm font-semibold text-[var(--foreground-muted)] outline-none transition-colors hover:text-[var(--foreground)] active:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
            >
              {expanded ? "Ver menos" : `Ver todos (${items.length})`}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-[18px] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  expanded && "rotate-180",
                )}
              />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Solo scrollea `.shell-main`: scrollIntoView también corre `.app-shell` (fijo, overflow hidden) cuando la
 * sección es lo último de la página y no puede quedar arriba, y deja el shell desplazado.
 */
function scrollToSection(section: HTMLElement, instant: boolean | null) {
  const scroller = section.closest<HTMLElement>(".shell-main");
  if (!scroller) return;

  const top = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
  scroller.scrollTo({ top, behavior: instant ? "auto" : "smooth" });
}

function SupplementRow({
  item,
  later,
  highlight,
  reduceMotion,
  bleed,
  onToggle,
}: {
  item: HomeSupplement;
  later: boolean;
  highlight: boolean;
  reduceMotion: boolean;
  bleed: "page" | "card";
  onToggle: () => void;
}) {
  const taken = Boolean(item.takenAt);

  return (
    <li className="relative isolate grid min-h-14 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-3 border-t border-[var(--border)] first:border-t-0">
      {highlight && !reduceMotion ? (
        <motion.span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 -z-10 border-y border-[var(--border-strong)] bg-[var(--card-alt)]",
            bleed === "page" ? "-inset-x-4" : "-inset-x-2 rounded-lg",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4, times: [0, 0.12, 0.7, 1], ease: "easeOut" }}
        />
      ) : null}
      <span
        className={cn(
          "truncate text-base font-semibold transition-colors duration-150",
          taken ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
        )}
      >
        {item.name}
      </span>
      <span
        className={cn(
          "font-mono text-sm tabular-nums",
          later ? "text-[var(--foreground-subtle)]" : "text-[var(--foreground-muted)]",
        )}
      >
        <span className="sr-only">{taken ? "Tomado a las " : "Aviso a las "}</span>
        {item.takenAt ?? item.time}
      </span>
      <button
        type="button"
        aria-pressed={taken}
        aria-label={`${item.name}: ${taken ? "tomado" : "marcar como tomado"}`}
        onClick={onToggle}
        className="group grid size-11 place-items-center rounded-full outline-none focus-visible:shadow-[var(--focus-glow)]"
      >
        <span
          className={cn(
            "grid size-7 place-items-center rounded-full border-2 transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-90 motion-reduce:transition-none motion-reduce:group-active:scale-100",
            taken ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-strong)]",
          )}
        >
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className={cn(
              "size-4 text-[var(--accent-foreground)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              taken ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </span>
      </button>
    </li>
  );
}
