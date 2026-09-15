"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { saveOwnFoodAction } from "@/app/alimentos/actions";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import type { FoodFormField } from "@/app/lib/foods-form";
import {
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  getAmountUnitLabel,
  type Food,
  type FoodCategory,
  type FoodMeasure,
} from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

type FoodFormProps = {
  /** Si viene, edita ese alimento propio; si no, crea uno nuevo. */
  food?: Food | null;
  initialName?: string;
  submitLabel?: string;
  /** "inline" convive con otro CTA primario (ej. dentro de Nueva comida): botón secundario. */
  variant?: "inline" | "sheet";
  onSaved: (food: Food) => void;
  onCancel: () => void;
};

const chipClass =
  "min-h-11 rounded-xl border px-2 text-sm font-medium transition-colors active:scale-[0.98] focus-visible:shadow-[var(--focus-glow)] outline-none";

/** Acepta coma decimal (teclado es-AR). */
function toNumberText(value: string) {
  return value.replace(",", ".").trim();
}

export function FoodForm({ food, initialName = "", submitLabel, variant = "sheet", onSaved, onCancel }: FoodFormProps) {
  const [name, setName] = useState(food?.name ?? initialName);
  const [category, setCategory] = useState<FoodCategory>(food?.category ?? "mixed");
  const [servingG, setServingG] = useState(String(food?.servingG ?? 100));
  const [calories, setCalories] = useState(food ? String(food.calories) : "");
  const [proteinG, setProteinG] = useState(food ? String(food.proteinG) : "");
  const [carbsG, setCarbsG] = useState(food ? String(food.carbsG) : "");
  const [fatG, setFatG] = useState(food ? String(food.fatG) : "");
  const [gramsPerUnit, setGramsPerUnit] = useState(food?.gramsPerUnit != null ? String(food.gramsPerUnit) : "");
  const [measure, setMeasure] = useState<FoodMeasure>(food?.measure ?? "g");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FoodFormField, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const unitLabel = getAmountUnitLabel(category);
  const hasUnitWeight = Number(toNumberText(gramsPerUnit)) > 0;
  const macrosKcal =
    4 * (Number(toNumberText(proteinG)) || 0) + 4 * (Number(toNumberText(carbsG)) || 0) + 9 * (Number(toNumberText(fatG)) || 0);
  const caloriesValue = Number(toNumberText(calories));
  const showKcalHint =
    macrosKcal > 0 && Number.isFinite(caloriesValue) && Math.abs(caloriesValue - macrosKcal) > Math.max(20, caloriesValue * 0.15);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const result = await saveOwnFoodAction({
      foodId: food?.id,
      name,
      category,
      measure: hasUnitWeight ? measure : "g",
      servingG: toNumberText(servingG),
      gramsPerUnit: hasUnitWeight ? toNumberText(gramsPerUnit) : "",
      calories: toNumberText(calories),
      proteinG: toNumberText(proteinG),
      carbsG: toNumberText(carbsG),
      fatG: toNumberText(fatG),
    });

    setIsSaving(false);
    setFieldErrors(result.fieldErrors);

    if (result.status !== "success" || !result.food) {
      toast.error(result.message ?? "No se pudo guardar el alimento.");
      return;
    }

    toast.success(result.message ?? "Alimento guardado.");
    onSaved(result.food);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <Field label="Nombre" error={fieldErrors.name}>
        <Input
          autoFocus={!food}
          maxLength={80}
          placeholder="Ej. Tostadas de arroz marca X"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">Categoría</legend>
        <div className="grid grid-cols-3 gap-2">
          {FOOD_CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={cn(
                chipClass,
                category === value
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card-alt)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {FOOD_CATEGORY_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <Field label={`Valores nutricionales cada (${unitLabel})`} error={fieldErrors.servingG}>
          <Input inputMode="decimal" value={servingG} onChange={(event) => setServingG(event.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calorías (kcal)" error={fieldErrors.calories}>
            <Input inputMode="decimal" placeholder="0" value={calories} onChange={(event) => setCalories(event.target.value)} />
          </Field>
          <Field label="Proteínas (g)" error={fieldErrors.proteinG}>
            <Input inputMode="decimal" placeholder="0" value={proteinG} onChange={(event) => setProteinG(event.target.value)} />
          </Field>
          <Field label="Carbohidratos (g)" error={fieldErrors.carbsG}>
            <Input inputMode="decimal" placeholder="0" value={carbsG} onChange={(event) => setCarbsG(event.target.value)} />
          </Field>
          <Field label="Grasas (g)" error={fieldErrors.fatG}>
            <Input inputMode="decimal" placeholder="0" value={fatG} onChange={(event) => setFatG(event.target.value)} />
          </Field>
        </div>
        {showKcalHint ? (
          <p className="text-xs leading-5 text-[var(--warning)]">
            Con esos macros serían ≈{Math.round(macrosKcal)} kcal. Revisá que las calorías sean de la misma porción.
          </p>
        ) : null}
      </div>

      <Field
        label={`Peso de 1 unidad (${unitLabel}, opcional)`}
        hint="Completalo para cargarlo por unidades. Ej.: 1 galletita = 8 g."
        error={fieldErrors.gramsPerUnit}
      >
        <Input inputMode="decimal" placeholder="Ej. 8" value={gramsPerUnit} onChange={(event) => setGramsPerUnit(event.target.value)} />
      </Field>

      {hasUnitWeight ? (
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">Cargar por defecto en</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["g", "unit"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={measure === value}
                onClick={() => setMeasure(value)}
                className={cn(
                  chipClass,
                  measure === value
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--card-alt)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                )}
              >
                {value === "unit" ? "Unidades" : unitLabel === "ml" ? "Mililitros" : "Gramos"}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" className="h-11" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" variant={variant === "inline" ? "outline" : "default"} className="h-11" disabled={isSaving}>
          {isSaving ? <LoadingDots /> : null}
          {submitLabel ?? (food ? "Guardar cambios" : "Crear alimento")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">
      {label}
      {children}
      {error ? (
        <span className="text-xs text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-xs font-normal text-[var(--foreground-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
