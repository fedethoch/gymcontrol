import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Play } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/app/components/ui/Button";
import type { HeroState, SessionProgress } from "@/app/lib/home-dashboard";
import { cn } from "@/app/lib/utils";

export type HeroDay = {
  order: number;
  total: number;
  name: string;
  /** Hasta 2 grupos musculares, ya ordenados por frecuencia. */
  groups: string[];
  minutes: number;
  exerciseCount: number;
  seriesCount: number;
};

const HEIGHT_BY_STATE: Record<HeroState, string> = {
  ready: "h-[clamp(380px,52svh,470px)]",
  in_progress: "h-[clamp(380px,52svh,470px)]",
  done_today: "h-[clamp(320px,44svh,360px)]",
  week_done: "h-[clamp(320px,44svh,360px)]",
  no_routine: "h-[clamp(340px,48svh,400px)]",
};

/** Z3 · hero "Hoy toca" del home mobile (DESIGN.md §10.2). */
export function TodayHero({
  state,
  weekdayLabel,
  day,
  progress,
  startHref,
  exercisesSheet,
}: {
  state: HeroState;
  weekdayLabel: string;
  day: HeroDay | null;
  progress: SessionProgress | null;
  startHref: string;
  exercisesSheet?: ReactNode;
}) {
  const dimmed = state === "done_today" || state === "week_done";
  const dayTitle = day ? formatDayTitle(day) : null;

  return (
    <section
      aria-labelledby="home-hero-title"
      className={cn(
        "relative isolate flex flex-col justify-end overflow-hidden rounded-[28px] bg-[var(--card)] p-[22px]",
        HEIGHT_BY_STATE[state],
      )}
    >
      <Image
        alt=""
        fill
        priority
        sizes="100vw"
        src="/images/hero.png"
        className={cn(
          "-z-20 object-cover grayscale contrast-[1.08]",
          dimmed ? "brightness-[0.45]" : "brightness-[0.8]",
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(5,7,11,0.97)_8%,rgba(5,7,11,0.55)_45%,rgba(5,7,11,0.05)_78%)]"
      />

      <p className="absolute left-[18px] top-[18px] inline-flex h-[30px] items-center gap-1.5 rounded-full bg-[rgba(5,7,11,0.72)] px-3 text-xs font-semibold uppercase tracking-[0.06em] text-white">
        {state === "in_progress" ? (
          <>
            <span aria-hidden="true" className="size-[7px] rounded-full bg-[var(--accent-bright)]" />
            <span className="text-[var(--accent-bright)]">En curso</span>
          </>
        ) : state === "done_today" ? (
          <>
            {weekdayLabel} · hecho
            <Check aria-hidden="true" className="size-3.5 text-[var(--accent-bright)]" strokeWidth={3} />
          </>
        ) : state === "week_done" ? (
          "Semana completa"
        ) : state === "no_routine" ? (
          "Sin rutina activa"
        ) : day ? (
          `${weekdayLabel} · Día ${day.order} de ${day.total}`
        ) : (
          weekdayLabel
        )}
      </p>

      <h2
        id="home-hero-title"
        className="font-display text-[clamp(2.75rem,14.5vw,3.625rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-white [overflow-wrap:anywhere]"
      >
        {state === "done_today" ? (
          <>
            Entreno <em className="not-italic text-[var(--accent-bright)]">hecho</em>
          </>
        ) : state === "week_done" ? (
          <>
            Semana <em className="not-italic text-[var(--accent-bright)]">cerrada</em>
          </>
        ) : state === "no_routine" ? (
          <>
            Elegí tu <em className="not-italic text-[var(--accent-bright)]">rutina</em>
          </>
        ) : day && day.groups.length === 2 ? (
          <>
            {day.groups[0]} <em className="not-italic text-[var(--accent-bright)]">&amp;</em> {day.groups[1]}
          </>
        ) : (
          dayTitle
        )}
      </h2>

      {state === "in_progress" && progress ? (
        <div className="mt-4 grid gap-2">
          <p className="text-[15px] font-medium leading-snug text-white/80">
            <b className="font-semibold text-white">{progress.done}</b> de {progress.total} ejercicios
            {progress.nextExerciseName ? <> · sigue {progress.nextExerciseName}</> : null}
          </p>
          <div
            role="progressbar"
            aria-label="Progreso del entrenamiento de hoy"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
            className="h-2 overflow-hidden rounded-full bg-white/15"
          >
            <div
              className="h-full rounded-full bg-[var(--accent-bright)]"
              style={{ width: `${progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3.5 text-[15px] font-medium leading-snug text-white/80">
          {state === "done_today" && day ? (
            <>
              Próximo: <b className="font-semibold text-white">Día {day.order} · {dayTitle}</b>
            </>
          ) : state === "week_done" ? (
            "El lunes arranca una nueva semana"
          ) : state === "no_routine" ? (
            "Elegí una del catálogo o armá la tuya"
          ) : day ? (
            <>
              <b className="font-semibold text-white">~{day.minutes}</b> min ·{" "}
              <b className="font-semibold text-white">{day.exerciseCount}</b> ejercicios ·{" "}
              <b className="font-semibold text-white">{day.seriesCount}</b> series
            </>
          ) : null}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2.5">
        {state === "ready" || state === "in_progress" ? (
          <>
            <Button asChild className="h-14 flex-1 rounded-2xl text-base font-bold">
              <Link href={startHref}>
                <Play aria-hidden="true" className="size-4 fill-current text-[var(--accent-foreground)]" />
                <span className="text-[var(--accent-foreground)]">
                  {state === "in_progress" ? "Continuar" : "Empezar"}
                </span>
              </Link>
            </Button>
            {exercisesSheet}
          </>
        ) : state === "no_routine" ? (
          <Button asChild className="h-14 flex-1 rounded-2xl text-base font-bold">
            <Link href="/catalogo">
              <span className="text-[var(--accent-foreground)]">Explorar rutinas</span>
              <ChevronRight aria-hidden="true" className="size-4 text-[var(--accent-foreground)]" />
            </Link>
          </Button>
        ) : (
          <Link
            href="/rutinas"
            className="pressable flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 text-[15px] font-semibold text-white hover:bg-white/15"
          >
            Ver rutina
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

function formatDayTitle(day: HeroDay) {
  if (day.groups.length === 2) return `${day.groups[0]} & ${day.groups[1]}`;
  return day.groups[0] ?? day.name;
}
