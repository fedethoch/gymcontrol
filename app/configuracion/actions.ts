"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/app/lib/auth";
import { saveNotificationPreferences } from "@/app/lib/notification-preferences";
import type { NotificationPreferences } from "@/app/lib/notifications";
import {
  cleanSupplementName,
  findPresetByName,
  MAX_CUSTOM_SUPPLEMENTS,
  SUPPLEMENT_NAME_MAX_LENGTH,
  SUPPLEMENT_PRESETS,
  type Supplement,
} from "@/app/lib/supplements";
import {
  countCustomSupplements,
  deleteCustomSupplement,
  listSupplementsForUser,
  saveSupplement,
} from "@/app/lib/supplements-store";
import {
  CUSTOM_FAT_PCT_RANGE,
  CUSTOM_PROTEIN_RANGE,
  isVariantOf,
  MAINTENANCE_OVERRIDE_RANGE,
  resolveAdjustment,
} from "@/app/lib/nutrition-plan-options";
import { saveNutritionProfile } from "@/app/lib/nutrition-profile";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import {
  ACTIVITY_LEVELS,
  GENDERS,
  GOAL_VARIANTS,
  GOALS,
  MACRO_PRESETS,
  type ManualTarget,
  type NutritionPlan,
  type NutritionProfileInput,
} from "@/app/lib/nutrition-types";

const profileInputSchema = z
  .object({
    gender: z.enum(GENDERS),
    age: z.number().int().positive().max(120),
    heightCm: z.number().positive().max(300),
    weightKg: z.number().positive().max(500),
    bodyFatPct: z.number().gt(0).lt(100).nullable(),
    activityLevel: z.enum(ACTIVITY_LEVELS),
    goal: z.enum(GOALS),
    goalVariant: z.enum(GOAL_VARIANTS).optional(),
    kcalAdjustment: z.number().min(-0.3).max(0.25).nullable().optional(),
    macroPreset: z.enum(MACRO_PRESETS).optional(),
    customProteinGPerKg: z.number().min(CUSTOM_PROTEIN_RANGE[0]).max(CUSTOM_PROTEIN_RANGE[1]).nullable().optional(),
    customFatPct: z.number().min(CUSTOM_FAT_PCT_RANGE[0]).max(CUSTOM_FAT_PCT_RANGE[1]).nullable().optional(),
    maintenanceOverrideKcal: z
      .number()
      .int()
      .min(MAINTENANCE_OVERRIDE_RANGE[0])
      .max(MAINTENANCE_OVERRIDE_RANGE[1])
      .nullable()
      .optional(),
    targetWeightKg: z.number().positive().max(500).nullable().optional(),
  })
  .refine((input) => !input.goalVariant || isVariantOf(input.goal, input.goalVariant), {
    message: "La variante no corresponde al objetivo.",
  })
  .transform((input) => ({
    ...input,
    // El ajuste fino se guarda redondeado a 1% y dentro del rango del objetivo.
    kcalAdjustment: input.kcalAdjustment == null ? null : resolveAdjustment(input),
  }));

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

const reminderTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Revisá las horas de los avisos.");
const reminderSchema = z.object({ enabled: z.boolean(), time: reminderTimeSchema });

const notificationPreferencesSchema = z.object({
  training: reminderSchema,
  meals: z.object({
    desayuno: reminderSchema,
    almuerzo: reminderSchema,
    merienda: reminderSchema,
    cena: reminderSchema,
  }),
  weekly: reminderSchema.extend({ isoDay: z.number().int().min(1).max(7) }),
  restEnd: z.boolean(),
  supplements: z.boolean(),
});

/** S7 Notificaciones (DESIGN.md §15.2): guardado automático de qué avisos y a qué hora. */
export async function saveNotificationPreferencesAction(
  prefs: NotificationPreferences,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const auth = await requireUser();
  const parsed = notificationPreferencesSchema.safeParse(prefs);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisá los avisos." };
  }

  try {
    await saveNotificationPreferences(auth.user.id, parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudieron guardar los avisos." };
  }

  return { ok: true };
}

