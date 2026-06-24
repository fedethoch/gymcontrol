"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Beef, Check, Droplet, Flame, LogOut, TriangleAlert, Wheat } from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/Accordion";
import { AnimatedProgressRing } from "@/app/components/ui/ProgressRing";
import { BodyFatFigure } from "@/app/components/shared/BodyFatFigure";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/Dialog";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { deleteAccountAction, saveNutritionProfileAction, saveProfileNameAction } from "@/app/configuracion/actions";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { MACRO_COLORS, MACRO_LABELS } from "@/app/lib/nutrition-style";
import {
  ACTIVITY_LEVEL_INFO,
  ACTIVITY_LEVELS,
  BODY_FAT_REFERENCES,
  GENDERS,
  GOAL_INFO,
  GOALS,
  type ActivityLevel,
  type Gender,
  type Goal,
  type NutritionProfileInput,
} from "@/app/lib/nutrition-types";
import { MOCK_PROFILE_DEFAULTS } from "@/app/lib/nutrition-mock";
import type { NutritionProfile } from "@/app/lib/nutrition-profile";
import { cn } from "@/app/lib/utils";
import {
  AnimatedNumber,
  fadeScale,
  motion,
  premiumEase,
  tapFeedback,
} from "@/app/components/ui/motion";

const DELETE_CONFIRM_TEXT = "BORRAR";
type ProfileSaveStatus = "idle" | "saving" | "saved" | "error";

const GOAL_ADJ_LABELS: Record<Goal, string> = {
  bulk: "Superávit moderado aplicado",
  cut: "Déficit calórico aplicado",
  recomposition: "Sin ajuste calórico",
};

