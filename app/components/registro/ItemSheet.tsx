"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { AmountEditor, type AmountDraft } from "@/app/components/registro/AmountEditor";
import { RegistroSheet } from "@/app/components/registro/RegistroSheet";
import { ICON_BUTTON_CLASS, NEUTRAL_BUTTON_CLASS, STRONG_BUTTON_CLASS } from "@/app/components/registro/styles";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { amountToGrams, previewItemNutrition, validateAmount } from "@/app/lib/meal-amounts";
import type { MealLogItem } from "@/app/lib/meal-logs";
import type { FoodMeasure } from "@/app/lib/nutrition-types";

/** Alimento ya registrado: cambiar la cantidad o quitarlo (con confirmación en línea). */
export function ItemSheet({
  open,
  onOpenChange,
  item,
  mealLabel,
  onlyItem,
  gramsPerUnit,
  onSave,
  onRemove,
  fallbackFocus,
}: {
  fallbackFocus?: () => HTMLElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MealLogItem;
  mealLabel: string;
  /** Es el único alimento: quitarlo borra la comida. */
  onlyItem: boolean;
  gramsPerUnit: number | null;
  onSave: (measure: FoodMeasure, quantity: number) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<AmountDraft>({
    measure: item.measure,
    quantity: item.measure === "unit" ? item.quantity : item.grams,
  });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);

  // Si el alimento ya no tiene peso por unidad, se edita en gramos.
  const effectiveUnit = item.measure === "unit" ? (gramsPerUnit ?? (item.quantity > 0 ? item.grams / item.quantity : null)) : gramsPerUnit;
  const amount = draft.quantity === null ? null : { measure: draft.measure, quantity: draft.quantity };
  const invalid = amount ? validateAmount(amount, effectiveUnit) : "Ingresá una cantidad.";
  const grams = amount && !invalid ? amountToGrams(amount, effectiveUnit) : null;
  const preview = grams !== null ? previewItemNutrition(item, grams) : null;
  const unchanged =
    amount !== null &&
    amount.measure === item.measure &&
    amount.quantity === (item.measure === "unit" ? item.quantity : item.grams);

  async function save() {
    if (!amount || invalid) return;
    setBusy("save");
    try {
      if (await onSave(amount.measure, amount.quantity)) onOpenChange(false);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("remove");
    try {
      if (await onRemove()) onOpenChange(false);
    } finally {
      setBusy(null);
    }
  }

  const footer = confirming ? (
    <div
      role="group"
      aria-label="Confirmar"
      className="grid gap-3 rounded-2xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.08)] p-3"
    >
      <p className="text-[15px] text-[var(--foreground)]">
        {onlyItem
          ? `Es lo único de ${mealLabel}: se borra la comida.`
          : `¿Quitar ${item.name} de ${mealLabel}?`}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setConfirming(false)} disabled={busy !== null} className={NEUTRAL_BUTTON_CLASS}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="pressable flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[var(--danger)] text-[15px] font-bold text-white outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-60"
        >
          {busy === "remove" ? <LoadingDots /> : <Trash2 aria-hidden="true" className="size-4" />}
          {onlyItem ? "Borrar comida" : "Quitar"}
        </button>
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => setConfirming(true)} disabled={busy !== null} className={NEUTRAL_BUTTON_CLASS}>
        <Trash2 aria-hidden="true" className="size-4" />
        Quitar
      </button>
      <button
        type="button"
        onClick={save}
        disabled={Boolean(invalid) || unchanged || busy !== null}
        className={STRONG_BUTTON_CLASS}
      >
        {busy === "save" ? <LoadingDots /> : null}
        Guardar
      </button>
    </div>
  );

  return (
    <RegistroSheet
      open={open}
      onOpenChange={onOpenChange}
      title={item.name}
      eyebrow={mealLabel}
      description="Cambiá la cantidad de este alimento o quitalo de la comida."
      fallbackFocus={fallbackFocus}
      headerAction={
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar" className={`${ICON_BUTTON_CLASS} -mr-2`}>
          <X aria-hidden="true" className="size-5" />
        </button>
      }
      footer={footer}
    >
      <div className="pb-3">
        <AmountEditor
          subject={{ kind: item.kind, category: item.category }}
          gramsPerUnit={effectiveUnit}
          draft={draft}
          onChange={(next) => {
            setConfirming(false);
            setDraft(next);
          }}
          preview={preview}
          footnote={invalid && draft.quantity !== null ? invalid : null}
        />
      </div>
    </RegistroSheet>
  );
}
