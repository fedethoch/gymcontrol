"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/app/lib/auth";
import { saveNutritionProfile } from "@/app/lib/nutrition-profile";
import { createSupabaseAdminClient } from "@/app/lib/supabase/admin";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import type { NutritionPlan, NutritionProfileInput } from "@/app/lib/nutrition-types";

export async function saveNutritionProfileAction(input: NutritionProfileInput): Promise<NutritionPlan> {
  const auth = await requireUser();
  const profile = await saveNutritionProfile(auth.user.id, input);
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
