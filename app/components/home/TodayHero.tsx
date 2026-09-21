import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Play } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/app/components/ui/Button";
import type { HeroLine, HeroView } from "@/app/lib/home-hero";
import { cn } from "@/app/lib/utils";

// Alto mínimo: si el contenido no entra (pantallas chicas), el hero crece en vez de pisar el chip.
const HEIGHT: Record<HeroView["height"], string> = {
  tall: "min-h-[clamp(380px,52svh,470px)]",
  medium: "min-h-[clamp(340px,48svh,400px)]",
  short: "min-h-[clamp(320px,44svh,360px)]",
};

/** Una palabra de 8 letras o más ("DESCANSO") no entra en Display XXL a 360px: baja un escalón. */
function titleSize(view: HeroView) {
  const words = view.title.map((part) => part.text).join("").split(/\s+/);
  return Math.max(...words.map((word) => word.length)) >= 8
    ? "text-[clamp(2.25rem,12vw,3.625rem)]"
    : "text-[clamp(2.75rem,14.5vw,3.625rem)]";
}

/**
 * Z3 · hero del home mobile (DESIGN.md §10.2). Solo dibuja la vista que arma `buildHeroView`:
 * `exercisesSheet` es el botón de lista del día y `chooseDaysAction` el CTA que abre el selector de días.
 */
export function TodayHero({
  view,
  exercisesSheet,
  chooseDaysAction,
}: {
  view: HeroView;
  exercisesSheet?: ReactNode;
  chooseDaysAction?: ReactNode;
}) {
  const hasActions = Boolean(view.primary || view.secondary || view.chooseDays || view.sheet);

  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-title"
      className={cn(
        "relative isolate flex flex-col justify-end overflow-hidden rounded-[28px] bg-[var(--card)] p-[22px] pt-16",
        HEIGHT[view.height],
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
          view.tone === "dim" ? "brightness-[0.45]" : "brightness-[0.8]",
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(5,7,11,0.97)_8%,rgba(5,7,11,0.55)_45%,rgba(5,7,11,0.05)_78%)]"
      />

      <p className="absolute left-[18px] top-[18px] inline-flex h-[30px] items-center gap-1.5 rounded-full bg-[rgba(5,7,11,0.72)] px-3 text-xs font-semibold uppercase tracking-[0.06em] text-white">
        {view.chip.mark === "live" ? (
          <>
            <span aria-hidden="true" className="size-[7px] rounded-full bg-[var(--accent-bright)]" />
            <span className="text-[var(--accent-bright)]">{view.chip.text}</span>
          </>
        ) : (
          view.chip.text
        )}
        {view.chip.mark === "check" ? (
          <Check aria-hidden="true" className="size-3.5 text-[var(--accent-bright)]" strokeWidth={3} />
        ) : null}
      </p>

      <h2
        id="home-hero-title"
        // El tamaño va antes que `leading-*`: tailwind-merge borra el leading si un font-size viene después.
        className={cn(
          titleSize(view),
          "font-display font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-white [overflow-wrap:anywhere]",
        )}
      >
        {view.title.map((part, index) =>
          part.accent ? (
            <em key={index} className="not-italic text-[var(--accent-bright)]">
              {part.text}
            </em>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </h2>

      {view.line ? <HeroLineView line={view.line} /> : null}

      {hasActions ? (
        <div className="mt-5 flex items-center gap-2.5">
          {view.primary ? (
            <Button asChild className="h-14 flex-1 rounded-2xl text-base font-bold">
              <Link href={view.primary.href}>
                {view.primary.icon === "play" ? <Play aria-hidden="true" className="size-4 fill-current" /> : null}
                {view.primary.label}
                {view.primary.icon === "chevron" ? <ChevronRight aria-hidden="true" className="size-4" /> : null}
              </Link>
            </Button>
          ) : null}
          {view.chooseDays ? chooseDaysAction : null}
          {view.secondary ? (
            <Link
              href={view.secondary.href}
              className="pressable flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 text-[15px] font-semibold text-white hover:bg-white/15"
            >
              {view.secondary.label}
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
          {view.sheet ? exercisesSheet : null}
        </div>
      ) : null}

      {view.link ? (
        <Link
          href={view.link.href}
          className="pressable mx-auto mt-1 inline-flex min-h-11 items-center px-3 text-sm font-semibold text-white/85 hover:text-white"
        >
          {view.link.label}
        </Link>
      ) : null}
    </section>
  );
}

function HeroLineView({ line }: { line: HeroLine }) {
  if (line.kind === "progress") {
    return (
      <div className="mt-4 grid gap-2">
        <p className="text-[15px] font-medium leading-snug text-white/80">
          <b className="font-semibold text-white">{line.done}</b> de {line.total} ejercicios
          {line.nextExerciseName ? <> · sigue {line.nextExerciseName}</> : null}
        </p>
        <div
          role="progressbar"
          aria-label="Progreso del entrenamiento de hoy"
          aria-valuemin={0}
          aria-valuemax={line.total}
          aria-valuenow={line.done}
          className="h-2 overflow-hidden rounded-full bg-white/15"
        >
          <div
            className="h-full rounded-full bg-[var(--accent-bright)]"
            style={{ width: `${line.total > 0 ? Math.round((line.done / line.total) * 100) : 0}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <p className="mt-3.5 text-[15px] font-medium leading-snug text-white/80">
      {line.kind === "stats" ? (
        <>
          <b className="font-semibold text-white">~{line.minutes}</b> min ·{" "}
          <b className="font-semibold text-white">{line.exercises}</b> ejercicios ·{" "}
          <b className="font-semibold text-white">{line.series}</b> series
        </>
      ) : (
        line.parts.map((part, index) =>
          part.strong ? (
            <b key={index} className="font-semibold text-white">
              {part.text}
            </b>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )
      )}
    </p>
  );
}
