"use client";

import { Sparkles } from "lucide-react";

import { Slider } from "@/app/components/ui/Slider";
import type { ProfileForm } from "@/app/configuracion/useProfileForm";
import { formatDecimal } from "@/app/lib/number-input";
import {
  macroBounds,
  presetMacroGrams,
  recommendedBands,
  referenceWeightKg,
  suggestsKeto,
  type MacroKey,
} from "@/app/lib/nutrition-plan-options";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";

const MACROS: { key: MacroKey; label: string }[] = [
  { key: "protein", label: "Proteína" },
  { key: "carbs", label: "Carbos" },
  { key: "fat", label: "Grasas" },
];
const KCAL_PER_G: Record<MacroKey, number> = { protein: 4, carbs: 4, fat: 9 };

/**
 * S4a · dieta Personalizada: 3 sliders enlazados que siempre suman las kcal objetivo
 * (DESIGN.md §15.2). La lógica vive en `adjustCustomMacros`.
 */
export function MacroSliders({ form, disabled }: { form: ProfileForm; disabled: boolean }) {
  const input = form.profileInput;
  const kcal = form.calculatedPlan.targetKcal;
  const weight = referenceWeightKg(input);
  const bounds = macroBounds(kcal, weight);
  const bands = recommendedBands(kcal, weight);
  const grams = presetMacroGrams(kcal, input);

  return (
    <div className="grid gap-4">
      <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
        Siempre suman tus <span className="font-mono text-[var(--foreground)]">{kcal}</span> kcal: al mover uno, se
        acomodan los otros. La franja de abajo es lo recomendado.
      </p>

      <div className="grid gap-3 border-t border-[var(--border)] pt-3">
        {MACROS.map(({ key, label }) => {
          const value = Math.round(grams[key]);
          const pct = Math.round(((grams[key] * KCAL_PER_G[key]) / kcal) * 100);
          const perKg = key === "protein" ? ` · ${formatDecimal(grams.protein / weight, 1)} g/kg` : "";

          return (
            <div key={key} className="grid gap-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: MACRO_COLORS[key] }} />
                  {label}
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-xs tabular-nums text-[var(--foreground-muted)]">
                    {pct}%{perKg}
                  </span>
                  <span className="font-display text-[1.375rem] font-bold leading-none tracking-[-0.02em] tabular-nums text-[var(--foreground)]">
                    {value}
                    <span className="ml-0.5 font-sans text-sm font-medium tracking-normal text-[var(--foreground-muted)]">g</span>
                  </span>
                </span>
              </div>
              <Slider
                label={label}
                valueText={`${value} gramos, ${pct}% de las calorías`}
                value={value}
                min={Math.ceil(bounds[key][0])}
                max={Math.floor(bounds[key][1])}
                step={1}
                band={bands[key]}
                color={MACRO_COLORS[key]}
                disabled={disabled}
                onChange={(next) => form.setCustomMacro(key, next)}
              />
            </div>
          );
        })}
      </div>

      {suggestsKeto(grams, bounds) ? (
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] px-3 py-2.5">
          <p className="flex items-start gap-2 text-[13px] leading-snug text-[var(--foreground-muted)]">
            <Sparkles aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            Los carbos llegaron al mínimo. ¿Querés Keto?
          </p>
          <button
            type="button"
            onClick={() => form.setMacroPreset("keto")}
            disabled={disabled}
            className="pressable min-h-11 shrink-0 rounded-full px-3 text-[13px] font-semibold text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-50"
          >
            Probar Keto
          </button>
        </div>
      ) : null}
    </div>
  );
}
