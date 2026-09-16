"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Beef, Check, Droplet, Flame, LogOut, TriangleAlert, Wheat } from "lucide-react";
import { toast } from "sonner";

import { AccountRows } from "@/app/components/configuracion/AccountRows";
import { ActivitySheet } from "@/app/components/configuracion/ActivitySheet";
import { BodySheet } from "@/app/components/configuracion/BodySheet";
import { DeleteAccountSheet } from "@/app/components/configuracion/DeleteAccountSheet";
import { GoalSheet } from "@/app/components/configuracion/GoalSheet";
import { NameSheet } from "@/app/components/configuracion/NameSheet";
import { PlanHero } from "@/app/components/configuracion/PlanHero";
import { PlanRows, type PlanSheet } from "@/app/components/configuracion/PlanRows";
import { ProfileIdentity } from "@/app/components/configuracion/ProfileIdentity";
import { ProfileSetupFlow } from "@/app/components/configuracion/ProfileSetupFlow";
import { SetupHero } from "@/app/components/configuracion/SetupHero";
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
import { deleteAccountAction, saveProfileNameAction } from "@/app/configuracion/actions";
import { useProfileForm } from "@/app/configuracion/useProfileForm";
import { MACRO_COLORS, MACRO_LABELS } from "@/app/lib/nutrition-style";
import {
  ACTIVITY_LEVEL_INFO,
  ACTIVITY_LEVELS,
  BODY_FAT_REFERENCES,
  GENDERS,
  GOAL_INFO,
  GOALS,
  type Goal,
} from "@/app/lib/nutrition-types";
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

const GOAL_ADJ_LABELS: Record<Goal, string> = {
  bulk: "Superávit moderado aplicado",
  cut: "Déficit calórico aplicado",
  recomposition: "Sin ajuste calórico",
};

type MobileSheet = PlanSheet | "name" | "delete";

