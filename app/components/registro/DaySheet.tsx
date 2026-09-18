"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, Plus, X } from "lucide-react";

import { RegistroSheet } from "@/app/components/registro/RegistroSheet";
import { CHOICE_CHIP_CLASS, ICON_BUTTON_CLASS, STRONG_BUTTON_CLASS } from "@/app/components/registro/styles";
import { Input } from "@/app/components/ui/Input";
import { formatMealFoods, type DiaryTab } from "@/app/lib/meal-diary";
import type { MealGroup } from "@/app/lib/meal-logs";
import { MEAL_TYPE_LABELS, MEAL_TYPES, type MealType } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]";

/** "Tu día": todas las comidas a la vista y "Otra comida" (snack o con nombre propio). */
export function DaySheet({
  open,
  onOpenChange,
  tabs,
  consumedKcal,
  targetKcal,
  onSelect,
  onOtherMeal,
  initialStep = "list",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: DiaryTab<MealGroup>[];
  consumedKcal: number;
  targetKcal: number | null;
  onSelect: (key: string) => void;
  onOtherMeal: (meal: { name: string; type: MealType }) => void;
  /** "other" abre directo en "Otra comida" (desde el día cerrado). */
  initialStep?: "list" | "other";
}) {
  const [step, setStep] = useState<"list" | "other">(initialStep);
  const [name, setName] = useState(MEAL_TYPE_LABELS.snack);
  const [type, setType] = useState<MealType>("snack");
  const trimmed = name.trim();

  function pickType(next: MealType) {
    // Si el nombre era el del tipo anterior, lo sigue.
    if (name.trim() === MEAL_TYPE_LABELS[type]) setName(MEAL_TYPE_LABELS[next]);
    setType(next);
  }

  const close = (
    <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar" className={ICON_BUTTON_CLASS}>
      <X aria-hidden="true" className="size-5" />
    </button>
  );

  if (step === "other") {
    return (
      <RegistroSheet
        open={open}
        onOpenChange={onOpenChange}
          title="Otra comida"
        eyebrow="Tu día"
        description="Poné el nombre y el tipo de la comida nueva y elegí sus alimentos."
        headerAction={
          <div className="-mr-2 flex shrink-0 items-center">
            <button type="button" onClick={() => setStep("list")} aria-label="Volver a tu día" className={ICON_BUTTON_CLASS}>
              <ArrowLeft aria-hidden="true" className="size-5" />
            </button>
            {close}
          </div>
        }
        footer={
          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onOtherMeal({ name: trimmed, type })}
            className={STRONG_BUTTON_CLASS}
          >
            Elegir alimentos
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        }
      >
        <div className="grid content-start gap-5 pb-3">
          <label className="grid gap-2">
            <span className={SECTION_LABEL}>Nombre</span>
            <Input
              maxLength={60}
              enterKeyHint="done"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                // "Listo" cierra el teclado.
                if (event.key === "Enter" && !event.nativeEvent.isComposing) event.currentTarget.blur();
              }}
              placeholder="Ej. Post entreno"
            />
          </label>
          <div className="grid gap-2">
            <p id="registro-other-type" className={SECTION_LABEL}>
              Tipo
            </p>
            <div role="radiogroup" aria-labelledby="registro-other-type" className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={type === option}
                  onClick={() => pickType(option)}
                  className={cn(
                    CHOICE_CHIP_CLASS,
                    type === option
                      ? "border-[var(--foreground)] bg-[var(--card-hover)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  {MEAL_TYPE_LABELS[option]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </RegistroSheet>
    );
  }

  return (
    <RegistroSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Tu día"
      description="Todas las comidas del día. Tocá una para ir a ella."
      headerAction={
        <div className="-mr-2 flex shrink-0 items-center gap-1">
          <span className="font-mono text-[13px] tabular-nums text-[var(--foreground-muted)]">
            {consumedKcal}
            {targetKcal ? ` / ${targetKcal}` : ""} kcal
          </span>
          {close}
        </div>
      }
    >
      <div className="grid content-start gap-2 pb-3">
        <ul className="border-y border-[var(--border)]">
          {tabs.map((tab) => (
            <li key={tab.key} className="border-b border-[var(--border)] last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(tab.key)}
                className="pressable flex min-h-[60px] w-full items-center gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate font-display text-[15px] font-semibold text-[var(--foreground)]">{tab.label}</span>
                  <span className="truncate text-[13px] text-[var(--foreground-muted)]">
                    {tab.meal && tab.meal.items.length > 0 ? formatMealFoods(tab.meal, 5) : "Sin registrar"}
                  </span>
                </span>
                {tab.kcal !== null ? (
                  <span className="shrink-0 font-mono text-[15px] tabular-nums text-[var(--foreground)]">
                    {tab.kcal}
                    <span className="ml-1 font-sans text-[12px] text-[var(--foreground-muted)]">kcal</span>
                  </span>
                ) : (
                  <span className="shrink-0 text-[var(--foreground-muted)]">
                    <span aria-hidden="true">—</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setStep("other")}
          className="pressable flex min-h-12 items-center justify-between gap-3 rounded-xl text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--accent-bright)]">
            <Plus aria-hidden="true" className="size-[18px]" />
            Otra comida
          </span>
          <span className="text-[13px] text-[var(--foreground-muted)]">snack o con nombre propio</span>
        </button>
      </div>
    </RegistroSheet>
  );
}
