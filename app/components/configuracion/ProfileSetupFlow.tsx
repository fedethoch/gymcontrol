"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { ActivityOptions } from "@/app/components/configuracion/ActivitySheet";
import { BodyFatCarousel } from "@/app/components/configuracion/BodyFatCarousel";
import {
  BODY_LIMITS,
  fromStepperValue,
  GENDER_OPTIONS,
  toStepperValue,
} from "@/app/components/configuracion/BodySheet";
import { GoalOptions } from "@/app/components/configuracion/GoalSheet";
import { Button } from "@/app/components/ui/Button";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { fadeUp, motion } from "@/app/components/ui/motion";
import { NumberStepper } from "@/app/components/ui/NumberStepper";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import type { ProfileForm } from "@/app/configuracion/useProfileForm";
import { cn } from "@/app/lib/utils";

const STEPS = [
  { key: "about", section: "Tu cuerpo", title: "Sobre vos" },
  { key: "height", section: "Tu cuerpo", title: "¿Cuánto medís?" },
  { key: "weight", section: "Tu cuerpo", title: "¿Cuánto pesás?" },
  { key: "fat", section: "Tu cuerpo", title: "Tu grasa corporal" },
  { key: "activity", section: "Actividad", title: "¿Cuánto te movés?" },
  { key: "goal", section: "Objetivo", title: "¿Qué buscás?" },
] as const;

/** Flujo de alta sin perfil (DESIGN.md §15.3): una pregunta por pantalla; guarda solo al final. */
export function ProfileSetupFlow({
  form,
  onExit,
  onDone,
}: {
  form: ProfileForm;
  onExit: () => void;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  // Cada paso arranca arriba y con el foco en la pregunta (lectores de pantalla).
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "start" });
    titleRef.current?.focus({ preventScroll: true });
  }, [index]);

  const valid =
    step.key === "about"
      ? toStepperValue(form.age) !== null
      : step.key === "height"
        ? toStepperValue(form.heightCm) !== null
        : step.key === "weight"
          ? toStepperValue(form.weightKg) !== null
          : true;

  async function handleNext() {
    if (!isLast) {
      setIndex((current) => current + 1);
      return;
    }

    setSaving(true);
    const saved = await form.completeSetup();
    setSaving(false);
    if (saved) onDone();
  }

  let body: ReactNode;

  switch (step.key) {
    case "about":
      body = (
        <div className="flex flex-col gap-8">
          <SegmentedControl label="Sexo" options={GENDER_OPTIONS} value={form.gender} onChange={form.handleGenderChange} />
          <div className="grid gap-3">
            <p className="text-center text-[13px] font-medium text-[var(--foreground-muted)]">Edad</p>
            <NumberStepper
              label="Edad en años"
              unit="años"
              {...BODY_LIMITS.age}
              maxDecimals={0}
              value={toStepperValue(form.age)}
              onChange={(value) => form.setAge(fromStepperValue(value))}
            />
          </div>
        </div>
      );
      break;
    case "height":
      body = (
        <NumberStepper
          label="Altura en centímetros"
          unit="cm"
          {...BODY_LIMITS.heightCm}
          maxDecimals={0}
          value={toStepperValue(form.heightCm)}
          onChange={(value) => form.setHeightCm(fromStepperValue(value))}
        />
      );
      break;
    case "weight":
      body = (
        <NumberStepper
          label="Peso en kilos"
          unit="kg"
          {...BODY_LIMITS.weightKg}
          maxDecimals={1}
          value={toStepperValue(form.weightKg)}
          onChange={(value) => form.setWeightKg(fromStepperValue(value))}
        />
      );
      break;
    case "fat":
      body = <BodyFatCarousel gender={form.gender} value={form.bodyFatPct} onChange={form.setBodyFatPct} />;
      break;
    case "activity":
      body = <ActivityOptions value={form.activityLevel} onChange={form.setActivityLevel} />;
      break;
    case "goal":
      body = <GoalOptions input={form.profileInput} value={form.goal} onChange={form.setGoal} />;
      break;
  }

  const hint =
    step.key === "weight"
      ? "Lo usamos para la proteína y la grasa por kilo."
      : step.key === "fat"
        ? "Si no sabés, dejá “No lo sé”: lo estimamos con tus otros datos."
        : step.key === "goal"
          ? "Al lado de cada objetivo, las kcal diarias que te quedarían."
          : null;

  return (
    <div ref={rootRef} className="flex scroll-mt-4 flex-col gap-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Salir sin guardar"
          onClick={onExit}
          className="pressable grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          <X aria-hidden="true" className="size-[18px]" />
        </button>
        <div aria-hidden="true" className="grid flex-1 grid-cols-6 gap-1">
          {STEPS.map((item, position) => (
            <span
              key={item.key}
              className={cn(
                "h-1 rounded-full transition-colors duration-200",
                position <= index ? "bg-[var(--foreground)]" : "bg-[var(--border-strong)]",
              )}
            />
          ))}
        </div>
        <span className="font-mono text-[13px] tabular-nums text-[var(--foreground)]">
          <span className="sr-only">Paso </span>
          {index + 1}/{STEPS.length}
        </span>
      </div>

      <motion.div key={step.key} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-7">
        <div className="flex flex-col gap-4">
          <p className="text-[0.6875rem] font-semibold uppercase leading-normal tracking-[0.08em] text-[var(--foreground-muted)]">
            Paso {index + 1} · {step.section}
          </p>
          <h2
            ref={titleRef}
            tabIndex={-1}
            className="font-display text-[clamp(2.75rem,14.5vw,3.625rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.05em] text-[var(--foreground)] outline-none [overflow-wrap:anywhere]"
          >
            {step.title}
          </h2>
          {hint ? <p className="text-[15px] leading-relaxed text-[var(--foreground-muted)]">{hint}</p> : null}
        </div>

        {body}
      </motion.div>

      <div className="flex flex-col gap-2">
        {isLast && !form.online ? (
          <p role="status" className="text-[13px] text-[var(--warning)]">
            Sin conexión: vas a poder calcularlo cuando vuelva la red.
          </p>
        ) : null}
        <Button
          type="button"
          onClick={() => void handleNext()}
          disabled={!valid || saving || (isLast && !form.online)}
          className="h-14 rounded-2xl text-base font-bold"
        >
          {saving ? <LoadingDots /> : null}
          {isLast ? "Calcular mi plan" : "Siguiente"}
        </Button>
        {index > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIndex((current) => current - 1)}
            disabled={saving}
            className="h-11"
          >
            Atrás
          </Button>
        ) : null}
      </div>
    </div>
  );
}
