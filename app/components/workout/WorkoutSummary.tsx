"use client";

import Link from "next/link";

import { WeekStats } from "@/app/components/rutinas/DayPanel";

/** Estado `all_done`: el día cerrado es el protagonista y el dock pasa a "Terminar entrenamiento". */
export function WorkoutSummary({
  eyebrow,
  plannedSets,
  exerciseCount,
}: {
  eyebrow: string;
  plannedSets: number;
  exerciseCount: number;
}) {
  return (
    <div className="grid content-start gap-5 pt-[clamp(4rem,16svh,7rem)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">{eyebrow}</p>
      <h1 className="font-display text-[clamp(2.75rem,12vw,3.625rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-[var(--foreground)]">
        Entreno
        <br />
        completo
      </h1>
      <WeekStats
        stats={[
          { label: "Series", value: plannedSets },
          { label: "Ejercicios", value: exerciseCount },
        ]}
      />
    </div>
  );
}

/** Día sin ejercicios cargados: sin barra, pager ni dock. */
export function EmptyDay({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="grid content-start gap-5 pt-[clamp(5rem,20svh,8rem)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">{eyebrow}</p>
      <h1 className="font-display text-[clamp(2.75rem,12vw,3.625rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-[var(--foreground)]">
        Día
        <br />
        vacío
      </h1>
      <p className="text-[15px] text-[var(--foreground-muted)]">Este día todavía no tiene ejercicios cargados.</p>
      <Link
        href="/rutinas"
        className="pressable flex h-[52px] w-full items-center justify-center rounded-2xl bg-white/10 text-[15px] font-semibold text-white outline-none hover:bg-white/15 focus-visible:shadow-[var(--focus-glow)]"
      >
        Volver a la semana
      </Link>
    </div>
  );
}
