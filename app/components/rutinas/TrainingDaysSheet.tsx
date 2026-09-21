"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { useFormStatus } from "react-dom";

import { TrainingDaysPicker } from "@/app/components/rutinas/TrainingDaysPicker";
import { Button } from "@/app/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/Dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/app/components/ui/Drawer";
import { useMediaQuery } from "@/app/components/ui/use-media-query";

export type TrainingDaysChoice = {
  dayCount: number;
  /** Nombre corto de cada día de la rutina, en orden. */
  dayTitles: string[];
  /** Días guardados si siguen valiendo; si no, la precarga (`suggestWeekdays`). */
  initialWeekdays: number[];
};

/**
 * Cómo se confirma: enviando un form de la página (server action que redirige; el sheet tiene que estar
 * dentro de ese `<form>` en el árbol de React) o con un callback que devuelve si salió bien.
 */
export type TrainingDaysSubmit =
  | { formId: string; name?: string; value?: string }
  | { onConfirm: (weekdays: number[]) => Promise<boolean> };

const CONFIRM_CLASS = "h-14 w-full rounded-2xl text-base font-bold";

type SheetProps = {
  choice: TrainingDaysChoice;
  confirmLabel: string;
  pendingLabel?: string;
  submit: TrainingDaysSubmit;
};

/** Botón que abre el selector; al cerrarlo el foco vuelve al botón. */
export function TrainingDaysButton({
  children,
  className,
  ...sheet
}: SheetProps & { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      <TrainingDaysSheet {...sheet} open={open} onOpenChange={setOpen} returnFocusRef={triggerRef} />
    </>
  );
}

/** Selector de días de entreno: bottom sheet en mobile, dialog en desktop (DESIGN.md §12.3). */
export function TrainingDaysSheet({
  open,
  onOpenChange,
  choice,
  confirmLabel,
  pendingLabel = "Guardando…",
  submit,
  returnFocusRef,
}: SheetProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const title = "¿Qué días vas al gym?";
  const description = `Tu rutina tiene ${choice.dayCount} ${choice.dayCount === 1 ? "día" : "días"}: elegí cuándo vas.`;
  // vaul no devuelve el foco a un disparador propio: lo hacemos a mano.
  const onCloseAutoFocus = (event: Event) => {
    if (!returnFocusRef?.current) return;
    event.preventDefault();
    returnFocusRef.current.focus();
  };

  if (isDesktop === null) return null;

  // El contenido se monta al abrir: cada apertura arranca de `initialWeekdays`.
  const form = (
    <DaysForm
      choice={choice}
      confirmLabel={confirmLabel}
      pendingLabel={pendingLabel}
      submit={submit}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          open={open}
          onCloseAutoFocus={onCloseAutoFocus}
          className="w-[min(28rem,calc(100vw-2rem))] overflow-y-auto"
        >
          <DialogHeader className="px-6 pb-2 pt-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">{form}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]" onCloseAutoFocus={onCloseAutoFocus}>
        <DrawerHeader className="px-5 pb-2 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{form}</div>
      </DrawerContent>
    </Drawer>
  );
}

function DaysForm({
  choice,
  confirmLabel,
  pendingLabel,
  submit,
  onDone,
}: {
  choice: TrainingDaysChoice;
  confirmLabel: string;
  pendingLabel: string;
  submit: TrainingDaysSubmit;
  onDone: () => void;
}) {
  const [weekdays, setWeekdays] = useState<number[]>(choice.initialWeekdays);
  const [saving, setSaving] = useState(false);
  const ready = weekdays.length === choice.dayCount;

  async function confirm() {
    if (!("onConfirm" in submit)) return;
    setSaving(true);
    const ok = await submit.onConfirm(weekdays);
    setSaving(false);
    if (ok) onDone();
  }

  return (
    <div className="grid gap-5 pt-2">
      <TrainingDaysPicker
        dayCount={choice.dayCount}
        dayTitles={choice.dayTitles}
        value={weekdays}
        onChange={setWeekdays}
      />
      <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
        Si faltás un día, lo hacés cuando puedas: tocalo en la semana del inicio.
      </p>
      {"formId" in submit ? (
        <>
          {weekdays.map((iso) => (
            <input key={iso} type="hidden" form={submit.formId} name="trainingWeekdays" value={iso} />
          ))}
          <FormConfirm
            formId={submit.formId}
            name={submit.name}
            value={submit.value}
            disabled={!ready}
            label={confirmLabel}
            pendingLabel={pendingLabel}
          />
        </>
      ) : (
        <Button type="button" disabled={!ready || saving} onClick={confirm} className={CONFIRM_CLASS}>
          {saving ? pendingLabel : confirmLabel}
        </Button>
      )}
    </div>
  );
}

function FormConfirm({
  formId,
  name,
  value,
  disabled,
  label,
  pendingLabel,
}: {
  formId: string;
  name?: string;
  value?: string;
  disabled: boolean;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      form={formId}
      name={name}
      value={value}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={CONFIRM_CLASS}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
