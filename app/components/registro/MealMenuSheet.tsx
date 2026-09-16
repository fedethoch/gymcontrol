"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2, X } from "lucide-react";

import { RegistroSheet } from "@/app/components/registro/RegistroSheet";
import {
  CHOICE_CHIP_CLASS,
  ICON_BUTTON_CLASS,
  NEUTRAL_BUTTON_CLASS,
  STRONG_BUTTON_CLASS,
} from "@/app/components/registro/styles";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import type { MealGroup } from "@/app/lib/meal-logs";
import { MEAL_TYPE_LABELS, MEAL_TYPES, type MealType } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]";

/** Menú "…" de una comida: nombre, tipo, orden y eliminar (todo en línea). */
export function MealMenuSheet({
  open,
  onOpenChange,
  meal,
  isFirst,
  isLast,
  onRename,
  onChangeType,
  onMove,
  onDelete,
  fallbackFocus,
}: {
  fallbackFocus?: () => HTMLElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealGroup;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => Promise<boolean>;
  onChangeType: (type: MealType) => Promise<boolean>;
  onMove: (direction: "up" | "down") => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(meal.name);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function withBusy(key: string, task: () => Promise<boolean>) {
    setBusy(key);
    try {
      return await task();
    } finally {
      setBusy(null);
    }
  }

  function startRename() {
    setName(meal.name);
    setRenaming(true);
  }

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === meal.name) {
      setRenaming(false);
      return;
    }
    if (await withBusy("name", () => onRename(trimmed))) setRenaming(false);
  }

  async function remove() {
    if (await withBusy("delete", onDelete)) onOpenChange(false);
  }

  return (
    <RegistroSheet
      open={open}
      onOpenChange={onOpenChange}
      title={meal.name}
      description="Cambiá el nombre, el tipo o el orden de la comida, o eliminala."
      fallbackFocus={fallbackFocus}
      headerAction={
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar" className={`${ICON_BUTTON_CLASS} -mr-2`}>
          <X aria-hidden="true" className="size-5" />
        </button>
      }
      // Esc mientras se renombra cancela el nombre sin cerrar el sheet.
      onEscapeKeyDown={(event) => {
        if (renaming) {
          event.preventDefault();
          setRenaming(false);
        }
      }}
    >
      <div className="grid content-start gap-6 pb-3">
        <section aria-label="Nombre" className="grid gap-2">
          <p className={SECTION_LABEL}>Nombre</p>
          {renaming ? (
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void saveName();
              }}
            >
              <Input
                aria-label="Nombre de la comida"
                autoFocus
                maxLength={60}
                enterKeyHint="done"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRenaming(false)} className={NEUTRAL_BUTTON_CLASS}>
                  Cancelar
                </button>
                <button type="submit" disabled={!name.trim() || busy !== null} className={STRONG_BUTTON_CLASS}>
                  {busy === "name" ? <LoadingDots /> : null}
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={startRename}
              className="pressable flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
            >
              <span className="truncate text-[15px] font-medium text-[var(--foreground)]">{meal.name}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--accent-bright)]">
                <Pencil aria-hidden="true" className="size-4" />
                Cambiar
              </span>
            </button>
          )}
        </section>

        <section aria-labelledby="registro-menu-type" className="grid gap-2">
          <p id="registro-menu-type" className={SECTION_LABEL}>
            Tipo
          </p>
          <div role="radiogroup" aria-labelledby="registro-menu-type" className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => {
              const active = meal.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={busy !== null}
                  onClick={() => {
                    if (!active) void withBusy(`type:${type}`, () => onChangeType(type));
                  }}
                  className={cn(
                    CHOICE_CHIP_CLASS,
                    active
                      ? "border-[var(--foreground)] bg-[var(--card-hover)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  {busy === `type:${type}` ? <LoadingDots /> : MEAL_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Orden en el día" className="grid gap-2">
          <p className={SECTION_LABEL}>Orden en el día</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isFirst || busy !== null}
              onClick={() => void withBusy("up", () => onMove("up"))}
              className={NEUTRAL_BUTTON_CLASS}
            >
              {busy === "up" ? <LoadingDots /> : <ArrowUp aria-hidden="true" className="size-4" />}
              Antes
            </button>
            <button
              type="button"
              disabled={isLast || busy !== null}
              onClick={() => void withBusy("down", () => onMove("down"))}
              className={NEUTRAL_BUTTON_CLASS}
            >
              {busy === "down" ? <LoadingDots /> : <ArrowDown aria-hidden="true" className="size-4" />}
              Después
            </button>
          </div>
        </section>

        {confirming ? (
          <div
            role="group"
            aria-label="Confirmar eliminación"
            className="grid gap-3 rounded-2xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.08)] p-3"
          >
            <p className="text-[15px] text-[var(--foreground)]">¿Eliminar “{meal.name}” y sus alimentos?</p>
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
                {busy === "delete" ? <LoadingDots /> : <Trash2 aria-hidden="true" className="size-4" />}
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="pressable flex min-h-12 items-center gap-2 rounded-xl text-left text-[15px] font-semibold text-[#fb7185] outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            <Trash2 aria-hidden="true" className="size-[18px]" />
            Eliminar comida
          </button>
        )}
      </div>
    </RegistroSheet>
  );
}
