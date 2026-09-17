"use client";

import { useCallback, useEffect, useState } from "react";

import { useOnlineStatus } from "@/app/components/configuracion/use-online-status";
import { normalizeEmail } from "@/app/lib/auth-input";
import {
  OTP_LENGTH,
  REDIRECT_DELAY_MS,
  RESEND_COOLDOWN_SECONDS,
  describeEmailProblem,
  otpError,
  requestOtp,
  verifyOtp,
  type OtpError,
} from "@/app/lib/auth-otp";

export type OtpStep = "email" | "token";
export type OtpBusy = "request" | "resend" | "verify" | null;

type OtpFlowOptions = {
  initialEmail: string;
  /** Cada envío correcto (el sheet avisa solo el reenvío; desktop, los dos). */
  onSent?: (mode: "request" | "resend") => void;
  /** Desktop muestra los errores en toast; mobile los lee de `error`. */
  onError?: (error: OtpError) => void;
};

/** Último pedido de código: a qué email, si salió y desde cuándo corre la espera. */
type LastSend = { email: string; ok: boolean; until: number };

/** Estado del acceso por código (DESIGN.md §17), compartido por el sheet mobile y la card de desktop. */
export function useOtpFlow({ initialEmail, onSent, onError }: OtpFlowOptions) {
  const online = useOnlineStatus();
  const [email, setEmailValue] = useState(initialEmail);
  const [token, setTokenValue] = useState("");
  const [step, setStep] = useState<OtpStep>("email");
  const [busy, setBusy] = useState<OtpBusy>(null);
  const [error, setError] = useState<OtpError | null>(null);
  // Cuenta los errores para repetir el temblor aunque el mensaje sea el mismo.
  const [errorCount, setErrorCount] = useState(0);
  const [verified, setVerified] = useState(false);
  const [lastSend, setLastSend] = useState<LastSend | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const waiting = lastSend !== null && now < lastSend.until;

  useEffect(() => {
    if (!lastSend || Date.now() >= lastSend.until) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lastSend.until) {
        window.clearInterval(timer);
        setError((previous) => (previous?.code === "otp-rate-limited" ? null : previous));
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [lastSend]);

  /** Segundos de espera para reenviar al email escrito (0 si es otro email o ya pasó). */
  const cooldownLeft =
    waiting && lastSend.email === normalizeEmail(email) ? Math.max(0, (lastSend.until - now) / 1000) : 0;

  const fail = useCallback(
    (next: OtpError) => {
      setError(next);
      setErrorCount((count) => count + 1);
      onError?.(next);
    },
    [onError],
  );

  function markSent(target: string, ok: boolean) {
    const current = Date.now();
    setNow(current);
    setLastSend({ email: target, ok, until: current + RESEND_COOLDOWN_SECONDS * 1000 });
  }

  function setEmail(value: string) {
    setEmailValue(value);
    if (error?.field === "email") {
      setError(null);
    }
  }

  function setToken(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    // Tras un código incorrecto, borrar empieza de cero.
    if (error?.field === "token") {
      setError(null);
      setTokenValue(digits.length < token.length ? "" : digits);
      return;
    }
    setTokenValue(digits);
  }

  async function request(mode: "request" | "resend" = "request") {
    if (busy || verified) {
      return;
    }

    if (!online) {
      fail(otpError("offline", "otp-request-failed"));
      return;
    }

    const problem = describeEmailProblem(email);
    if (problem) {
      fail({ code: "invalid-email", field: "email", message: problem });
      return;
    }

    const target = normalizeEmail(email);

    if (cooldownLeft > 0) {
      // Mismo email durante la espera: si el código ya salió, se vuelve a escribirlo.
      if (mode === "request" && lastSend?.ok) {
        setEmailValue(target);
        setError(null);
        setStep("token");
      }
      return;
    }

    setBusy(mode);
    setError(null);
    const result = await requestOtp(target);
    setBusy(null);

    if (!result.ok) {
      if (result.error.code === "otp-rate-limited") {
        markSent(target, false);
      }
      fail(result.error);
      return;
    }

    markSent(result.email, true);
    setEmailValue(result.email);
    setTokenValue("");
    setStep("token");
    onSent?.(mode);
  }

  async function verify(value = token) {
    if (busy || verified) {
      return;
    }

    if (value.length !== OTP_LENGTH) {
      fail(otpError("missing-token", "otp-verify-failed"));
      return;
    }

    setBusy("verify");
    setError(null);
    const result = await verifyOtp(normalizeEmail(email), value);

    if (!result.ok) {
      setBusy(null);
      fail(result.error);
      return;
    }

    setBusy(null);
    setVerified(true);
    window.setTimeout(() => window.location.assign(result.redirectTo), REDIRECT_DELAY_MS);
  }

  /** Vuelve al email; la espera del último envío sigue corriendo. */
  function editEmail() {
    if (busy || verified) {
      return;
    }
    setStep("email");
    setTokenValue("");
    setError(null);
  }

  return {
    email,
    setEmail,
    token,
    setToken,
    step,
    busy,
    error,
    errorCount,
    verified,
    online,
    cooldownLeft,
    request,
    verify,
    editEmail,
  };
}
