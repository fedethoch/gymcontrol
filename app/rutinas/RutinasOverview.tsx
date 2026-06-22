"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { CalendarDays, Clock3, Flame, Play } from "lucide-react";
import { motion } from "framer-motion";

type RutinasOverviewProps = {
  displayName: string;
  imageUrl: string | null;
  objectiveLabel: string;
  difficultyLabel: string;
  totalDays: number;
  completedDayCount: number;
  weeklyProgressPercent: number;
  currentStreak: number;
  hasRealData: boolean;
  nextPendingDayOrder: number | null;
  nextPendingDayName: string | null;
  startHref: string | null;
  remaining: number;
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { ease: "easeOut" as const, duration: 0.38, delay },
});

export function RutinasOverview({
  displayName,
  imageUrl,
  objectiveLabel,
  difficultyLabel,
  totalDays,
  completedDayCount,
  weeklyProgressPercent,
  currentStreak,
  hasRealData,
  nextPendingDayOrder,
  nextPendingDayName,
  startHref,
  remaining,
}: RutinasOverviewProps) {
  const weekComplete = totalDays > 0 && completedDayCount >= totalDays;

  const contextText = weekComplete
    ? "¡Semana completa! 💪"
    : completedDayCount === 0
      ? `Todavía no completaste entrenamientos esta semana.${nextPendingDayOrder != null ? ` Empezá con Día ${nextPendingDayOrder}.` : ""}`
      : `Vas ${completedDayCount} de ${totalDays}. Te faltan ${remaining} sesión${remaining === 1 ? "" : "es"}.`;

  const ctaLabel = completedDayCount === 0 ? "Comenzar entrenamiento" : "Continuar";

  const nextLabel =
    nextPendingDayOrder != null
      ? `Día ${nextPendingDayOrder}${nextPendingDayName ? ` · ${nextPendingDayName}` : ""}`
      : null;

  const proximoValue =
    nextPendingDayOrder != null ? `Día ${nextPendingDayOrder}` : weekComplete ? "Completa" : "—";

  const rachaSubtext =
    !hasRealData ? "Completá tu primer entreno para iniciarla." : undefined;

  return (
    <>
      {/* Row 1: Rutina activa */}
      <motion.div
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-2xl bg-[#15102a] p-3.5"
      >
        {imageUrl ? (
          <Image
            alt={displayName}
            className="object-cover opacity-55 saturate-[0.85]"
            fill
            sizes="100vw"
            src={imageUrl}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,7,17,0.88),rgba(8,7,17,0.48)),radial-gradient(circle_at_80%_50%,rgba(124,58,237,0.28),transparent_65%)]" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b985ff]">
            Rutina activa
          </p>
          <h2 className="font-display mt-0.5 text-lg font-semibold leading-tight text-white sm:text-xl">
            {displayName}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[objectiveLabel, difficultyLabel, `${totalDays} días/sem`].map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-md border border-[rgba(139,92,246,0.35)] bg-[rgba(20,15,36,0.6)] px-2 py-0.5 text-[10px] font-semibold text-[#d4c6ff]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Row 2: Resumen semanal + CTA */}
      <motion.div
        {...fadeUp(0.1)}
        className="flex flex-col gap-3 rounded-2xl bg-[#0e131e] px-4 py-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c25cff]">
            Resumen semanal
          </p>
          <p className="text-[10px] text-[#7887a6]">Semana actual</p>
        </div>

        <p className="text-sm text-[#c8d0df]">
          <span className="font-bold text-white">{completedDayCount}</span>
          <span className="text-[#7887a6]"> de </span>
          <span className="font-bold text-white">{totalDays}</span>
          <span className="text-[#7887a6]"> entrenamientos completados</span>
        </p>

        <div className="flex flex-col gap-1">
          <div className="h-2 overflow-hidden rounded-full bg-[#151c2d]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#6a36f0] to-[#9a63ff]"
              initial={{ width: 0 }}
              animate={{ width: `${weeklyProgressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.45 }}
            />
          </div>
          <p className="text-[10px] text-[#7887a6]">{weeklyProgressPercent}% completado</p>
        </div>

        <p className="text-xs leading-5 text-[#9db5ff]">{contextText}</p>

        {!weekComplete && nextLabel ? (
          <p className="text-[11px] text-[#7887a6]">
            Próximo:{" "}
            <span className="font-medium text-[#d4c6ff]">{nextLabel}</span>
          </p>
        ) : null}

        {startHref ? (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              href={startHref}
              className="flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#6a36f0,#8e4dff)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(109,64,239,0.38)] transition-shadow hover:shadow-[0_8px_28px_rgba(109,64,239,0.52)]"
            >
              <Play className="size-4 fill-white" />
              {ctaLabel}
            </Link>
          </motion.div>
        ) : null}
      </motion.div>

      {/* Row 3: Métricas */}
      <motion.div {...fadeUp(0.2)} className="grid grid-cols-3 gap-2">
        <MiniCard
          icon={Flame}
          label="Racha"
          value={`${currentStreak} días`}
          subtext={rachaSubtext}
          accent="warm"
        />
        <MiniCard icon={Clock3} label="Duración" value="~60 min" subtext="por sesión" />
        <MiniCard icon={CalendarDays} label="Próximo" value={proximoValue} />
      </motion.div>
    </>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  accent?: "default" | "warm";
}) {
  const iconClass = accent === "warm" ? "text-[#ff9a75]" : "text-[#9db5ff]";

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#0e131e] px-2 py-3 text-center"
      whileTap={{ scale: 0.98 }}
    >
      <Icon className={`size-4 shrink-0 ${iconClass}`} />
      <div>
        <p className="font-display whitespace-nowrap text-sm font-semibold leading-tight text-white">
          {value}
        </p>
        <p className="mt-0.5 text-[10px] text-[#7887a6]">{label}</p>
        {subtext ? (
          <p className="mt-0.5 text-[9px] leading-tight text-[#5a6880]">{subtext}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
