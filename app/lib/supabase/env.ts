import { z } from "zod";

const supabasePublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const parsedEnv = supabasePublicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsedEnv.success) {
    throw new Error(
      "Faltan variables de entorno de Supabase. Revisa .env.example y define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    url: parsedEnv.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsedEnv.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
