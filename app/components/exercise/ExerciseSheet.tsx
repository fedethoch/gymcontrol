"use client";

import { useState } from "react";

import { ExerciseHistoryPanel, type ExerciseHistoryData } from "@/app/components/exercise/ExerciseHistoryPanel";
import { ExerciseMedia } from "@/app/components/exercise/ExerciseMedia";
import { ExercisePlanRow } from "@/app/components/exercise/ExercisePlanRow";
import type { ExerciseDetail } from "@/app/components/shared/ExerciseDetailModal";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/app/components/ui/Drawer";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { equipmentLabel, muscleLabel } from "@/app/lib/exercise-form";

export type ExerciseSheetTab = "technique" | "history";

/**
 * Sheet del ejercicio en mobile (DESIGN.md §11.4): bottom sheet de alto fijo con la ficha y,
 * si hay historial, pestañas Técnica · Historial (T-D1).
 */
export function ExerciseSheet({
  exercise,
  open,
  onOpenChange,
  history,
  initialTab = "technique",
}: {
  exercise: ExerciseDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history?: ExerciseHistoryData | null;
  initialTab?: ExerciseSheetTab;
}) {
  return (
    <Drawer open={open && exercise !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92dvh] max-h-[92dvh]">
        {exercise ? (
          <SheetBody
            key={`${exercise.id}-${initialTab}`}
            exercise={exercise}
            history={history?.entries.length ? history : null}
            initialTab={initialTab}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function SheetBody({
  exercise,
  history,
  initialTab,
}: {
  exercise: ExerciseDetail;
  history: ExerciseHistoryData | null;
  initialTab: ExerciseSheetTab;
}) {
  const [tab, setTab] = useState<ExerciseSheetTab>(history ? initialTab : "technique");
  const meta = [muscleLabel(exercise.muscleGroup ?? null), equipmentLabel(exercise.equipment ?? null)]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <DrawerHeader className="grid gap-3 px-4 pb-3 pt-2 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
        <div className="grid gap-0.5">
          <DrawerTitle className="text-left font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.03em]">
            {exercise.name}
          </DrawerTitle>
          <DrawerDescription className="text-[14px] text-[var(--foreground-muted)]">
            {meta || "Detalle del ejercicio"}
          </DrawerDescription>
        </div>
        {history ? (
          <SegmentedControl
            label="Sección del ejercicio"
            options={[
              { value: "technique", label: "Técnica" },
              { value: "history", label: "Historial" },
            ]}
            value={tab}
            onChange={setTab}
            className="h-12 border border-[var(--border)]"
          />
        ) : null}
      </DrawerHeader>

      <div
        role="region"
        aria-label={tab === "history" ? "Historial" : "Técnica"}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-1"
      >
        {tab === "history" && history ? (
          <ExerciseHistoryPanel history={history} />
        ) : (
          <div className="grid gap-5">
            <ExerciseMedia imageUrl={exercise.imageUrl} gifUrl={exercise.gifUrl} />
            <ExercisePlanRow
              series={exercise.series}
              repsTarget={exercise.repsTarget}
              rir={exercise.rir}
              rest={exercise.rest}
              minReps={exercise.minReps}
              maxReps={exercise.maxReps}
            />
            {exercise.description ? (
              <section className="grid gap-1.5">
                <h3 className="font-display text-[1.0625rem] font-semibold text-[var(--foreground)]">Cómo se hace</h3>
                <p className="text-[15px] leading-relaxed text-[var(--foreground-muted)]">{exercise.description}</p>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
