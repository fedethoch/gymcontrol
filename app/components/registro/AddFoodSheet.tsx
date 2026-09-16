"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Check, Plus, Search, X } from "lucide-react";

import { AmountEditor, type AmountDraft } from "@/app/components/registro/AmountEditor";
import { RegistroSheet } from "@/app/components/registro/RegistroSheet";
import { ICON_BUTTON_CLASS, NEUTRAL_BUTTON_CLASS } from "@/app/components/registro/styles";
import type { AddResult } from "@/app/components/registro/useDiaryActions";
import { FoodForm } from "@/app/components/shared/FoodForm";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { searchByName } from "@/app/lib/food-search";
import {
  describeOption,
  formatAmount,
  formatQuantity,
  getOptionGramsPerUnit,
  optionCategory,
  optionKey,
  previewNutrition,
  resolveDefaultAmount,
  validateAmount,
  type Amount,
  type PickerOption,
} from "@/app/lib/meal-amounts";
import type { UndoRecord } from "@/app/lib/meal-diary";
import { getAmountUnitLabel, type Food, type FrequentItem } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

type Step = "search" | "quantity" | "create";
type Segment = "frecuentes" | "recetas" | "propios";

const SEARCH_LIMIT = 20;
const ADDED_FEEDBACK_MS = 1600;

type Session = { count: number; kcal: number; last: { record: UndoRecord; name: string; kcal: number } | null };

/**
 * Sheet "Agregar a {comida}" (DESIGN.md §14): buscar o elegir de una lista, "+" agrega al toque con la
 * última cantidad y tocar el nombre abre el paso de cantidad. Deshacer vive en el pie del sheet.
 */
