// Hero del home mobile (DESIGN.md §10.2): qué muestra para hoy y para cada día que se elige en la semana de arriba.
// Solo lógica pura: se testea con `node --test`.

import type { HeroState } from "@/app/lib/home-dashboard";
import {
  isoWeekday,
  relativeDayLabel,
  summarizeWeek,
  weekDates,
  weekdayInfo,
  weekdayTitle,
  type PlannedDay,
} from "@/app/lib/training-schedule";

export type HeroDay = {
  id: string;
  order: number;
  total: number;
  name: string;
  /** Hasta 2 grupos musculares, ya en texto de UI. */
  groups: string[];
  minutes: number;
  exerciseCount: number;
  seriesCount: number;
  /** `/rutinas/dia` de ese día. */
  href: string;
};

/** Próximo día de entreno. `when` = "mañana" / "viernes"; `null` sin calendario. */
export type HeroNext = { day: HeroDay; when: string | null };

export type HeroInput =
  | { kind: "no_routine"; hasSavedRoutines: boolean }
  | {
      kind: "in_progress";
      day: HeroDay;
      progress: { done: number; total: number; nextExerciseName: string | null };
    }
  | { kind: "week_done" }
  | { kind: "done_today"; weekdayLabel: string; next: HeroNext | null; missed: HeroDay | null }
  | { kind: "needs_schedule"; routineName: string; dayCount: number; startDay: HeroDay | null }
  | { kind: "rest"; weekdayLabel: string; missed: HeroDay | null; next: HeroNext | null }
  | { kind: "ready"; weekdayLabel: string; day: HeroDay }
  /** Otro día de la semana con un día de la rutina sin hacer. */
  | { kind: "planned"; weekdayLabel: string; day: HeroDay; missed: boolean }
  /** Otro día de la semana cuyo día de la rutina ya se hizo. `doneOn` = día de semana en que se hizo. */
  | { kind: "planned_done"; weekdayLabel: string; day: HeroDay; doneOn: string | null }
  /** Otro día de la semana que no es de entreno. */
  | { kind: "day_off"; weekdayLabel: string };

export type HeroTitlePart = { text: string; accent?: boolean };

export type HeroLine =
  | { kind: "stats"; minutes: number; exercises: number; series: number }
  | { kind: "progress"; done: number; total: number; nextExerciseName: string | null }
  | { kind: "text"; parts: Array<{ text: string; strong?: boolean }> };

export type HeroAction = { label: string; href: string };

export type HeroView = {
  /** `dim` = foto oscurecida y alto corto. */
  tone: "bright" | "dim";
  height: "tall" | "medium" | "short";
  chip: { text: string; mark: "none" | "live" | "check" };
  title: HeroTitlePart[];
  line: HeroLine | null;
  /** CTA emerald de 56px. */
  primary: (HeroAction & { icon: "play" | "chevron" }) | null;
  /** Botón neutro de 52px. */
  secondary: HeroAction | null;
  /** Link de texto debajo de la acción. */
  link: HeroAction | null;
  /** El CTA emerald abre el selector de días. */
  chooseDays: boolean;
  /** Día cuyo sheet de ejercicios se ofrece junto a la acción, con el texto del CTA del sheet. */
  sheet: { dayId: string; ctaLabel: string } | null;
};

/** "Espalda & Bíceps" con el `&` en emerald; un grupo solo; sin grupos, el nombre del día. */
export function groupTitle(day: HeroDay): HeroTitlePart[] {
  if (day.groups.length >= 2) {
    return [{ text: `${day.groups[0]} ` }, { text: "&", accent: true }, { text: ` ${day.groups[1]}` }];
  }
  return [{ text: day.groups[0] ?? day.name }];
}

/** "Espalda & Bíceps" en texto plano. */
export function dayTitle(day: HeroDay): string {
  return day.groups.length >= 2 ? `${day.groups[0]} & ${day.groups[1]}` : (day.groups[0] ?? day.name);
}

const BASE: Omit<HeroView, "chip" | "title"> = {
  tone: "bright",
  height: "tall",
  line: null,
  primary: null,
  secondary: null,
  link: null,
  chooseDays: false,
  sheet: null,
};

const SEE_ROUTINE: HeroAction = { label: "Ver rutina", href: "/rutinas" };

function stats(day: HeroDay): HeroLine {
  return { kind: "stats", minutes: day.minutes, exercises: day.exerciseCount, series: day.seriesCount };
}

function nextLine(next: HeroNext): HeroLine {
  const when = next.when ? `${next.when} · ` : "";
  return {
    kind: "text",
    parts: [{ text: "Próximo: " }, { text: `${when}Día ${next.day.order} · ${dayTitle(next.day)}`, strong: true }],
  };
}

