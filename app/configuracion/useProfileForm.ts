"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useOnlineStatus } from "@/app/components/configuracion/use-online-status";
import { saveNutritionProfileAction } from "@/app/configuracion/actions";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { MOCK_PROFILE_DEFAULTS } from "@/app/lib/nutrition-mock";
import type { NutritionProfile } from "@/app/lib/nutrition-profile";
import {
  BODY_FAT_REFERENCES,
  type ActivityLevel,
  type Gender,
  type Goal,
  type ManualTarget,
  type NutritionPlan,
  type NutritionProfileInput,
  type TargetMode,
} from "@/app/lib/nutrition-types";
import { parseManualTarget } from "@/app/lib/profile-plan";

export type ProfileSaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 800;

/**
 * Estado del perfil nutricional y su autosave. Lo comparten el árbol mobile (DESIGN.md §15)
 * y el desktop de /configuracion.
 * `autosavePaused`: el flujo de alta mobile no guarda hasta "Calcular mi plan".
 */
export function useProfileForm(
  initialProfile: NutritionProfile | null,
  { autosavePaused = false }: { autosavePaused?: boolean } = {},
) {
  const [gender, setGender] = useState<Gender>(initialProfile?.gender ?? MOCK_PROFILE_DEFAULTS.gender);
  const [age, setAge] = useState(String(initialProfile?.age ?? MOCK_PROFILE_DEFAULTS.age));
  const [heightCm, setHeightCm] = useState(String(initialProfile?.heightCm ?? MOCK_PROFILE_DEFAULTS.heightCm));
  const [weightKg, setWeightKg] = useState(String(initialProfile?.weightKg ?? MOCK_PROFILE_DEFAULTS.weightKg));
  const [bodyFatPct, setBodyFatPct] = useState<number | null>(initialProfile?.bodyFatPct ?? null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel ?? MOCK_PROFILE_DEFAULTS.activityLevel,
  );
  const [goal, setGoal] = useState<Goal>(initialProfile?.goal ?? MOCK_PROFILE_DEFAULTS.goal);
  const initialManualPlan = initialProfile?.targetMode === "manual" ? initialProfile.plan : null;
  const [targetMode, setTargetMode] = useState<TargetMode>(initialProfile?.targetMode ?? "auto");
  const [manualKcal, setManualKcal] = useState(initialManualPlan ? String(initialManualPlan.targetKcal) : "");
  const [manualProteinG, setManualProteinG] = useState(initialManualPlan ? String(initialManualPlan.macros.proteinG) : "");
  const [manualCarbsG, setManualCarbsG] = useState(initialManualPlan ? String(initialManualPlan.macros.carbsG) : "");
  const [manualFatG, setManualFatG] = useState(initialManualPlan ? String(initialManualPlan.macros.fatG) : "");
  // Último guardado y la firma que guardó: el estado visible se deriva (sin setState síncrono en efectos).
  const [lastSave, setLastSave] = useState<{ status: Exclude<ProfileSaveStatus, "idle">; signature: string } | null>(
    null,
  );
  // Sube con cada guardado exitoso: el indicador mobile lo usa como key para mostrar "Guardado" 2 s.
  const [saveCount, setSaveCount] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const online = useOnlineStatus();

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

  // Objetivo manual: solo se guarda si los valores son coherentes (mismos límites que el servidor).
  const manualTarget = useMemo<ManualTarget | null>(
    () =>
      targetMode === "manual"
        ? parseManualTarget({ kcal: manualKcal, proteinG: manualProteinG, carbsG: manualCarbsG, fatG: manualFatG })
        : null,
    [targetMode, manualKcal, manualProteinG, manualCarbsG, manualFatG],
  );
  const isManualInvalid = targetMode === "manual" && manualTarget === null;

  const profileSignature = useMemo(
    () => JSON.stringify({ profileInput, targetMode, manualTarget }),
    [profileInput, targetMode, manualTarget],
  );
  const savedProfileSignatureRef = useRef(profileSignature);
  const pendingSaveRef = useRef<{ timeout: number; run: () => void } | null>(null);
  const isFirstRender = useRef(true);
  const calculatedPlan = useMemo(() => calculateNutritionPlan(profileInput), [profileInput]);
  const plan: NutritionPlan = manualTarget
    ? { ...calculatedPlan, targetKcal: manualTarget.targetKcal, macros: manualTarget.macros }
    : calculatedPlan;
  // Un cambio nuevo vuelve el indicador a "idle" hasta que arranque su guardado.
  const saveStatus: ProfileSaveStatus =
    lastSave && lastSave.signature === profileSignature && !autosavePaused ? lastSave.status : "idle";

  const saveNow = useCallback(async () => {
    const signature = profileSignature;
    setLastSave({ status: "saving", signature });

    try {
      await saveNutritionProfileAction(profileInput, manualTarget);
      savedProfileSignatureRef.current = signature;
      setLastSave({ status: "saved", signature });
      setSaveCount((count) => count + 1);
      return true;
    } catch (error) {
      setLastSave({ status: "error", signature });
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
      return false;
    }
  }, [profileInput, manualTarget, profileSignature]);

  // Auto-save: 800 ms después del último cambio. Sin red espera: el efecto vuelve a correr al reconectar.
  useEffect(() => {
    if (autosavePaused || !online || isManualInvalid || profileSignature === savedProfileSignatureRef.current) {
      return;
    }

    let ignore = false;

    const run = () => {
      pendingSaveRef.current = null;
      if (!navigator.onLine) return;
      setLastSave({ status: "saving", signature: profileSignature });

      void saveNutritionProfileAction(profileInput, manualTarget)
        .then(() => {
          if (ignore) return;
          savedProfileSignatureRef.current = profileSignature;
          setLastSave({ status: "saved", signature: profileSignature });
          setSaveCount((count) => count + 1);
        })
        .catch((error) => {
          if (ignore) return;
          setLastSave({ status: "error", signature: profileSignature });
          toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
        });
    };

    const timeout = window.setTimeout(run, AUTOSAVE_DELAY_MS);
    pendingSaveRef.current = { timeout, run };

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
      pendingSaveRef.current = null;
    };
  }, [profileInput, profileSignature, manualTarget, isManualInvalid, autosavePaused, online]);

  /** Guarda ya lo pendiente (al cerrar un sheet), sin esperar el debounce. */
  const flush = useCallback(() => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timeout);
    pending.run();
  }, []);

  /** Reintento manual después de un error. */
  const retry = useCallback(() => {
    if (!online || isManualInvalid) return;
    void saveNow();
  }, [online, isManualInvalid, saveNow]);

  /** Cierre del flujo de alta: guarda y, si sale bien, la pantalla pasa a mostrar el plan. */
  const completeSetup = useCallback(async () => {
    const saved = await saveNow();
    if (saved) setSetupDone(true);
    return saved;
  }, [saveNow]);

  function handleTargetModeChange(nextMode: TargetMode) {
    if (nextMode === "manual" && !manualKcal.trim()) {
      setManualKcal(String(calculatedPlan.targetKcal));
      setManualProteinG(String(calculatedPlan.macros.proteinG));
      setManualCarbsG(String(calculatedPlan.macros.carbsG));
      setManualFatG(String(calculatedPlan.macros.fatG));
    }

    setTargetMode(nextMode);
  }

  // Ranges differ by sex: keep the same level (e.g. "Moderado") when switching.
  function handleGenderChange(next: Gender) {
    if (next === gender) return;
    const level = BODY_FAT_REFERENCES[gender].findIndex((r) => r.value === bodyFatPct);
    if (level !== -1) setBodyFatPct(BODY_FAT_REFERENCES[next][level].value);
    setGender(next);
  }

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

  return {
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
    profileInput,
    manualTarget,
    isManualInvalid,
    calculatedPlan,
    plan,
    saveStatus,
    saveCount,
    isRecalculating,
    online,
    flush,
    retry,
    completeSetup,
    hasProfile: initialProfile !== null || setupDone,
  };
}

export type ProfileForm = ReturnType<typeof useProfileForm>;