export function AddFoodSheet({
  open,
  onOpenChange,
  targetLabel,
  isToday,
  options,
  frequentOptions,
  frequentByKey,
  lastAmounts,
  remainingKcal,
  initialItem,
  onAdd,
  onUndo,
  onFoodCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetLabel: string;
  isToday: boolean;
  options: PickerOption[];
  frequentOptions: PickerOption[];
  frequentByKey: ReadonlyMap<string, FrequentItem>;
  lastAmounts: ReadonlyMap<string, Amount>;
  /** Kcal que quedan en el día (null sin objetivo). */
  remainingKcal: number | null;
  /** Abre directo en la cantidad (enlace desde /alimentos). */
  initialItem?: { option: PickerOption; amount: Amount } | null;
  onAdd: (option: PickerOption, amount: Amount) => Promise<AddResult | null>;
  onUndo: (record: UndoRecord) => Promise<boolean>;
  onFoodCreated: (food: Food) => void;
}) {
  const inputId = useId();
  const [step, setStep] = useState<Step>(initialItem ? "quantity" : "search");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [segment, setSegment] = useState<Segment>(frequentOptions.length > 0 ? "frecuentes" : "recetas");
  const [selected, setSelected] = useState<PickerOption | null>(initialItem?.option ?? null);
  const [draft, setDraft] = useState<AmountDraft>(initialItem?.amount ?? { measure: "g", quantity: null });
  const [session, setSession] = useState<Session>({ count: 0, kcal: 0, last: null });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [addedKeys, setAddedKeys] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function amountFor(option: PickerOption): Amount {
    const key = optionKey(option);
    return lastAmounts.get(key) ?? resolveDefaultAmount(option, frequentByKey.get(key));
  }

  function choose(option: PickerOption) {
    setSelected(option);
    setDraft(amountFor(option));
    setStep("quantity");
  }

  function markAdded(key: string) {
    setAddedKeys((current) => new Set(current).add(key));
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setAddedKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }, ADDED_FEEDBACK_MS);
    timers.current.add(timer);
  }

  async function add(option: PickerOption, amount: Amount) {
    const key = optionKey(option);
    setBusyKey(key);

    try {
      const result = await onAdd(option, amount);
      if (!result) return false;

      setSession((current) => ({
        count: current.count + 1,
        kcal: current.kcal + result.kcal,
        last: { record: result, name: option.name, kcal: result.kcal },
      }));
      markAdded(key);
      return true;
    } finally {
      setBusyKey(null);
    }
  }

  async function undoLast() {
    const last = session.last;
    if (!last) return;
    setBusyKey("undo");

    try {
      if (await onUndo(last.record)) {
        setSession((current) => ({ count: current.count - 1, kcal: current.kcal - last.kcal, last: null }));
      }
    } finally {
      setBusyKey(null);
    }
  }

  const trimmed = deferredQuery.trim();
  const results = trimmed
    ? searchByName(options, trimmed, {
        limit: SEARCH_LIMIT,
        boost: (option) =>
          (frequentByKey.has(optionKey(option)) ? 15 : 0) +
          (option.kind === "food" && option.food.ownerUserId ? 10 : 0) +
          // A igual coincidencia, el alimento simple antes que el plato preparado.
          (option.kind === "food" && option.food.category !== "mixed" ? 1 : 0),
      })
    : [];
  const list = trimmed
    ? results
    : segment === "frecuentes"
      ? frequentOptions
      : segment === "recetas"
        ? options.filter((option) => option.kind === "recipe")
        : options.filter((option) => option.kind === "food" && option.food.ownerUserId);

  const selectedSubject = selected ? { kind: selected.kind, category: optionCategory(selected) } : null;
  const gramsPerUnit = selected ? getOptionGramsPerUnit(selected) : null;
  const amount: Amount | null = draft.quantity === null ? null : { measure: draft.measure, quantity: draft.quantity };
  const invalid = amount ? validateAmount(amount, gramsPerUnit) : "Ingresá una cantidad.";
  const preview = selected && amount && !invalid ? previewNutrition(selected, amount.measure, amount.quantity) : null;
  const dayWord = isToday ? "hoy" : "ese día";
  // `remainingKcal` ya descuenta lo agregado (el día se actualiza con cada agregado).
  const leftAfter = remainingKcal !== null && preview ? remainingKcal - preview.kcal : null;
  const footnote =
    leftAfter === null
      ? null
      : leftAfter >= 0
        ? `Te quedarían ${leftAfter} kcal ${dayWord}.`
        : `Te pasarías ${-leftAfter} kcal ${dayWord}.`;

  const title = step === "search" ? targetLabel : step === "create" ? "Nuevo alimento" : (selected?.name ?? "");
  const eyebrow = step === "search" ? "Agregar a" : targetLabel;

  const headerAction = (
    <div className="-mr-2 flex shrink-0 items-center">
      {step !== "search" && !initialItem ? (
        <button type="button" onClick={() => setStep("search")} aria-label="Volver a la búsqueda" className={ICON_BUTTON_CLASS}>
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
      ) : null}
      <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar" className={ICON_BUTTON_CLASS}>
        <X aria-hidden="true" className="size-5" />
      </button>
    </div>
  );

  const footer =
    step === "quantity" && selected && selectedSubject ? (
      <Button
        type="button"
        className="h-14 w-full rounded-2xl text-base font-bold"
        disabled={Boolean(invalid) || busyKey !== null}
        onClick={async () => {
          if (!amount) return;
          const ok = await add(selected, amount);
          if (ok) {
            if (initialItem) onOpenChange(false);
            else setStep("search");
          }
        }}
      >
        {busyKey === optionKey(selected) ? <LoadingDots /> : <Plus aria-hidden="true" className="size-[18px]" />}
        {amount ? `Agregar ${formatAmount(amount, selectedSubject, ",")}` : "Agregar"}
      </Button>
    ) : step === "search" ? (
      <>
        <div aria-live="polite" className="flex min-h-11 items-center justify-between gap-3">
          <p className="min-w-0 text-sm text-[var(--foreground-muted)]">
            {session.count === 0 ? (
              "Tocá + para sumar con tu última cantidad."
            ) : (
              <>
                {session.count} {session.count === 1 ? "agregado" : "agregados"} ·{" "}
                <span className="font-mono tabular-nums text-[var(--foreground)]">{session.kcal} kcal</span>
              </>
            )}
          </p>
          {session.last ? (
            <button
              type="button"
              onClick={undoLast}
              disabled={busyKey !== null}
              aria-label={`Deshacer: quitar ${session.last.name}`}
              className="pressable -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-semibold text-[var(--accent-bright)] outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-50"
            >
              {busyKey === "undo" ? <LoadingDots /> : "Deshacer"}
            </button>
          ) : null}
        </div>
        <button type="button" onClick={() => onOpenChange(false)} className={NEUTRAL_BUTTON_CLASS}>
          Listo
        </button>
      </>
    ) : null;

  return (
    <RegistroSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      eyebrow={eyebrow}
      description="Buscá un alimento o una receta y agregalo a la comida."
      headerAction={headerAction}
      footer={footer}
      className="h-[min(85dvh,46rem)]"
    >
      {step === "search" ? (
        <div className="grid content-start gap-3 pb-3">
          <div className="sticky top-0 z-10 grid gap-3 bg-[#080b10] pb-1">
            <div className="relative">
              <label htmlFor={inputId} className="sr-only">
                Buscar alimento o receta
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[var(--foreground-muted)]"
              />
              <Input
                id={inputId}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Buscá alimento o receta"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 rounded-2xl pl-11 pr-11 [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              ) : null}
            </div>
            {trimmed ? null : (
              <SegmentedControl
                label="Lista"
                options={[
                  { value: "frecuentes", label: "Frecuentes" },
                  { value: "recetas", label: "Recetas" },
                  { value: "propios", label: "Mis alimentos" },
                ]}
                value={segment}
                onChange={setSegment}
              />
            )}
          </div>

          {list.length > 0 ? (
            <ul aria-label={trimmed ? "Resultados" : "Lista"} className="border-t border-[var(--border)]">
              {list.map((option) => {
                const key = optionKey(option);
                const optionAmount = amountFor(option);
                const subject = { kind: option.kind, category: optionCategory(option) };
                const amountLabel = formatAmount(optionAmount, subject, ",");
                const kcal = previewNutrition(option, optionAmount.measure, optionAmount.quantity).kcal;
                const added = addedKeys.has(key);

                return (
                  <li key={key} className="flex min-h-[60px] items-center gap-2 border-b border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => choose(option)}
                      className="pressable grid min-h-[60px] min-w-0 flex-1 content-center gap-0.5 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
                    >
                      <span className="truncate text-[15px] font-medium text-[var(--foreground)]">{option.name}</span>
                      <span className="truncate text-[13px] text-[var(--foreground-muted)]">
                        {describeOption(option, frequentByKey.has(key))}
                        {" · "}
                        <span className="font-mono tabular-nums">
                          {amountLabel} · {kcal} kcal
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void add(option, optionAmount)}
                      disabled={busyKey !== null}
                      aria-label={`Agregar ${amountLabel} de ${option.name}`}
                      className={cn(
                        "pressable grid size-11 shrink-0 place-items-center rounded-full text-[var(--accent-bright)] outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-60",
                        added ? "bg-[rgba(16,185,129,0.16)]" : "bg-[var(--card-alt)] hover:bg-[var(--card-hover)]",
                      )}
                    >
                      {busyKey === key ? (
                        <LoadingDots />
                      ) : added ? (
                        <Check aria-hidden="true" className="motion-pop-in size-[18px]" strokeWidth={2.5} />
                      ) : (
                        <Plus aria-hidden="true" className="size-[18px]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-2 text-sm text-[var(--foreground-muted)]">
              {trimmed
                ? `No encontramos “${trimmed}”.`
                : segment === "frecuentes"
                  ? "Todavía no tenés frecuentes: buscá un alimento para empezar."
                  : segment === "recetas"
                    ? "Todavía no hay recetas para elegir."
                    : "Los alimentos que crees van a aparecer acá."}
            </p>
          )}

          {trimmed || segment === "propios" ? (
            <button
              type="button"
              onClick={() => setStep("create")}
              className="pressable flex min-h-12 items-center gap-2 rounded-xl text-left text-[15px] font-semibold text-[var(--accent-bright)] outline-none focus-visible:shadow-[var(--focus-glow)]"
            >
              <Plus aria-hidden="true" className="size-[18px]" />
              {trimmed ? `Crear “${trimmed}”` : "Crear alimento"}
            </button>
          ) : null}
        </div>
      ) : null}

      {step === "quantity" && selected && selectedSubject ? (
        <div className="grid content-start gap-4 pb-3">
          <p className="text-sm text-[var(--foreground-muted)]">
            {selected.kind === "recipe"
              ? `Receta · 1 porción = ${formatQuantity(selected.recipe.servingG, ",")} g`
              : gramsPerUnit
                ? `1 unidad ≈ ${formatQuantity(gramsPerUnit, ",")} ${getAmountUnitLabel(selected.food.category)}`
                : describeOption(selected, frequentByKey.has(optionKey(selected)))}
          </p>
          <AmountEditor
            subject={selectedSubject}
            gramsPerUnit={gramsPerUnit}
            draft={draft}
            onChange={setDraft}
            preview={preview}
            footnote={invalid && draft.quantity !== null ? invalid : footnote}
          />
        </div>
      ) : null}

      {step === "create" ? (
        <div className="pb-4">
          <FoodForm
            initialName={trimmed}
            variant="inline"
            submitLabel="Crear y elegir"
            onCancel={() => setStep("search")}
            onSaved={(food) => {
              onFoodCreated(food);
              choose({ kind: "food", id: food.id, name: food.name, food });
            }}
          />
        </div>
      ) : null}
    </RegistroSheet>
  );
}
