"use client";

import { ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import { Input } from "@/app/components/ui/Input";

const NAME_MAX_LENGTH = 40;

/** S6 · Nombre. Guarda al cerrar o con Enter. */
export function NameSheet({
  open,
  onOpenChange,
  value,
  onChange,
  onCommit,
  disabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  disabled: boolean;
}) {
  function handleOpenChange(next: boolean) {
    if (!next) onCommit();
    onOpenChange(next);
  }

  return (
    <ProfileSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Tu nombre"
      description="El nombre con el que te saludamos en Inicio."
    >
      <div className="flex flex-col gap-3 pt-2">
        <label htmlFor="profile-name" className="text-[13px] font-medium text-[var(--foreground-muted)]">
          Cómo te saludamos en Inicio
        </label>
        <div className="relative">
          <Input
            id="profile-name"
            value={value}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Ej. Fede"
            autoComplete="given-name"
            enterKeyHint="done"
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleOpenChange(false);
              }
            }}
            className="h-12 pr-16"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs tabular-nums text-[var(--foreground-muted)]"
          >
            {value.length}/{NAME_MAX_LENGTH}
          </span>
        </div>
        <p className="text-[13px] text-[var(--foreground-muted)]">
          {disabled
            ? "Sin conexión: volvé a intentar cuando tengas red."
            : "Si lo dejás vacío, Inicio muestra “Bienvenido a GymControl”."}
        </p>
      </div>
    </ProfileSheet>
  );
}
