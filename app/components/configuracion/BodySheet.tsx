"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, PersonStanding } from "lucide-react";

import { bodyFatImageSrc, BodyFatCarousel } from "@/app/components/configuracion/BodyFatCarousel";
import { OfflineNote, ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import { AnimatedNumber } from "@/app/components/ui/motion";
import { NumberStepper } from "@/app/components/ui/NumberStepper";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import type { ProfileForm } from "@/app/configuracion/useProfileForm";
import { BODY_FAT_REFERENCES, type Gender } from "@/app/lib/nutrition-types";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Hombre" },
  { value: "female", label: "Mujer" },
];

/** Límites de los steppers (los mismos que los inputs de desktop). */
export const BODY_LIMITS = {
  age: { min: 10, max: 100, step: 1 },
  heightCm: { min: 100, max: 250, step: 1 },
  weightKg: { min: 30, max: 250, step: 0.5 },
} as const;

/** El form guarda texto (lo comparte con los inputs de desktop); el stepper trabaja con números. */
export function toStepperValue(text: string): number | null {
  if (text.trim() === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function fromStepperValue(value: number | null): string {
  return value === null ? "" : String(value);
}

/** S1 · Tu cuerpo, con la vista interna de grasa corporal (S2) en el mismo drawer. */
export function BodySheet({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ProfileForm;
}) {
  const [view, setView] = useState<"body" | "fat">("body");
  const disabled = !form.online;
  const reference = BODY_FAT_REFERENCES[form.gender].find((item) => item.value === form.bodyFatPct) ?? null;

  function handleOpenChange(next: boolean) {
    if (!next) setView("body");
    onOpenChange(next);
  }

  return (
    <ProfileSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={view === "body" ? "Tu cuerpo" : "Grasa corporal"}
      description={
        view === "body"
          ? "Sexo, edad, altura, peso y grasa corporal. Los cambios se guardan solos."
          : "Elegí la referencia que más se parezca a tu cuerpo."
      }
      leading={
        view === "fat" ? (
          <button
            type="button"
            aria-label="Volver a Tu cuerpo"
            onClick={() => setView("body")}
            className="pressable -ml-2 grid size-11 shrink-0 place-items-center rounded-full text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
        ) : null
      }
    >
      {view === "body" ? (
        <div className="flex flex-col gap-4 pt-2">
          <SegmentedControl
            label="Sexo"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={form.handleGenderChange}
            disabled={disabled}
          />

          <div className="border-t border-[var(--border)]">
            <StepperRow title="Edad">
              <NumberStepper
                size="m"
                label="Edad en años"
                unit="años"
                {...BODY_LIMITS.age}
                maxDecimals={0}
                value={toStepperValue(form.age)}
                onChange={(value) => form.setAge(fromStepperValue(value))}
                disabled={disabled}
                className="w-[196px] shrink-0"
              />
            </StepperRow>
            <StepperRow title="Altura">
              <NumberStepper
                size="m"
                label="Altura en centímetros"
                unit="cm"
                {...BODY_LIMITS.heightCm}
                maxDecimals={0}
                value={toStepperValue(form.heightCm)}
                onChange={(value) => form.setHeightCm(fromStepperValue(value))}
                disabled={disabled}
                className="w-[196px] shrink-0"
              />
            </StepperRow>
            <StepperRow title="Peso" hint="De a 0,5 kg">
              <NumberStepper
                size="m"
                label="Peso en kilos"
                unit="kg"
                {...BODY_LIMITS.weightKg}
                maxDecimals={1}
                value={toStepperValue(form.weightKg)}
                onChange={(value) => form.setWeightKg(fromStepperValue(value))}
                disabled={disabled}
                className="w-[196px] shrink-0"
              />
            </StepperRow>
            <button
              type="button"
              onClick={() => setView("fat")}
              className="flex min-h-[72px] w-full items-center gap-3 border-b border-[var(--border)] py-2.5 text-left outline-none transition-colors active:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)]"
            >
              <span
                aria-hidden="true"
                className="grid h-[52px] w-11 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--card)]"
              >
                {form.bodyFatPct === null ? (
                  <PersonStanding className="size-5 text-[var(--foreground-muted)]" />
                ) : (
                  <Image
                    src={bodyFatImageSrc(form.gender, form.bodyFatPct)}
                    alt=""
                    width={44}
                    height={50}
                    sizes="44px"
                    className="h-12 w-auto object-contain"
                  />
                )}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="text-[15px] font-medium text-[var(--foreground)]">Grasa corporal</span>
                <span className="text-[13px] text-[var(--foreground-muted)]">
                  {reference ? `${reference.label} · ${reference.range}` : "No lo sé"}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--foreground-subtle)]" />
            </button>
          </div>

          <p className="text-[13px] text-[var(--foreground-muted)]">
            Tu objetivo:{" "}
            <AnimatedNumber value={form.plan.targetKcal} className="font-mono tabular-nums text-[var(--foreground)]" />{" "}
            kcal{form.manualTarget ? " (fijado a mano)" : ""}
          </p>
        </div>
      ) : (
        <div className="pt-2">
          <BodyFatCarousel
            gender={form.gender}
            value={form.bodyFatPct}
            onChange={form.setBodyFatPct}
            disabled={disabled}
          />
        </div>
      )}
      {disabled ? <OfflineNote /> : null}
    </ProfileSheet>
  );
}

function StepperRow({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[72px] items-center gap-3 border-b border-[var(--border)] py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[var(--foreground)]">{title}</p>
        {hint ? <p className="text-[13px] text-[var(--foreground-muted)]">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
