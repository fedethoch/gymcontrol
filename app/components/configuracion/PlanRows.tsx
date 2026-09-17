import Image from "next/image";
import { ChevronRight, PenLine, PersonStanding, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { ActivityMeter } from "@/app/components/configuracion/ActivityMeter";
import { bodyFatImageSrc } from "@/app/components/configuracion/BodyFatCarousel";
import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { MACRO_PRESET_COPY, RECOMMENDED_PRESET, variantInfo } from "@/app/lib/nutrition-plan-options";
import type { NutritionProfileInput, TargetMode } from "@/app/lib/nutrition-types";
import { ACTIVITY_COPY, activityLevelIndex, bodySummary, formatAdjustment, GOAL_COPY } from "@/app/lib/profile-plan";
import { cn } from "@/app/lib/utils";

export type PlanSheet = "body" | "activity" | "goal";

type Row = { key: PlanSheet; title: string; detail: string; lead: ReactNode; dimmed: boolean };

/** Z3 · los datos que causan el objetivo; cada fila abre su sheet (DESIGN.md §15.1). */
export function PlanRows({
  input,
  targetMode,
  onOpen,
}: {
  input: NutritionProfileInput;
  targetMode: TargetMode;
  onOpen: (sheet: PlanSheet) => void;
}) {
  const manual = targetMode === "manual";
  const activity = ACTIVITY_COPY[input.activityLevel];
  const plan = calculateNutritionPlan(input);
  const preset = input.macroPreset ?? RECOMMENDED_PRESET;

  const body: Row = {
    key: "body",
    title: "Tu cuerpo",
    detail: bodySummary(input),
    dimmed: manual,
    lead:
      input.bodyFatPct === null ? (
        <PersonStanding className="size-5 text-[var(--foreground-muted)]" />
      ) : (
        <Image
          src={bodyFatImageSrc(input.gender, input.bodyFatPct)}
          alt=""
          width={44}
          height={50}
          sizes="44px"
          className="h-12 w-auto object-contain"
        />
      ),
  };
  const activityRow: Row = {
    key: "activity",
    title: "Actividad",
    detail: `${activity.label} · ${activity.hint}`,
    dimmed: manual,
    lead: <ActivityMeter level={activityLevelIndex(input.activityLevel)} />,
  };
  const goalRow: Row = {
    key: "goal",
    title: "Objetivo",
    detail: manual
      ? "Los fijo yo"
      : `${GOAL_COPY[input.goal].label} · ${variantInfo(input.goal, input.goalVariant).label} · Dieta ${MACRO_PRESET_COPY[preset].label.toLowerCase()}`,
    dimmed: false,
    lead: manual ? (
      <PenLine className="size-4 text-[var(--foreground)]" />
    ) : (
      <span className="font-mono text-[13px] font-medium text-[var(--foreground)]">
        {formatAdjustment(plan.adjustment)}
      </span>
    ),
  };
  // Con objetivo fijo, lo único que lo cambia es la fila Objetivo: va primero.
  const rows = manual ? [goalRow, body, activityRow] : [body, activityRow, goalRow];

  return (
    <section aria-labelledby="plan-rows-title" className="flex flex-col gap-3">
      <HomeSectionHeader id="plan-rows-title" title="Cómo lo calculamos" />
      <ul className="border-t border-[var(--border)]">
        {rows.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              onClick={() => onOpen(row.key)}
              className="flex min-h-[72px] w-full items-center gap-3 border-b border-[var(--border)] py-2.5 text-left outline-none transition-colors active:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-[52px] w-11 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--card)]",
                  row.dimmed && "opacity-[0.55]",
                )}
              >
                {row.lead}
              </span>
              <span className={cn("grid min-w-0 flex-1 gap-0.5", row.dimmed && "opacity-[0.55]")}>
                <span className="text-[15px] font-medium text-[var(--foreground)]">{row.title}</span>
                <span className="text-pretty text-[13px] leading-snug text-[var(--foreground-muted)]">
                  {row.dimmed ? "No cambia tu objetivo fijo" : row.detail}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--foreground-subtle)]" />
            </button>
          </li>
        ))}
      </ul>
      {!manual && plan.clampedToBmr ? <BmrFloorNote /> : null}
      <p className="text-xs text-[var(--foreground-muted)]">
        Estimación nutricional. No reemplaza el consejo de un profesional.
      </p>
    </section>
  );
}

/** El déficit elegido dejaba el objetivo por debajo del metabolismo basal. */
export function BmrFloorNote() {
  return (
    <p className="flex items-start gap-2 text-[13px] leading-snug text-[var(--warning)]">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>Tu objetivo quedó en tu metabolismo basal: comer menos no es seguro sin seguimiento profesional.</span>
    </p>
  );
}
