import "server-only";

import { z } from "zod";

// Apple rechaza con 403 BadJwtToken un sujeto que no sea un mailto: o https: válido (RFC 8292).
const vapidEnvSchema = z.object({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(80),
  VAPID_PRIVATE_KEY: z.string().min(40),
  VAPID_SUBJECT: z.string().regex(/^(mailto:[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+|https:\/\/[^\s/]+\S*)$/),
});

export type VapidConfig = { subject: string; publicKey: string; privateKey: string };

export function getVapidConfig(): VapidConfig {
  const parsed = vapidEnvSchema.safeParse({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  });

  if (!parsed.success) {
    throw new Error(
      "Faltan o son inválidas las variables de avisos. Revisá .env.example: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT (mailto: o https:).",
    );
  }

  return {
    subject: parsed.data.VAPID_SUBJECT,
    publicKey: parsed.data.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKey: parsed.data.VAPID_PRIVATE_KEY,
  };
}

/** Secreto con el que el cron de Supabase llama a /api/push/cron. `null` si no está configurado. */
export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();

  return secret && secret.length >= 32 ? secret : null;
}
