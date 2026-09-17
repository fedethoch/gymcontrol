import { isValidEmail, normalizeEmail } from "@/app/lib/auth-input";

/** Acceso por código (DESIGN.md §17): textos, validación y pedidos a /api/auth. */

export const OTP_LENGTH = 6;
/** Espera entre envíos; Supabase rechaza pedidos más seguidos para el mismo email. */
export const RESEND_COOLDOWN_SECONDS = 60;
export const REDIRECT_DELAY_MS = 550;

export const EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com"] as const;

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export type OtpErrorField = "email" | "token" | "account";

export type OtpError = {
  code: string;
  field: OtpErrorField;
  message: string;
};

const OTP_ERRORS: Record<string, Omit<OtpError, "code">> = {
  "missing-email": { field: "email", message: "Escribí tu email." },
  "invalid-email": { field: "email", message: "Revisá el email: no tiene un formato válido." },
  "otp-rate-limited": {
    field: "email",
    message: "Ya te mandamos un código hace poco. Esperá la cuenta para pedir otro.",
  },
  "otp-request-failed": { field: "email", message: "No pudimos mandar el código. Probá de nuevo." },
  "missing-token": { field: "token", message: "Escribí los 6 dígitos del código." },
  "invalid-token-format": { field: "token", message: "El código tiene 6 dígitos." },
  "invalid-or-expired-otp": {
    field: "token",
    message: "El código no coincide o venció. Revisalo o pedí otro.",
  },
  "otp-verify-failed": { field: "token", message: "No pudimos verificar el código. Probá de nuevo." },
  "missing-user": { field: "account", message: "Probá de nuevo en un rato. Si sigue pasando, escribinos." },
  "missing-profile": { field: "account", message: "Probá de nuevo en un rato. Si sigue pasando, escribinos." },
  offline: { field: "email", message: "Sin conexión. Conectate para recibir el código." },
};

export function otpError(code: string, fallback: "otp-request-failed" | "otp-verify-failed"): OtpError {
  const known = OTP_ERRORS[code];
  return known ? { code, ...known } : { code: fallback, ...OTP_ERRORS[fallback] };
}

/** Avisos que llegan por la URL (`?reason=`, `?error=`). */
export type LoginNotice = { tone: "info" | "danger"; title: string; body: string };

const LOGIN_NOTICES: Record<string, LoginNotice> = {
  "auth-required": {
    tone: "info",
    title: "Iniciá sesión para seguir",
    body: "Esa pantalla necesita tu cuenta.",
  },
  "google-provider-failed": {
    tone: "danger",
    title: "Google no está disponible ahora",
    body: "Entrá con tu email mientras tanto.",
  },
  "google-oauth-cancelled": {
    tone: "danger",
    title: "Cancelaste el acceso con Google",
    body: "Probá de nuevo o entrá con tu email.",
  },
  "google-oauth-failed": {
    tone: "danger",
    title: "No se pudo entrar con Google",
    body: "Probá de nuevo o entrá con tu email.",
  },
  "missing-user": {
    tone: "danger",
    title: "No pudimos abrir tu cuenta",
    body: "Probá de nuevo en un rato. Si sigue pasando, escribinos.",
  },
  "missing-profile": {
    tone: "danger",
    title: "No pudimos abrir tu cuenta",
    body: "Probá de nuevo en un rato. Si sigue pasando, escribinos.",
  },
};

/** El error tiene prioridad sobre el motivo. Códigos desconocidos no muestran nada. */
export function resolveLoginNotice(params: { error?: string; reason?: string }): LoginNotice | null {
  return (params.error && LOGIN_NOTICES[params.error]) || (params.reason && LOGIN_NOTICES[params.reason]) || null;
}

export const LOGIN_STATUS_COPY: Record<string, string> = {
  "signed-out": "Cerraste sesión.",
};

/** Motivo concreto de un email inválido, o `null` si es válido. */
export function describeEmailProblem(value: string): string | null {
  const email = normalizeEmail(value);

  if (!email) {
    return "Escribí tu email.";
  }

  if (isValidEmail(email)) {
    return null;
  }

  const at = email.indexOf("@");

  if (at === -1) {
    return "Falta la “@”.";
  }

  if (at === 0) {
    return "Falta lo que va antes de la “@”.";
  }

  const domain = email.slice(at + 1);

  if (!domain) {
    return "Falta lo que va después de la “@” (por ejemplo, gmail.com).";
  }

  if (!domain.includes(".") || domain.endsWith(".")) {
    return "Falta el final del email (por ejemplo, .com).";
  }

  return "Revisá el email: no tiene un formato válido.";
}

/**
 * Dominios para completar mientras se escribe: ninguno sin texto antes de la "@" y, después de la "@",
 * solo los que empiezan con lo escrito (sin repetir el que ya está completo).
 */
export function suggestEmailDomains(value: string): string[] {
  const text = value.trim().toLowerCase();
  const at = text.indexOf("@");
  const local = at === -1 ? text : text.slice(0, at);

  if (!local || /\s/.test(local)) {
    return [];
  }

  if (at === -1) {
    return [...EMAIL_DOMAINS];
  }

  const typed = text.slice(at + 1);
  return EMAIL_DOMAINS.filter((domain) => domain.startsWith(typed) && domain !== typed);
}

export function applyEmailDomain(value: string, domain: string) {
  const text = value.trim();
  const at = text.indexOf("@");
  return `${at === -1 ? text : text.slice(0, at)}@${domain}`;
}

export function isGmailAddress(email: string) {
  const normalized = normalizeEmail(email);
  return GMAIL_DOMAINS.has(normalized.slice(normalized.lastIndexOf("@") + 1));
}

/** `62` → `"1:02"`. */
export function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

type OtpResult<T> = ({ ok: true } & T) | { ok: false; error: OtpError };

async function postJson(path: string, body: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as Record<string, string> | null;
  return { ok: response.ok, payload };
}

export async function requestOtp(email: string): Promise<OtpResult<{ email: string }>> {
  try {
    const { ok, payload } = await postJson("/api/auth/request-otp", { email });

    if (!ok) {
      return { ok: false, error: otpError(payload?.error ?? "", "otp-request-failed") };
    }

    return { ok: true, email: payload?.email ?? email };
  } catch {
    return { ok: false, error: otpError("", "otp-request-failed") };
  }
}

export async function verifyOtp(email: string, token: string): Promise<OtpResult<{ redirectTo: string }>> {
  try {
    const { ok, payload } = await postJson("/api/auth/verify-otp", { email, token });

    if (!ok || !payload?.redirectTo) {
      return { ok: false, error: otpError(payload?.error ?? "", "otp-verify-failed") };
    }

    return { ok: true, redirectTo: payload.redirectTo };
  } catch {
    return { ok: false, error: otpError("", "otp-verify-failed") };
  }
}
