"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/app/lib/auth";
import { saveNutritionProfile } from "@/app/lib/nutrition-profile";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import {
  ACTIVITY_LEVELS,
  GENDERS,
  GOALS,
  type ManualTarget,
  type NutritionPlan,
  type NutritionProfileInput,
} from "@/app/lib/nutrition-types";

const profileInputSchema = z.object({
  gender: z.enum(GENDERS),
  age: z.number().int().positive().max(120),
  heightCm: z.number().positive().max(300),
  weightKg: z.number().positive().max(500),
  bodyFatPct: z.number().gt(0).lt(100).nullable(),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(GOALS),
});

const macroGramsSchema = z.number().min(0, "Los macros no pueden ser negativos.").max(1500, "Revisá los macros.");

const manualTargetSchema = z.object({
  targetKcal: z.number().int().min(800, "El objetivo manual debe ser de al menos 800 kcal.").max(10_000, "Revisá las calorías."),
  macros: z.object({ proteinG: macroGramsSchema, carbsG: macroGramsSchema, fatG: macroGramsSchema }),
});

export async function saveNutritionProfileAction(
  input: NutritionProfileInput,
  manualTarget: ManualTarget | null = null,
): Promise<NutritionPlan> {
  const auth = await requireUser();
  const parsedInput = profileInputSchema.safeParse(input);
  const parsedTarget = manualTarget ? manualTargetSchema.safeParse(manualTarget) : null;

  if (!parsedInput.success) {
    throw new Error("Revisá tus datos: edad, altura y peso tienen que ser válidos.");
  }

  if (parsedTarget && !parsedTarget.success) {
    throw new Error(parsedTarget.error.issues[0]?.message ?? "Revisá el objetivo manual.");
  }

  const profile = await saveNutritionProfile(auth.user.id, parsedInput.data, parsedTarget?.data ?? null);

  revalidatePath("/nutricion/registro");
  revalidatePath("/");

  return profile.plan;
}

export async function saveProfileNameAction(
  displayName: string,
): Promise<{ ok: true; displayName: string | null } | { ok: false; message: string }> {
  const auth = await requireUser();
  const trimmed = displayName.trim();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed || null })
    .eq("id", auth.profile.id);

  if (error) {
    return { ok: false, message: `No se pudo guardar el nombre: ${error.message}` };
  }

  return { ok: true, displayName: trimmed || null };
}

export async function deleteAccountAction(): Promise<{ ok: true } | { ok: false; message: string }> {
  const auth = await requireUser();

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(auth.user.id);

    if (error) {
      return { ok: false, message: `No se pudo eliminar la cuenta: ${error.message}` };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar la cuenta.",
    };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/auth/login?status=account-deleted");
}