export function ConfiguracionClient({
  initialProfile,
  initialDisplayName,
  email,
}: {
  initialProfile: NutritionProfile | null;
  initialDisplayName: string | null;
  email: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const savedNameRef = useRef(initialDisplayName ?? "");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Mobile (DESIGN.md §15): sheet abierto y flujo de alta.
  const [sheet, setSheet] = useState<MobileSheet | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const form = useProfileForm(initialProfile, { autosavePaused: setupOpen });
  const {
    gender,
    handleGenderChange,
    age,
    setAge,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    bodyFatPct,
    setBodyFatPct,
    activityLevel,
    setActivityLevel,
    goal,
    setGoal,
    targetMode,
    handleTargetModeChange,
    manualKcal,
    setManualKcal,
    manualProteinG,
    setManualProteinG,
    manualCarbsG,
    setManualCarbsG,
    manualFatG,
    setManualFatG,
    manualTarget,
    isManualInvalid,
    plan,
    isRecalculating,
  } = form;

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

  const datosCompletos = Number(age) > 0 && Number(heightCm) > 0 && Number(weightKg) > 0;
  const bodyFatReferences = BODY_FAT_REFERENCES[gender];

  function handleSheetOpenChange(open: boolean) {
    if (open) return;
    form.flush();
    setSheet(null);
  }

  const kcalDiff = plan.targetKcal - plan.maintenanceKcal;


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
              onClick={() => handleGenderChange(value)}
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

      {datosCompletos && (
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
        {bodyFatReferences.map((reference) => (
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

      <div className="grid gap-2.5 border-t border-[var(--border)] pt-3">
        <p className="text-xs font-semibold text-[#c2c8d6]">Calorías y macros diarios</p>
        <div className="grid grid-cols-2 gap-1.5">
          <ToggleOption compact active={targetMode === "auto"} label="Calculados" onClick={() => handleTargetModeChange("auto")} />
          <ToggleOption compact active={targetMode === "manual"} label="Los fijo yo" onClick={() => handleTargetModeChange("manual")} />
        </div>
        {targetMode === "manual" ? (
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Calorías (kcal)
                <Input inputMode="numeric" value={manualKcal} onChange={(e) => setManualKcal(e.target.value)} />
              </label>
              <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Proteínas (g)
                <Input inputMode="numeric" value={manualProteinG} onChange={(e) => setManualProteinG(e.target.value)} />
              </label>
              <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Carbohidratos (g)
                <Input inputMode="numeric" value={manualCarbsG} onChange={(e) => setManualCarbsG(e.target.value)} />
              </label>
              <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Grasas (g)
                <Input inputMode="numeric" value={manualFatG} onChange={(e) => setManualFatG(e.target.value)} />
              </label>
            </div>
            {isManualInvalid ? (
              <p className="text-xs text-[var(--warning)]">
                Completá calorías entre 800 y 10000 y macros de 0 a 1500 g para guardar.
              </p>
            ) : manualTarget ? (
              <p className="text-xs text-[var(--foreground-muted)]">
                Tus macros suman ≈
                {manualTarget.macros.proteinG * 4 + manualTarget.macros.carbsG * 4 + manualTarget.macros.fatG * 9} kcal.
                {Math.abs(manualTarget.macros.proteinG * 4 + manualTarget.macros.carbsG * 4 + manualTarget.macros.fatG * 9 - manualTarget.targetKcal) >
                manualTarget.targetKcal * 0.1
                  ? " No coinciden con las calorías: revisalos."
                  : ""}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-[var(--foreground-muted)]">
            Los calculamos con tus datos, tu actividad y tu objetivo.
          </p>
        )}
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      {/* ── MOBILE · DESIGN.md §15 ───────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-col lg:hidden">
        <div aria-hidden="true" className="home-safe-top" />
        <h1 className="sr-only">Configuración</h1>

        {setupOpen ? (
          <ProfileSetupFlow form={form} onExit={() => setSetupOpen(false)} onDone={() => setSetupOpen(false)} />
        ) : (
          <>
            <ProfileIdentity
              displayName={displayName}
              email={email}
              onEditName={() => setSheet("name")}
              saveStatus={form.saveStatus}
              saveCount={form.saveCount}
              online={form.online}
              onRetry={form.retry}
            />

            {form.hasProfile ? (
              <>
                <div className="mt-7">
                  <PlanHero
                    plan={plan}
                    calculatedKcal={form.calculatedPlan.targetKcal}
                    manualTarget={manualTarget}
                    goal={goal}
                  />
                </div>
                <div className="mt-10">
                  <PlanRows input={form.profileInput} targetMode={targetMode} onOpen={setSheet} />
                </div>
              </>
            ) : (
              <div className="mt-7">
                <SetupHero onStart={() => setSetupOpen(true)} />
              </div>
            )}

            <div className="mt-10">
              <AccountRows
                displayName={displayName}
                email={email}
                onEditName={() => setSheet("name")}
                onDeleteAccount={() => setSheet("delete")}
              />
            </div>
          </>
        )}

        <BodySheet open={sheet === "body"} onOpenChange={handleSheetOpenChange} form={form} />
        <ActivitySheet open={sheet === "activity"} onOpenChange={handleSheetOpenChange} form={form} />
        <GoalSheet open={sheet === "goal"} onOpenChange={handleSheetOpenChange} form={form} />
        <NameSheet
          open={sheet === "name"}
          onOpenChange={handleSheetOpenChange}
          value={displayName}
          onChange={setDisplayName}
          onCommit={() => void handleSaveName()}
          disabled={!form.online}
        />
        <DeleteAccountSheet
          open={sheet === "delete"}
          onOpenChange={handleSheetOpenChange}
          confirmText={DELETE_CONFIRM_TEXT}
          isDeleting={isDeleting}
          onConfirm={() => void handleDeleteAccount()}
        />
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

      {/* ── PLAN ESTIMADO (desktop) ───────────────────────────────────────── */}
      <div className="hidden lg:block">
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
                  {manualTarget ? "Objetivo fijado a mano" : GOAL_ADJ_LABELS[goal]}
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
                {manualTarget
                  ? "Objetivo manual: no cambia aunque modifiques tus datos."
                  : "Este plan se actualiza cuando modificás tus datos."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex">
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
