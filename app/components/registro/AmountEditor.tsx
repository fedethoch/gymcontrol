"use client";

import { NumberStepper } from "@/app/components/ui/NumberStepper";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import {
  MAX_QUANTITY,
  convertQuantity,
  formatQuantity,
  measureLabels,
  quantityStep,
  type NutritionPreview,
} from "@/app/lib/meal-amounts";
import type { FoodCategory, FoodMeasure } from "@/app/lib/nutrition-types";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import { cn } from "@/app/lib/utils";

export type AmountDraft = { measure: FoodMeasure; quantity: number | null };

/** Medida (si hay unidad), −/+ con el número grande y lo que aporta esa cantidad. */
export function AmountEditor({
  subject,
  gramsPerUnit,
  draft,
  onChange,
  preview,
  footnote,
}: {
  subject: { kind: "food" | "recipe"; category: FoodCategory | null };
  gramsPerUnit: number | null;
  draft: AmountDraft;
  onChange: (draft: AmountDraft) => void;
  preview: NutritionPreview | null;
  footnote?: string | null;
}) {
  const labels = measureLabels(subject);
  const isUnit = draft.measure === "unit";
  const single = draft.quantity === 1;
  const unitWord = isUnit
    ? subject.kind === "recipe"
      ? single
        ? "porción"
        : "porciones"
      : single
        ? "unidad"
        : "unidades"
    : labels.amountUnit === "ml"
      ? "mililitros"
      : "gramos";
  const step = quantityStep(draft.measure, labels.amountUnit);
  const stepUnit = isUnit ? (subject.kind === "recipe" ? "porción" : "unidad") : labels.amountUnit;
  const unitGrams = isUnit && gramsPerUnit && draft.quantity ? draft.quantity * gramsPerUnit : null;

  const cells = [
    { label: "kcal", value: preview?.kcal, color: "var(--foreground)" },
    { label: "prot", value: preview?.proteinG, color: MACRO_COLORS.protein },
    { label: "carb", value: preview?.carbsG, color: MACRO_COLORS.carbs },
    { label: "grasa", value: preview?.fatG, color: MACRO_COLORS.fat },
  ];

  return (
    <div className="grid gap-4">
      {gramsPerUnit != null ? (
        <SegmentedControl
          label="Medida"
          options={[
            { value: "g", label: labels.amountLabel },
            { value: "unit", label: labels.unitLabel },
          ]}
          value={draft.measure}
          onChange={(measure) =>
            onChange({
              measure,
              quantity: draft.quantity === null ? null : convertQuantity(draft.quantity, measure, gramsPerUnit),
            })
          }
        />
      ) : null}

      <NumberStepper
        value={draft.quantity}
        onChange={(quantity) => onChange({ ...draft, quantity })}
        step={step}
        min={isUnit ? 0.25 : 1}
        max={MAX_QUANTITY}
        unit={unitGrams ? `${unitWord} · ${formatQuantity(unitGrams, ",")} ${labels.amountUnit}` : unitWord}
        label={`Cantidad en ${unitWord}`}
        decrementLabel={`Restar ${formatQuantity(step, ",")} ${stepUnit}`}
        incrementLabel={`Sumar ${formatQuantity(step, ",")} ${stepUnit}`}
      />

      <dl aria-label="Aporte de esta cantidad" className="grid grid-cols-4 border-y border-[var(--border)]">
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={cn("grid gap-0.5 py-3 text-center", index > 0 && "border-l border-[var(--border)]")}
          >
            <dt className="order-2 text-[12px] text-[var(--foreground-muted)]">{cell.label}</dt>
            <dd
              className="order-1 font-display text-lg font-bold leading-none tabular-nums"
              style={{ color: cell.value === undefined ? "var(--foreground-muted)" : cell.color }}
            >
              {cell.value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>

      {footnote ? <p className="text-[13px] text-[var(--foreground-muted)]">{footnote}</p> : null}
    </div>
  );
}
