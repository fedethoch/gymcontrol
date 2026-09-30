"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";

import { TimeInput } from "@/app/components/configuracion/TimeInput";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { Switch } from "@/app/components/ui/Switch";
import { supplementKey, type SupplementsForm } from "@/app/configuracion/useSupplements";
import { SUPPLEMENT_NAME_MAX_LENGTH, type Supplement } from "@/app/lib/supplements";
import { cn } from "@/app/lib/utils";

/** Por qué no llegarían los avisos: sin avisos en este celu o con el maestro de S7 apagado. */
export type SupplementRemindersState = "on" | "device_off" | "master_off" | "unknown";

/**
 * Contenido de S8 (DESIGN.md §15.2, SU-D1): lista única con los comunes en orden fijo y los propios al final.
 * El círculo marca "lo tomo"; marcado, aparecen la hora y el switch del aviso.
 */
export function SupplementSettings({
  form,
  reminders,
  onOpenNotifications,
}: {
  form: SupplementsForm;
  reminders: SupplementRemindersState;
  onOpenNotifications: () => void;
}) {
  return (
    <div className="flex flex-col pt-1">
      <p className="text-[15px] leading-normal text-[var(--foreground-muted)]">
        Marcá los que tomás. Aparecen en Inicio para tildarlos cada día.
      </p>

      <ul aria-label="Suplementos" className="mt-4 border-t border-[var(--border)]">
        {form.items.map((item) => (
          <SupplementRow key={supplementKey(item)} item={item} form={form} />
        ))}
      </ul>

      <AddCustom form={form} />

      <p className="mt-2.5 text-[13px] leading-snug text-[var(--foreground-muted)]">
        Te avisamos a esa hora y cada 1 hora hasta que lo marques. El último aviso sale a las 23:00.
      </p>

      {reminders === "device_off" || reminders === "master_off" ? (
        <p className="mt-5 border-t border-[var(--border)] pt-3.5 text-sm leading-snug text-[var(--foreground-muted)]">
          {reminders === "device_off"
            ? "Los avisos están apagados en este celu. Igual podés tildarlos en Inicio. "
            : "Los avisos de suplementos están apagados. Igual podés tildarlos en Inicio. "}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="pressable -my-3 inline-flex min-h-11 items-center whitespace-nowrap rounded-lg font-semibold text-[var(--accent-bright)] outline-none hover:text-[var(--accent-strong)] focus-visible:shadow-[var(--focus-glow)]"
          >
            {reminders === "device_off" ? "Activar avisos ›" : "Prenderlos ›"}
          </button>
        </p>
      ) : null}
    </div>
  );
}

function SupplementRow({ item, form }: { item: Supplement; form: SupplementsForm }) {
  const key = supplementKey(item);
  const isCustom = !item.presetKey;

  return (
    <li className="flex min-h-14 items-center gap-2.5 border-b border-[var(--border)]">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.active}
        aria-label={`Lo tomo: ${item.name}`}
        onClick={() => form.toggleActive(key)}
        data-vaul-no-drag=""
        className="group -ml-2.5 grid size-11 shrink-0 place-items-center rounded-full outline-none focus-visible:shadow-[var(--focus-glow)]"
      >
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full border-2 transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-90 motion-reduce:transition-none motion-reduce:group-active:scale-100",
            item.active
              ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
              : "border-[var(--border-strong)] text-transparent",
          )}
        >
          <Check aria-hidden="true" strokeWidth={3} className="size-3.5" />
        </span>
      </button>

      <p
        className={cn(
          "min-w-0 flex-1 truncate text-[15px] font-medium",
          item.active ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
        )}
      >
        {item.name}
      </p>

      {item.active ? (
        <>
          <TimeInput
            label={`Hora del aviso: ${item.name.toLowerCase()}`}
            value={item.reminderTime}
            disabled={!item.reminderEnabled}
            onChange={(time) => form.setReminderTime(key, time)}
          />
          <Switch
            label={`Aviso de ${item.name.toLowerCase()}`}
            checked={item.reminderEnabled}
            onCheckedChange={(enabled) => form.setReminderEnabled(key, enabled)}
          />
        </>
      ) : isCustom ? (
        <button
          type="button"
          aria-label={`Borrar ${item.name}`}
          onClick={() => form.remove(key)}
          className="pressable -mr-2.5 grid size-11 shrink-0 place-items-center rounded-full text-[var(--foreground-subtle)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
        >
          <X aria-hidden="true" className="size-[18px]" />
        </button>
      ) : null}
    </li>
  );
}

function AddCustom({ form }: { form: SupplementsForm }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    const message = await form.addCustom(name);
    setBusy(false);

    if (message) {
      setError(message);
      inputRef.current?.focus();
      return;
    }

    setName("");
    setError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex min-h-14 w-full items-center gap-2.5 border-b border-[var(--border)] text-left text-[15px] font-semibold text-[var(--accent-bright)] outline-none transition-colors hover:text-[var(--accent-strong)] focus-visible:shadow-[var(--focus-glow)]"
      >
        <span className="-ml-2.5 grid size-11 shrink-0 place-items-center">
          <Plus aria-hidden="true" className="size-[18px]" />
        </span>
        Agregar otro
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 border-b border-[var(--border)] py-3">
      <label htmlFor={inputId} className="sr-only">
        Nombre del suplemento
      </label>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={inputId}
          value={name}
          maxLength={SUPPLEMENT_NAME_MAX_LENGTH}
          placeholder="Ej. Melatonina"
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          data-vaul-no-drag=""
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !name) {
              event.stopPropagation();
              setOpen(false);
            }
          }}
          className="h-12 min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="pressable inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] px-4 text-[15px] font-bold text-[var(--background)] outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-40"
        >
          {busy ? <LoadingDots /> : "Agregar"}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : (
        <p className="text-[13px] text-[var(--foreground-muted)]">
          Hasta {SUPPLEMENT_NAME_MAX_LENGTH} letras. Entra marcado, con aviso a las 09:00.
        </p>
      )}
    </form>
  );
}
