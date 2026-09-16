"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import { Button } from "@/app/components/ui/Button";
import { DrawerClose } from "@/app/components/ui/Drawer";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";

/** S5 · Borrar cuenta (mobile). Desktop sigue con el dialog de ConfiguracionClient. */
export function DeleteAccountSheet({
  open,
  onOpenChange,
  confirmText,
  isDeleting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmText: string;
  isDeleting: boolean;
  onConfirm: () => void;
}) {
  const [value, setValue] = useState("");

  function handleOpenChange(next: boolean) {
    if (!next) setValue("");
    onOpenChange(next);
  }

  return (
    <ProfileSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Borrar tu cuenta"
      description="Esta acción es irreversible."
      closeLabel={null}
      leading={
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[rgba(244,63,94,0.12)] text-[var(--danger)]"
        >
          <TriangleAlert className="size-5" />
        </span>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <p className="text-[15px] leading-relaxed text-[var(--foreground-muted)]">
          Se eliminan tu cuenta, tus rutinas, tus entrenos y tus comidas. No se puede deshacer.
        </p>

        <div className="grid gap-1.5">
          <label htmlFor="delete-account-confirm" className="text-[13px] font-medium text-[var(--foreground-muted)]">
            Escribí <strong className="font-semibold text-[var(--foreground)]">{confirmText}</strong> para confirmar
          </label>
          <Input
            id="delete-account-confirm"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={confirmText}
            autoComplete="off"
            autoCapitalize="characters"
            className="h-12"
          />
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            className="h-14 rounded-2xl bg-[#be123c] text-base font-bold text-white hover:bg-[#9f1239]"
            disabled={value !== confirmText || isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? <LoadingDots /> : <TriangleAlert aria-hidden="true" className="size-4" />}
            Borrar mi cuenta
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="h-12 rounded-2xl">
              Cancelar
            </Button>
          </DrawerClose>
        </div>
      </div>
    </ProfileSheet>
  );
}
