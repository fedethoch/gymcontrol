"use client";

import { useState } from "react";

import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { isValidEmail, normalizeEmail, normalizeOtpToken } from "@/app/lib/auth-input";

const requestErrorCopy: Record<string, string> = {
  "missing-email": "Ingresa un email valido.",
  "invalid-email": "El email no tiene un formato valido.",
  "otp-rate-limited": "Espera un minuto antes de pedir otro codigo.",
  "otp-request-failed": "No se pudo enviar el codigo. Intenta nuevamente.",
};

const verifyErrorCopy: Record<string, string> = {
  "missing-email": "Ingresa un email valido.",
  "invalid-email": "El email no tiene un formato valido.",
  "missing-token": "Ingresa el codigo de 6 digitos.",
  "invalid-token-format": "El codigo debe tener 6 digitos.",
  "invalid-or-expired-otp": "El codigo es invalido o vencio.",
  "missing-user": "La sesion no quedo asociada a un usuario resoluble.",
  "missing-profile": "La cuenta se autentico pero no resolvio su profile.",
  "otp-verify-failed": "No se pudo verificar el codigo. Intenta nuevamente.",
};

type OtpLoginFlowProps = {
  initialEmail: string;
};

type BusyState = "request" | "resend" | "verify" | null;

export function OtpLoginFlow({ initialEmail }: OtpLoginFlowProps) {
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "token">("email");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyState, setBusyState] = useState<BusyState>(null);

  async function requestOtp(mode: "request" | "resend") {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setErrorMessage(requestErrorCopy["missing-email"]);
      setStatusMessage(null);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(requestErrorCopy["invalid-email"]);
      setStatusMessage(null);
      return;
    }

    setBusyState(mode);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; email?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(requestErrorCopy[payload?.error ?? "otp-request-failed"]);
        return;
      }

      setEmail(payload?.email ?? normalizedEmail);
      setStep("token");
      setToken("");
      setStatusMessage(
        mode === "resend"
          ? "Codigo reenviado. Revisa tu email."
          : "Codigo enviado. Revisa tu email.",
      );
    } catch {
      setErrorMessage(requestErrorCopy["otp-request-failed"]);
    } finally {
      setBusyState(null);
    }
  }

  async function verifyOtp() {
    const normalizedEmail = normalizeEmail(email);
    const normalizedToken = normalizeOtpToken(token);

    if (!normalizedEmail) {
      setErrorMessage(verifyErrorCopy["missing-email"]);
      setStatusMessage(null);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(verifyErrorCopy["invalid-email"]);
      setStatusMessage(null);
      return;
    }

    if (!normalizedToken) {
      setErrorMessage(verifyErrorCopy["missing-token"]);
      setStatusMessage(null);
      return;
    }

    setBusyState("verify");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          token: normalizedToken,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.redirectTo) {
        setErrorMessage(verifyErrorCopy[payload?.error ?? "otp-verify-failed"]);
        return;
      }

      setStatusMessage("Sesion iniciada. Redirigiendo...");
      window.location.assign(payload.redirectTo);
    } catch {
      setErrorMessage(verifyErrorCopy["otp-verify-failed"]);
    } finally {
      setBusyState(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">OTP por email</Badge>
        <Badge variant="outline">
          {step === "email" ? "Paso 1: enviar codigo" : "Paso 2: verificar codigo"}
        </Badge>
      </div>

      {statusMessage ? <Badge variant="success">{statusMessage}</Badge> : null}
      {errorMessage ? <Badge variant="accent">{errorMessage}</Badge> : null}

      {step === "email" ? (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void requestOtp("request");
          }}
        >
          <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
            Email
            <Input
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="tu@email.com"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <Button type="submit" className="w-full" disabled={busyState !== null}>
            {busyState === "request" ? "Enviando codigo..." : "Enviar codigo"}
          </Button>
        </form>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void verifyOtp();
          }}
        >
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b94a8]">
              Email actual
            </p>
            <p className="mt-1 text-sm text-white">{normalizeEmail(email)}</p>
          </div>

          <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
            Codigo de 6 digitos
            <Input
              value={token}
              onChange={(event) => setToken(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              className="text-center font-mono text-lg tracking-[0.35em]"
            />
          </label>

          <Button type="submit" className="w-full" disabled={busyState !== null}>
            {busyState === "verify" ? "Verificando codigo..." : "Verificar codigo"}
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={busyState !== null}
              onClick={() => {
                void requestOtp("resend");
              }}
            >
              {busyState === "resend" ? "Reenviando..." : "Reenviar codigo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={busyState !== null}
              onClick={() => {
                setStep("email");
                setToken("");
                setStatusMessage(null);
                setErrorMessage(null);
              }}
            >
              Cambiar email
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