function missedLine(day: HeroDay): HeroLine {
  return {
    kind: "text",
    parts: [
      { text: "Te quedó el " },
      { text: `Día ${day.order} · ${dayTitle(day)}`, strong: true },
      { text: " y con los días que te quedan no cerrás la semana." },
    ],
  };
}

export function buildHeroView(input: HeroInput): HeroView {
  switch (input.kind) {
    case "no_routine":
      return {
        ...BASE,
        height: "medium",
        chip: { text: "Sin rutina activa", mark: "none" },
        title: [{ text: "Elegí tu " }, { text: "rutina", accent: true }],
        line: {
          kind: "text",
          parts: [
            {
              text: input.hasSavedRoutines ? "Activá una de tus rutinas guardadas" : "Elegí una del catálogo para empezar",
            },
          ],
        },
        primary: input.hasSavedRoutines
          ? { label: "Mis rutinas", href: "/rutinas", icon: "chevron" }
          : { label: "Explorar rutinas", href: "/catalogo", icon: "chevron" },
      };
    case "in_progress":
      return {
        ...BASE,
        chip: { text: "En curso", mark: "live" },
        title: groupTitle(input.day),
        line: { kind: "progress", ...input.progress },
        primary: { label: "Continuar", href: input.day.href, icon: "play" },
        sheet: { dayId: input.day.id, ctaLabel: "Continuar" },
      };
    case "week_done":
      return {
        ...BASE,
        tone: "dim",
        height: "short",
        chip: { text: "Semana completa", mark: "none" },
        title: [{ text: "Semana " }, { text: "cerrada", accent: true }],
        line: { kind: "text", parts: [{ text: "El lunes arranca una nueva semana" }] },
        secondary: SEE_ROUTINE,
      };
    case "done_today":
      return {
        ...BASE,
        tone: "dim",
        height: "short",
        chip: { text: `${input.weekdayLabel} · hecho`, mark: "check" },
        title: [{ text: "Entreno " }, { text: "hecho", accent: true }],
        line: input.next ? nextLine(input.next) : input.missed ? missedLine(input.missed) : null,
        secondary: SEE_ROUTINE,
      };
    case "needs_schedule":
      return {
        ...BASE,
        chip: { text: `${input.routineName} · ${input.dayCount} ${input.dayCount === 1 ? "día" : "días"}`, mark: "none" },
        title: [{ text: "¿Qué días vas al " }, { text: "gym", accent: true }, { text: "?" }],
        line: { kind: "text", parts: [{ text: "Elegí cuándo vas y cada día te decimos qué toca." }] },
        chooseDays: true,
        link: input.startDay
          ? { label: `Entrenar ahora · Día ${input.startDay.order}`, href: input.startDay.href }
          : null,
      };
    case "rest":
      return {
        ...BASE,
        tone: "dim",
        height: "short",
        chip: { text: `${input.weekdayLabel} · Descanso`, mark: "none" },
        title: input.missed
          ? [{ text: "Hoy no " }, { text: "toca", accent: true }]
          : [{ text: "Hoy toca " }, { text: "descanso", accent: true }],
        line: input.missed ? missedLine(input.missed) : input.next ? nextLine(input.next) : null,
        secondary: input.missed
          ? { label: `Hacer el Día ${input.missed.order} hoy`, href: input.missed.href }
          : input.next
            ? { label: "Entrenar igual", href: input.next.day.href }
            : null,
      };
    case "ready":
      return {
        ...BASE,
        chip: { text: `${input.weekdayLabel} · Día ${input.day.order} de ${input.day.total}`, mark: "none" },
        title: groupTitle(input.day),
        line: stats(input.day),
        primary: { label: "Empezar", href: input.day.href, icon: "play" },
        sheet: { dayId: input.day.id, ctaLabel: "Empezar" },
      };
    case "planned":
      return {
        ...BASE,
        chip: {
          text: input.missed
            ? `${input.weekdayLabel} · Te quedó`
            : `${input.weekdayLabel} · Día ${input.day.order} de ${input.day.total}`,
          mark: "none",
        },
        title: groupTitle(input.day),
        line: stats(input.day),
        secondary: { label: "Hacerlo hoy", href: input.day.href },
        sheet: { dayId: input.day.id, ctaLabel: "Hacerlo hoy" },
      };
    case "planned_done":
      return {
        ...BASE,
        tone: "dim",
        height: "short",
        chip: { text: `${input.weekdayLabel} · hecho`, mark: "check" },
        title: groupTitle(input.day),
        line: input.doneOn
          ? { kind: "text", parts: [{ text: "Lo hiciste el " }, { text: input.doneOn, strong: true }, { text: "." }] }
          : null,
        secondary: { label: `Ver día ${input.day.order}`, href: input.day.href },
      };
    case "day_off":
      return {
        ...BASE,
        tone: "dim",
        height: "short",
        chip: { text: `${input.weekdayLabel} · Descanso`, mark: "none" },
        title: [{ text: "Día " }, { text: "libre", accent: true }],
        line: { kind: "text", parts: [{ text: "No es uno de tus días de entreno." }] },
      };
  }
}

