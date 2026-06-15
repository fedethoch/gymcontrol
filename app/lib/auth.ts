import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type AppRole = "admin" | "user";

export type AuthContext = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    id: string;
    userId: string;
    role: AppRole;
    displayName: string | null;
  };
};

type ProfileRecord = {
  id: string;
  user_id: string;
  type_rol: string;
  display_name: string | null;
};

function resolveRole(typeRol: string): AppRole {
  return typeRol === "admin" ? "admin" : "user";
}

function toAuthContext(user: { id: string; email?: string | null }, profile: ProfileRecord) {
  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile: {
      id: profile.id,
      userId: profile.user_id,
      role: resolveRole(profile.type_rol),
      displayName: profile.display_name,
    },
  } satisfies AuthContext;
}

async function loadProfileRecord(supabase: SupabaseClient, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, user_id, type_rol, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  return profile satisfies ProfileRecord;
}

export function getPostLoginRedirectPath(role: AppRole) {
  return role === "admin" ? "/admin" : "/";
}

export async function resolveAuthContextForUserId(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
) {
  const profile = await loadProfileRecord(supabase, user.id);

  if (!profile) {
    return null;
  }

  return toAuthContext(user, profile);
}

export async function resolvePostLoginRedirectForUserId(
  supabase: SupabaseClient,
  userId: string,
) {
  const profile = await loadProfileRecord(supabase, userId);

  if (!profile) {
    return null;
  }

  return getPostLoginRedirectPath(resolveRole(profile.type_rol));
}

async function loadAuthContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return resolveAuthContextForUserId(supabase, user);
}

export const getOptionalAuthContext = cache(loadAuthContext);

export async function requireUser() {
  const auth = await getOptionalAuthContext();

  if (!auth) {
    redirect("/auth/login?reason=auth-required");
  }

  return auth;
}

export async function requireAdmin() {
  const auth = await requireUser();

  if (auth.profile.role !== "admin") {
    redirect("/dashboard?reason=admin-required");
  }

  return auth;
}
