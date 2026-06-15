import "server-only";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type AdminStats = {
  exercises: number;
  routines: number;
  users: number;
  savedRoutines: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createSupabaseServerClient();

  const [exercises, routines, users, savedRoutines] = await Promise.all([
    supabase.from("exercises").select("*", { count: "exact", head: true }),
    supabase.from("routine_templates").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("saved_routines").select("*", { count: "exact", head: true }),
  ]);

  for (const [label, result] of [
    ["ejercicios", exercises],
    ["rutinas", routines],
    ["usuarios", users],
    ["rutinas guardadas", savedRoutines],
  ] as const) {
    if (result.error) {
      throw new Error(`No se pudo contar ${label}: ${result.error.message}`);
    }
  }

  return {
    exercises: exercises.count ?? 0,
    routines: routines.count ?? 0,
    users: users.count ?? 0,
    savedRoutines: savedRoutines.count ?? 0,
  };
}

export type ManagementSummary = {
  activeRoutines: number;
  newExercisesThisWeek: number;
  usersWithRoutinePct: number;
};

export async function getManagementSummary(): Promise<ManagementSummary> {
  const supabase = await createSupabaseServerClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [activeRoutines, newExercises, usersWithRoutine, totalUsers] = await Promise.all([
    supabase
      .from("saved_routines")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("exercises")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    supabase.from("saved_routines").select("user_id"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("type_rol", "user"),
  ]);

  for (const [label, result] of [
    ["rutinas activas", activeRoutines],
    ["ejercicios nuevos", newExercises],
    ["usuarios con rutina", usersWithRoutine],
    ["usuarios", totalUsers],
  ] as const) {
    if (result.error) {
      throw new Error(`No se pudo calcular ${label}: ${result.error.message}`);
    }
  }

  const distinctUsersWithRoutine = new Set(
    ((usersWithRoutine.data ?? []) as { user_id: string }[]).map((row) => row.user_id),
  ).size;
  const totalUsersCount = totalUsers.count ?? 0;

  return {
    activeRoutines: activeRoutines.count ?? 0,
    newExercisesThisWeek: newExercises.count ?? 0,
    usersWithRoutinePct:
      totalUsersCount > 0 ? Math.round((distinctUsersWithRoutine / totalUsersCount) * 100) : 0,
  };
}

export type RecentActivityKind = "rutina_nueva" | "ejercicio_nuevo" | "rutina_actualizada" | "usuario_nuevo" | "rutina_guardada";

export type RecentActivityEntry = {
  kind: RecentActivityKind;
  action: string;
  detail: string;
  at: string;
};

export async function getRecentActivity(limit = 6): Promise<RecentActivityEntry[]> {
  const supabase = await createSupabaseServerClient();

  const [exercises, routines, profiles, savedRoutines] = await Promise.all([
    supabase
      .from("exercises")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("routine_templates")
      .select("name, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("profiles")
      .select("created_at")
      .eq("type_rol", "user")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("saved_routines")
      .select("custom_name, saved_at, routine_template:routine_templates(name)")
      .order("saved_at", { ascending: false })
      .limit(limit),
  ]);

  for (const [label, result] of [
    ["ejercicios", exercises],
    ["rutinas", routines],
    ["usuarios", profiles],
    ["rutinas guardadas", savedRoutines],
  ] as const) {
    if (result.error) {
      throw new Error(`No se pudo leer actividad reciente (${label}): ${result.error.message}`);
    }
  }

  const entries: RecentActivityEntry[] = [];

  for (const exercise of (exercises.data ?? []) as { name: string; created_at: string }[]) {
    entries.push({
      kind: "ejercicio_nuevo",
      action: "Ejercicio nuevo",
      detail: exercise.name,
      at: exercise.created_at,
    });
  }

  for (const routine of (routines.data ?? []) as {
    name: string;
    created_at: string;
    updated_at: string;
  }[]) {
    const wasUpdated = new Date(routine.updated_at).getTime() > new Date(routine.created_at).getTime();

    entries.push({
      kind: wasUpdated ? "rutina_actualizada" : "rutina_nueva",
      action: wasUpdated ? "Rutina actualizada" : "Rutina nueva",
      detail: routine.name,
      at: wasUpdated ? routine.updated_at : routine.created_at,
    });
  }

  for (const profile of (profiles.data ?? []) as { created_at: string }[]) {
    entries.push({
      kind: "usuario_nuevo",
      action: "Usuario nuevo",
      detail: "Se registro un nuevo usuario",
      at: profile.created_at,
    });
  }

  for (const saved of (savedRoutines.data ?? []) as {
    custom_name: string | null;
    saved_at: string;
    routine_template: { name: string } | { name: string }[] | null;
  }[]) {
    const routineTemplate = Array.isArray(saved.routine_template)
      ? saved.routine_template[0] ?? null
      : saved.routine_template;

    entries.push({
      kind: "rutina_guardada",
      action: "Rutina guardada",
      detail: saved.custom_name?.trim() || routineTemplate?.name || "Rutina",
      at: saved.saved_at,
    });
  }

  return entries
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, limit);
}