/**
 * Qué muestra el hero hoy (según `state`, de `resolveHeroState`) y, con días elegidos, en cada otro día de la
 * semana que se toque arriba. `days` son los días de la rutina en orden; `plan` sale de `planWeek`.
 */
export function buildHomeHeroInputs(args: {
  state: HeroState;
  todayKey: string;
  hasSavedRoutines: boolean;
  routineName: string;
  days: readonly HeroDay[];
  openDay: { id: string; progress: { done: number; total: number; nextExerciseName: string | null } } | null;
  /** Primer día sin hacer de la semana, en orden (sin días elegidos es el que toca). */
  nextPendingId: string | null;
  plan: readonly PlannedDay[] | null;
  /** Día de la rutina → fecha en que se hizo esta semana. */
  completedDayDates: Record<string, string>;
}): { today: HeroInput; previews: Record<string, HeroInput> } {
  const byId = new Map(args.days.map((day) => [day.id, day]));
  const week = args.plan ? summarizeWeek(args.plan) : null;
  const weekdayLabel = weekdayTitle(isoWeekday(args.todayKey));
  const nextPending = args.nextPendingId ? (byId.get(args.nextPendingId) ?? null) : null;
  const firstMissed = week?.missed[0] ? (byId.get(week.missed[0].id) ?? null) : null;
  const plannedNext = (planned: PlannedDay | null): HeroNext | null => {
    const day = planned ? byId.get(planned.id) : undefined;
    return planned && day ? { day, when: relativeDayLabel(planned.dateKey, args.todayKey) } : null;
  };
  const inProgress = (): HeroInput | null => {
    const day = args.openDay ? byId.get(args.openDay.id) : undefined;
    return args.openDay && day ? { kind: "in_progress", day, progress: args.openDay.progress } : null;
  };

  const today = ((): HeroInput => {
    switch (args.state) {
      case "no_routine":
        return { kind: "no_routine", hasSavedRoutines: args.hasSavedRoutines };
      case "in_progress":
        return inProgress() ?? { kind: "week_done" };
      case "week_done":
        return { kind: "week_done" };
      case "done_today":
        return {
          kind: "done_today",
          weekdayLabel,
          next: week ? plannedNext(week.next) : nextPending ? { day: nextPending, when: null } : null,
          missed: week && !week.next ? firstMissed : null,
        };
      case "needs_schedule":
        return { kind: "needs_schedule", routineName: args.routineName, dayCount: args.days.length, startDay: nextPending };
      case "rest":
        return { kind: "rest", weekdayLabel, missed: firstMissed, next: week ? plannedNext(week.next) : null };
      case "ready": {
        const day = (week?.today ? byId.get(week.today.id) : undefined) ?? nextPending;
        return day ? { kind: "ready", weekdayLabel, day } : { kind: "week_done" };
      }
    }
  })();

  const previews: Record<string, HeroInput> = {};
  if (!args.plan) return { today, previews };

  for (const { dateKey, iso } of weekDates(args.todayKey)) {
    if (dateKey === args.todayKey) continue;
    const label = weekdayTitle(iso);
    const planned = args.plan.find((day) => day.iso === iso);
    const plannedDay = planned ? byId.get(planned.id) : undefined;

    if (planned && plannedDay) {
      const doneDate = args.completedDayDates[planned.id];
      previews[dateKey] =
        args.openDay?.id === planned.id
          ? (inProgress() ?? { kind: "day_off", weekdayLabel: label })
          : planned.status === "done"
            ? {
                kind: "planned_done",
                weekdayLabel: label,
                day: plannedDay,
                doneOn: doneDate ? weekdayInfo(isoWeekday(doneDate)).name : null,
              }
            : { kind: "planned", weekdayLabel: label, day: plannedDay, missed: planned.status === "missed" };
      continue;
    }

    // Día libre: si ese día se hizo un día de la rutina, se muestra hecho.
    const doneHereId = Object.keys(args.completedDayDates).find((id) => args.completedDayDates[id] === dateKey);
    const doneHere = doneHereId ? byId.get(doneHereId) : undefined;
    previews[dateKey] = doneHere
      ? { kind: "planned_done", weekdayLabel: label, day: doneHere, doneOn: null }
      : { kind: "day_off", weekdayLabel: label };
  }

  return { today, previews };
}