const supplementSchema = z.object({
  id: z.string().uuid().nullable(),
  presetKey: z.enum(SUPPLEMENT_PRESETS.map((preset) => preset.key) as [string, ...string[]]).nullable(),
  active: z.boolean(),
  reminderEnabled: z.boolean(),
  reminderTime: reminderTimeSchema,
});

type SupplementResult = { ok: true; supplement: Supplement } | { ok: false; message: string };

/** S8 Suplementos (DESIGN.md §15.2): marcar, desmarcar, hora y aviso de uno de la lista. */
export async function saveSupplementAction(input: z.input<typeof supplementSchema>): Promise<SupplementResult> {
  const auth = await requireUser();
  const parsed = supplementSchema.safeParse(input);

  if (!parsed.success || (!parsed.data.id && !parsed.data.presetKey)) {
    return { ok: false, message: "Revisá el suplemento." };
  }

  const preset = SUPPLEMENT_PRESETS.find((item) => item.key === parsed.data.presetKey) ?? null;

  try {
    const id = await saveSupplement(auth.user.id, {
      ...parsed.data,
      presetKey: preset?.key ?? null,
      // El nombre de un común sale del código, nunca del cliente.
      name: preset?.name ?? "",
    });

    revalidatePath("/");

    return {
      ok: true,
      supplement: {
        id,
        presetKey: preset?.key ?? null,
        name: preset?.name ?? "",
        active: parsed.data.active,
        reminderEnabled: parsed.data.reminderEnabled,
        reminderTime: parsed.data.reminderTime,
      },
    };
  } catch {
    return { ok: false, message: "No se pudo guardar el suplemento." };
  }
}

/**
 * "Agregar otro" de S8: un común escrito a mano marca ese común; un propio que ya existe se vuelve a marcar.
 * Entra marcado, con aviso a las 09:00.
 */
export async function addCustomSupplementAction(rawName: string): Promise<SupplementResult> {
  const auth = await requireUser();
  const name = cleanSupplementName(typeof rawName === "string" ? rawName : "");

  if (!name) {
    return { ok: false, message: "Escribí el nombre del suplemento." };
  }

  if (name.length > SUPPLEMENT_NAME_MAX_LENGTH) {
    return { ok: false, message: `Hasta ${SUPPLEMENT_NAME_MAX_LENGTH} letras.` };
  }

  try {
    const saved = await listSupplementsForUser(auth.user.id);
    const preset = findPresetByName(name);
    const existing = preset
      ? saved.find((item) => item.presetKey === preset.key)
      : saved.find((item) => !item.presetKey && item.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"));

    if (existing?.active) {
      return { ok: false, message: "Ya está en tu lista." };
    }

    if (!preset && !existing && (await countCustomSupplements(auth.user.id)) >= MAX_CUSTOM_SUPPLEMENTS) {
      return { ok: false, message: `Podés agregar hasta ${MAX_CUSTOM_SUPPLEMENTS} propios.` };
    }

    const base = existing ?? {
      id: null,
      presetKey: preset?.key ?? null,
      name: preset?.name ?? name,
      reminderEnabled: true,
      reminderTime: "09:00",
    };
    const id = await saveSupplement(auth.user.id, { ...base, active: true });

    revalidatePath("/");

    return { ok: true, supplement: { ...base, id, active: true } };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.message === "duplicate" ? "Ya está en tu lista." : "No se pudo agregar.",
    };
  }
}

export async function deleteSupplementAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const auth = await requireUser();

  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, message: "Revisá el suplemento." };
  }

  try {
    await deleteCustomSupplement(auth.user.id, id);
    revalidatePath("/");

    return { ok: true };
  } catch {
    return { ok: false, message: "No se pudo borrar el suplemento." };
  }
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
