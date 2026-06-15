"use client";

import { useMemo, useState } from "react";
import { Beef, Droplet, Flame, LoaderCircle, LogOut, TriangleAlert, Wheat } from "lucide-react";
import { toast } from "sonner";

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
} from "@/app/lib/nutrition-types";
import { MOCK_PROFILE_DEFAULTS } from "@/app/lib/nutrition-mock";
import type { NutritionProfile } from "@/app/lib/nutrition-profile";
import { cn } from "@/app/lib/utils";

const DELETE_CONFIRM_TEXT = "BORRAR";

export function ConfiguracionClient({
  initialProfile,
  initialDisplayName,
}: {
  initialProfile: NutritionProfile | null;
  initialDisplayName: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [isSavingName, setIsSavingName] = useState(false);

  const [gender, setGender] = useState<Gender>(initialProfile?.gender ?? MOCK_PROFILE_DEFAULTS.gender);
  const [age, setAge] = useState(String(initialProfile?.age ?? MOCK_PROFILE_DEFAULTS.age));
  const [heightCm, setHeightCm] = useState(String(initialProfile?.heightCm ?? MOCK_PROFILE_DEFAULTS.heightCm));
  const [weightKg, setWeightKg] = useState(String(initialProfile?.weightKg ?? MOCK_PROFILE_DEFAULTS.weightKg));
  const [bodyFatPct, setBodyFatPct] = useState<number | null>(initialProfile?.bodyFatPct ?? null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel ?? MOCK_PROFILE_DEFAULTS.activityLevel,
  );
  const [goal, setGoal] = useState<Goal>(initialProfile?.goal ?? MOCK_PROFILE_DEFAULTS.goal);
  const [isPending, setIsPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const plan = useMemo(() => {
    const parsedAge = Number(age) || MOCK_PROFILE_DEFAULTS.age;
    const parsedHeight = Number(heightCm) || MOCK_PROFILE_DEFAULTS.heightCm;
    const parsedWeight = Number(weightKg) || MOCK_PROFILE_DEFAULTS.weightKg;

    return calculateNutritionPlan({
      gender,
      age: parsedAge,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      bodyFatPct,
      activityLevel,
      goal,
    });
  }, [gender, age, heightCm, weightKg, bodyFatPct, activityLevel, goal]);

  async function handleSaveName() {
    setIsSavingName(true);
    const result = await saveProfileNameAction(displayName);
    setIsSavingName(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setDisplayName(result.displayName ?? "");
    toast.success("Nombre actualizado.");
  }

  async function handleSaveProfile() {
    const parsedAge = Number(age) || MOCK_PROFILE_DEFAULTS.age;
    const parsedHeight = Number(heightCm) || MOCK_PROFILE_DEFAULTS.heightCm;
    const parsedWeight = Number(weightKg) || MOCK_PROFILE_DEFAULTS.weightKg;

    setIsPending(true);

    await saveNutritionProfileAction({
      gender,
      age: parsedAge,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      bodyFatPct,
      activityLevel,
      goal,
    });

    setIsPending(false);
    toast.success("Perfil guardado.");
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    const result = await deleteAccountAction();
    setIsDeleting(false);

    if (result && !result.ok) {
      toast.error(result.message);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Nombre para mostrar
              <Input
                placeholder="Ej. Fede"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
              />
            </label>
            <Button type="button" onClick={handleSaveName} disabled={isSavingName}>
              {isSavingName ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Guardar nombre
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos básicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Género
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Porcentaje de grasa corporal (opcional)</CardTitle>
            <p className="text-sm text-[var(--foreground-muted)]">
              Si conocés tu porcentaje aproximado, elegí el rango que más se parezca al tuyo.
              Mejora la precisión del cálculo de calorías.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nivel de actividad física</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            {ACTIVITY_LEVELS.map((value) => (
              <ToggleOption
                key={value}
                active={activityLevel === value}
                label={ACTIVITY_LEVEL_INFO[value].label}
                description={ACTIVITY_LEVEL_INFO[value].description}
                onClick={() => setActivityLevel(value)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objetivo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-3">
            {GOALS.map((value) => (
              <ToggleOption
                key={value}
                active={goal === value}
                label={GOAL_INFO[value].label}
                description={GOAL_INFO[value].description}
                onClick={() => setGoal(value)}
              />
            ))}
          </CardContent>
        </Card>

        <Button type="button" size="lg" className="justify-center" onClick={handleSaveProfile} disabled={isPending}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Guardar perfil
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu plan estimado</CardTitle>
          <p className="text-sm text-[var(--foreground-muted)]">
            Estimación nutricional, no reemplaza el consejo de un profesional.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-center gap-2">
            <AnimatedProgressRing value={100} size={200} strokeWidth={16} progressColor="var(--accent)">
              <div className="flex flex-col items-center">
                <Flame className="mb-1 size-6 text-[var(--accent)]" />
                <span className="font-display text-3xl font-bold tracking-[-0.04em] text-white">
                  {plan.targetKcal}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7887a6]">
                  kcal objetivo
                </span>
              </div>
            </AnimatedProgressRing>
            <p className="text-xs text-[var(--foreground-muted)]">
              Mantenimiento estimado · <span className="font-semibold text-white">{plan.maintenanceKcal} kcal</span>
            </p>
          </div>

          <div className="hidden h-full w-px self-stretch bg-[var(--border)] lg:block" />

          <div className="flex w-full flex-1 flex-col gap-4">
            {(["protein", "carbs", "fat"] as const).map((key) => {
              const grams = key === "protein" ? plan.macros.proteinG : key === "carbs" ? plan.macros.carbsG : plan.macros.fatG;
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
                      <span className="font-display text-sm font-semibold text-white">{grams} g</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--card-alt)]">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: MACRO_COLORS[key] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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
                {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <TriangleAlert className="size-4" />}
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
  onClick,
}: {
  active: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-white"
          : "border-[var(--border)] bg-[var(--card-alt)] text-[#9aa3b8] hover:text-white",
      )}
    >
      <p className="text-sm font-semibold">{label}</p>
      {description ? <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">{description}</p> : null}
    </button>
  );
}