export function ConfiguracionClient({
  initialProfile,
  initialDisplayName,
}: {
  initialProfile: NutritionProfile | null;
  initialDisplayName: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const savedNameRef = useRef(initialDisplayName ?? "");

  const [gender, setGender] = useState<Gender>(initialProfile?.gender ?? MOCK_PROFILE_DEFAULTS.gender);
  const [age, setAge] = useState(String(initialProfile?.age ?? MOCK_PROFILE_DEFAULTS.age));
  const [heightCm, setHeightCm] = useState(String(initialProfile?.heightCm ?? MOCK_PROFILE_DEFAULTS.heightCm));
  const [weightKg, setWeightKg] = useState(String(initialProfile?.weightKg ?? MOCK_PROFILE_DEFAULTS.weightKg));
  const [bodyFatPct, setBodyFatPct] = useState<number | null>(initialProfile?.bodyFatPct ?? null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel ?? MOCK_PROFILE_DEFAULTS.activityLevel,
  );
  const [goal, setGoal] = useState<Goal>(initialProfile?.goal ?? MOCK_PROFILE_DEFAULTS.goal);
  const [profileSaveStatus, setProfileSaveStatus] = useState<ProfileSaveStatus>("idle");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const profileInput = useMemo<NutritionProfileInput>(() => {
    const parsedAge = Number(age) || MOCK_PROFILE_DEFAULTS.age;
    const parsedHeight = Number(heightCm) || MOCK_PROFILE_DEFAULTS.heightCm;
    const parsedWeight = Number(weightKg) || MOCK_PROFILE_DEFAULTS.weightKg;

    return {
      gender,
      age: parsedAge,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      bodyFatPct,
      activityLevel,
      goal,
    };
  }, [gender, age, heightCm, weightKg, bodyFatPct, activityLevel, goal]);

  const profileSignature = useMemo(() => JSON.stringify(profileInput), [profileInput]);
  const savedProfileSignatureRef = useRef(profileSignature);
  const isFirstRender = useRef(true);
  const plan = useMemo(() => calculateNutritionPlan(profileInput), [profileInput]);

  // Auto-save (unchanged behavior)
  useEffect(() => {
    if (profileSignature === savedProfileSignatureRef.current) {
      setProfileSaveStatus("idle");
      return;
    }

    setProfileSaveStatus("idle");
    let ignore = false;

    const timeout = window.setTimeout(() => {
      setProfileSaveStatus("saving");

      void saveNutritionProfileAction(profileInput)
        .then(() => {
          if (ignore) return;
          savedProfileSignatureRef.current = profileSignature;
          setProfileSaveStatus("saved");
        })
        .catch((error) => {
          if (ignore) return;
          setProfileSaveStatus("error");
          toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
        });
    }, 800);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [profileInput, profileSignature]);

  // "Recalculando…" visual indicator — skips first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsRecalculating(true);
    const t = window.setTimeout(() => setIsRecalculating(false), 600);
    return () => window.clearTimeout(t);
  }, [profileSignature]);

  async function handleSaveName() {
    const trimmed = displayName.trim();
    if (trimmed === savedNameRef.current) return;

    const result = await saveProfileNameAction(trimmed);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    savedNameRef.current = result.displayName ?? trimmed;
    setDisplayName(result.displayName ?? trimmed);
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    const result = await deleteAccountAction();
    setIsDeleting(false);

    if (result && !result.ok) {
      toast.error(result.message);
    }
  }

  // ─── Derived state ──────────────────────────────────────────────────────────

  const sectionStatus = useMemo(() => {
    const parsedAge = Number(age);
    const parsedHeight = Number(heightCm);
    const parsedWeight = Number(weightKg);
    return {
      cuenta: displayName.trim().length > 0,
      datos: parsedAge > 0 && parsedHeight > 0 && parsedWeight > 0,
      grasa: bodyFatPct !== null,
      actividad: true,
      objetivo: true,
    };
  }, [displayName, age, heightCm, weightKg, bodyFatPct]);

  const completedCount = useMemo(
    () => Object.values(sectionStatus).filter(Boolean).length,
    [sectionStatus],
  );

  const datosSuficientes = sectionStatus.cuenta && sectionStatus.datos;

  const bodyFatRef = useMemo(
    () => BODY_FAT_REFERENCES.find((r) => r.value === bodyFatPct) ?? null,
    [bodyFatPct],
  );

  const kcalDiff = plan.targetKcal - plan.maintenanceKcal;

  const bodyFatSummary = bodyFatRef ? `${bodyFatRef.label} ${bodyFatRef.range}` : "Estimado";
  const dataSummary = `${age}a · ${heightCm}cm · ${weightKg}kg`;

  // ─── Section bodies ─────────────────────────────────────────────────────────

  const accountBody = (
    <div className="grid gap-3">
      <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
        Nombre para mostrar
        <Input
          placeholder="Ej. Fede"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={handleSaveName}
          maxLength={40}
        />
      </label>
    </div>
  );

  const basicsBody = (
    <div className="grid gap-4">
      <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
        Sexo{" "}
        <span className="font-normal text-[var(--foreground-muted)]">(para estimación calórica)</span>
        <div className="grid grid-cols-2 gap-1.5">
          {GENDERS.map((value) => (
            <ToggleOption
              key={value}
              active={gender === value}
              label={value === "male" ? "Hombre" : "Mujer"}
              onClick={() => setGender(value)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#c2c8d6]">
          Edad (años)
          <Input type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#c2c8d6]">
          Altura (cm)
          <Input type="number" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#c2c8d6]">
          Peso (kg)
          <Input type="number" min={30} max={250} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </label>
      </div>

      {sectionStatus.datos && (
        <p className="flex items-center gap-1 text-xs text-[var(--accent)]">
          <Check className="size-3" /> Datos completos
        </p>
      )}
    </div>
  );

  const bodyFatDescription = (
    <p className="text-sm text-[var(--foreground-muted)]">
      Si conocés tu porcentaje aproximado, elegí el rango que más se parezca al tuyo.
      Mejora la precisión del cálculo de calorías.
    </p>
  );

  // Full body fat body — used in desktop cards (unchanged)
  const bodyFatBody = (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <ToggleOption
          active={bodyFatPct === null}
          label="No lo sé"
          description="Usamos tu peso, altura, edad y género."
          onClick={() => setBodyFatPct(null)}
        />
        {BODY_FAT_REFERENCES.map((reference) => (
          <ToggleOption
            key={reference.range}
            active={bodyFatPct === reference.value}
            label={`${reference.label} · ${reference.range}`}
            description={reference.description}
            onClick={() => setBodyFatPct(reference.value)}
          />
        ))}
      </div>
      <BodyFatFigure gender={gender} value={bodyFatPct} className="justify-self-center" />
    </div>
  );

  // Compact body fat body — used in mobile accordion
  const bodyFatBodyCompact = (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <ToggleOption
          compact
          active={bodyFatPct === null}
          label="No lo sé"
          onClick={() => setBodyFatPct(null)}
        />
        {BODY_FAT_REFERENCES.map((reference) => (
          <ToggleOption
            key={reference.range}
            compact
            active={bodyFatPct === reference.value}
            label={`${reference.label} · ${reference.range}`}
            onClick={() => setBodyFatPct(reference.value)}
          />
        ))}
      </div>

      {/* Description of active option only */}
      <AnimatePresence mode="wait">
        {bodyFatPct === null ? (
          <motion.p
            key="no-se"
            variants={fadeScale}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-xs text-[var(--foreground-muted)]"
          >
            Usamos tu peso, altura, edad y sexo para estimar.
          </motion.p>
        ) : bodyFatRef ? (
          <motion.p
            key={String(bodyFatPct)}
            variants={fadeScale}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-xs text-[var(--foreground-muted)]"
          >
            {bodyFatRef.description}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {/* Estimation mini-card (replaces broken "?" block) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3.5 py-2.5">
        {bodyFatPct !== null && bodyFatRef ? (
          <>
            <p className="text-xs font-semibold text-white">
              Grasa estimada: {bodyFatPct}% aprox.
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--foreground-muted)]">
              {bodyFatRef.label} · {bodyFatRef.range}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-white">Estimada automáticamente</p>
            <p className="mt-0.5 text-[10px] text-[var(--foreground-muted)]">
              Basado en peso, altura, edad y sexo
            </p>
          </>
        )}
      </div>
    </div>
  );

  const activityBody = (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {ACTIVITY_LEVELS.map((value) => (
        <ToggleOption
          key={value}
          active={activityLevel === value}
          label={ACTIVITY_LEVEL_INFO[value].label}
          description={ACTIVITY_LEVEL_INFO[value].description}
          onClick={() => setActivityLevel(value)}
        />
      ))}
    </div>
  );

  const goalBody = (
    <div className="grid gap-3">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {GOALS.map((value) => (
          <ToggleOption
            key={value}
            active={goal === value}
            label={GOAL_INFO[value].label}
            description={GOAL_INFO[value].description}
            onClick={() => setGoal(value)}
          />
        ))}
      </div>
      <p className="text-xs">
        <span className="font-semibold text-[var(--accent)]">{GOAL_ADJ_LABELS[goal]}</span>
      </p>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      {/* ── MOBILE: progress row + mini plan card + accordion ─────────────── */}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:hidden">
        {/* A. Progress row */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-2 rounded-full transition-colors duration-300",
                  i < completedCount ? "bg-[var(--accent)]" : "bg-[var(--border)]",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--foreground-muted)]">Perfil {completedCount}/5</span>
          {datosSuficientes && (
            <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
              <Check className="size-3" /> Datos suficientes para tu plan
            </span>
          )}
        </div>

        {/* B. Mini-card "Plan actual" */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <div className="flex items-center gap-3">
            <AnimatedProgressRing value={100} size={52} strokeWidth={5} progressColor="var(--accent)">
              <Flame className="size-4 text-[var(--accent)]" />
            </AnimatedProgressRing>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-xl font-bold text-white">
                  <AnimatedNumber value={plan.targetKcal} />
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">kcal</span>
                <span className="ml-1 truncate text-xs font-semibold text-[var(--accent)]">
                  {GOAL_INFO[goal].label}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--foreground-muted)]">
                <span style={{ color: MACRO_COLORS.protein }}>P</span>{" "}
                <AnimatedNumber value={plan.macros.proteinG} />g
                {" · "}
                <span style={{ color: MACRO_COLORS.carbs }}>C</span>{" "}
                <AnimatedNumber value={plan.macros.carbsG} />g
                {" · "}
                <span style={{ color: MACRO_COLORS.fat }}>G</span>{" "}
                <AnimatedNumber value={plan.macros.fatG} />g
              </p>
            </div>
            {/* Save status chip */}
            <AnimatePresence mode="wait">
              {profileSaveStatus === "saving" && (
                <motion.span
                  key="saving"
                  variants={fadeScale}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="shrink-0 rounded-full bg-[var(--card-alt)] px-2 py-0.5 text-[10px] text-[var(--foreground-muted)]"
                >
                  Guardando…
                </motion.span>
              )}
              {profileSaveStatus === "saved" && (
                <motion.span
                  key="saved"
                  variants={fadeScale}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] text-[var(--accent)]"
                >
                  <Check className="size-2.5" /> Guardado
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* C. Accordion sections with rich headers */}
        <Accordion
          type="multiple"
          defaultValue={["cuenta", "datos", "grasa", "actividad", "objetivo"]}
          className="grid gap-3"
        >
          <AccordionItem value="cuenta" className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
            <AccordionTrigger>
              <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                <span className="font-semibold">Tu cuenta</span>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-[var(--foreground-muted)]">
                    {displayName || "Sin nombre"}
                  </span>
                  {sectionStatus.cuenta && <Check className="size-3 shrink-0 text-[var(--accent)]" />}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>{accountBody}</AccordionContent>
          </AccordionItem>

          <AccordionItem value="datos" className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
            <AccordionTrigger>
              <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                <span className="font-semibold">Datos básicos</span>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-[var(--foreground-muted)]">{dataSummary}</span>
                  {sectionStatus.datos && <Check className="size-3 shrink-0 text-[var(--accent)]" />}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>{basicsBody}</AccordionContent>
          </AccordionItem>

          <AccordionItem value="grasa" className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
            <AccordionTrigger>
              <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                <span className="font-semibold">Grasa corporal</span>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-[var(--foreground-muted)]">{bodyFatSummary}</span>
                  {sectionStatus.grasa && <Check className="size-3 shrink-0 text-[var(--accent)]" />}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>{bodyFatBodyCompact}</AccordionContent>
          </AccordionItem>

          <AccordionItem value="actividad" className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
            <AccordionTrigger>
              <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                <span className="font-semibold">Actividad física</span>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-[var(--foreground-muted)]">
                    {ACTIVITY_LEVEL_INFO[activityLevel].label}
                  </span>
                  <Check className="size-3 shrink-0 text-[var(--accent)]" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>{activityBody}</AccordionContent>
          </AccordionItem>

          <AccordionItem value="objetivo" className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
            <AccordionTrigger>
              <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                <span className="font-semibold">Objetivo</span>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-[var(--foreground-muted)]">
                    {GOAL_INFO[goal].label}
                  </span>
                  <Check className="size-3 shrink-0 text-[var(--accent)]" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>{goalBody}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* ── DESKTOP: cards apiladas (sin cambios) ─────────────────────────── */}
      <div className="hidden gap-5 lg:grid">
        <Card>
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
          </CardHeader>
          <CardContent>{accountBody}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos básicos</CardTitle>
          </CardHeader>
          <CardContent>{basicsBody}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Porcentaje de grasa corporal (opcional)</CardTitle>
            {bodyFatDescription}
          </CardHeader>
          <CardContent>{bodyFatBody}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nivel de actividad física</CardTitle>
          </CardHeader>
          <CardContent>{activityBody}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objetivo</CardTitle>
          </CardHeader>
          <CardContent>{goalBody}</CardContent>
        </Card>
      </div>

      {/* ── PLAN ESTIMADO (shared mobile + desktop, mejorado) ─────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Tu plan estimado
            <AnimatePresence>
              {isRecalculating && (
                <motion.span
                  key="recalc"
                  variants={fadeScale}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-full bg-[var(--card-alt)] px-2 py-0.5 text-[10px] font-normal text-[var(--foreground-muted)]"
                >
                  Recalculando…
                </motion.span>
              )}
            </AnimatePresence>
          </CardTitle>
          <p className="text-sm text-[var(--foreground-muted)]">
            Estimación nutricional, no reemplaza el consejo de un profesional.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-center gap-3">
            <AnimatedProgressRing value={100} size={200} strokeWidth={16} progressColor="var(--accent)">
              <div className="flex flex-col items-center">
                <Flame className="mb-1 size-6 text-[var(--accent)]" />
                <span className="font-display text-3xl font-bold tracking-[-0.04em] text-white">
                  <AnimatedNumber value={plan.targetKcal} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7887a6]">
                  kcal objetivo
                </span>
              </div>
            </AnimatedProgressRing>

            {/* Plan desglose */}
            <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3.5 py-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--foreground-muted)]">Mantenimiento estimado</span>
                <span className="font-semibold text-white">
                  <AnimatedNumber value={plan.maintenanceKcal} /> kcal
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[var(--foreground-muted)]">Objetivo aplicado</span>
                <span
                  className={cn(
                    "font-semibold",
                    kcalDiff > 0
                      ? "text-emerald-400"
                      : kcalDiff < 0
                        ? "text-rose-400"
                        : "text-white",
                  )}
                >
                  {kcalDiff > 0 ? "+" : ""}
                  <AnimatedNumber value={kcalDiff} /> kcal
                </span>
              </div>
              <p className="mt-1.5 text-[10px] font-semibold text-[var(--accent)]">
                {GOAL_ADJ_LABELS[goal]}
              </p>
            </div>
          </div>

          <div className="hidden h-full w-px self-stretch bg-[var(--border)] lg:block" />

          <div className="flex w-full flex-1 flex-col gap-4">
            {(["protein", "carbs", "fat"] as const).map((key, index) => {
              const grams =
                key === "protein"
                  ? plan.macros.proteinG
                  : key === "carbs"
                    ? plan.macros.carbsG
                    : plan.macros.fatG;
              const kcalPerG = key === "fat" ? 9 : 4;
              const pct = Math.round(((grams * kcalPerG) / plan.targetKcal) * 100);
              const Icon = key === "protein" ? Beef : key === "carbs" ? Wheat : Droplet;

              return (
                <div key={key} className="flex items-center gap-4">
                  <AnimatedProgressRing value={pct} size={56} strokeWidth={6} progressColor={MACRO_COLORS[key]}>
                    <span className="font-display text-xs font-bold text-white">{pct}%</span>
                  </AnimatedProgressRing>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7887a6]">
                        <Icon className="size-3.5" style={{ color: MACRO_COLORS[key] }} />
                        {MACRO_LABELS[key]}
                      </span>
                      <span className="font-display text-sm font-semibold text-white">
                        <AnimatedNumber value={grams} /> g
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--card-alt)]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: MACRO_COLORS[key] }}
                        animate={{ width: `${Math.min(100, pct)}%` }}
                        transition={{
                          duration: 0.6,
                          ease: premiumEase,
                          delay: index * 0.08,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Este plan se actualiza cuando modificás tus datos.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="sm" className="text-[var(--foreground-muted)]">
            <LogOut className="size-3.5" />
            Cerrar sesión
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[#f87171]/70 hover:bg-[#3b1419]/30 hover:text-[#f87171]"
          onClick={() => setIsDeleteOpen(true)}
        >
          <TriangleAlert className="size-3.5" />
          Borrar tu cuenta
        </Button>
      </div>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setDeleteConfirm("");
        }}
      >
        <DialogContent open={isDeleteOpen}>
          <DialogHeader>
            <span className="grid size-11 place-items-center rounded-full border border-[#7a2630] bg-[#3b1419]/60 text-[#f87171]">
              <TriangleAlert className="size-5" />
            </span>
            <DialogTitle className="mt-3">Borrar cuenta</DialogTitle>
            <DialogDescription>
              Esta acción es irreversible. Se eliminará tu cuenta y todos tus datos asociados.
              Escribí <strong className="text-white">{DELETE_CONFIRM_TEXT}</strong> para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-5 pb-5">
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={DELETE_CONFIRM_TEXT}
            />
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="default"
                className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                disabled={deleteConfirm !== DELETE_CONFIRM_TEXT || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? <LoadingDots /> : <TriangleAlert className="size-4" />}
                Sí, borrar mi cuenta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToggleOption({
  active,
  label,
  description,
  compact = false,
  onClick,
}: {
  active: boolean;
  label: string;
  description?: string;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={tapFeedback}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-white shadow-[0_0_0_1px_var(--accent)]"
          : "border-[var(--border)] bg-[var(--card-alt)] text-[#9aa3b8] hover:text-white",
      )}
    >
      <p className="text-sm font-semibold">{label}</p>
      {!compact && description ? (
        <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">{description}</p>
      ) : null}
    </motion.button>
  );
}
