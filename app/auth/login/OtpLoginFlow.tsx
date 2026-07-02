"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CircleCheck, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { InputOtp } from "@/app/components/ui/InputOtp";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { fadeUp, motion } from "@/app/components/ui/motion";
import { isValidEmail, normalizeEmail, normalizeOtpToken } from "@/app/lib/auth-input";

const INPUT_WITH_ICON_CLASS = "pl-10";

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
  const [busyState, setBusyState] = useState<BusyState>(null);
  const [verified, setVerified] = useState(false);

  async function requestOtp(mode: "request" | "resend") {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      toast.error(requestErrorCopy["missing-email"]);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      toast.error(requestErrorCopy["invalid-email"]);
      return;
    }

    setBusyState(mode);

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
        toast.error(requestErrorCopy[payload?.error ?? "otp-request-failed"]);
        return;
      }

      setEmail(payload?.email ?? normalizedEmail);
      setStep("token");
      setToken("");
      toast.success(
        mode === "resend"
          ? "Codigo reenviado. Revisa tu email."
          : "Codigo enviado. Revisa tu email.",
      );
    } catch {
      toast.error(requestErrorCopy["otp-request-failed"]);
    } finally {
      setBusyState(null);
    }
  }

  async function verifyOtp() {
    const normalizedEmail = normalizeEmail(email);
    const normalizedToken = normalizeOtpToken(token);

    if (!normalizedEmail) {
      toast.error(verifyErrorCopy["missing-email"]);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      toast.error(verifyErrorCopy["invalid-email"]);
      return;
    }

    if (!normalizedToken) {
      toast.error(verifyErrorCopy["missing-token"]);
      return;
    }

    setBusyState("verify");

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
        toast.error(verifyErrorCopy[payload?.error ?? "otp-verify-failed"]);
        return;
      }

      toast.success("Sesion iniciada. Redirigiendo...");
      const target = payload.redirectTo;
      setVerified(true);
      window.setTimeout(() => {
        window.location.assign(target);
      }, 550);
    } catch {
      toast.error(verifyErrorCopy["otp-verify-failed"]);
    } finally {
      setBusyState(null);
    }
  }

  return (
    <div className="grid gap-5">
      <AnimatePresence mode="wait" initial={false}>
        {step === "email" ? (
          <motion.form
            key="email"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void requestOtp("request");
            }}
          >
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--foreground-muted)]">
            Email
            <span className="relative flex items-center">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3 size-4 text-[var(--foreground-muted)]"
              />
              <Input
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="tu@email.com"
                type="email"
                autoComplete="email"
                required
                className={INPUT_WITH_ICON_CLASS}
              />
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={busyState !== null}>
            {busyState === "request" ? <LoadingDots /> : null}
            {busyState === "request" ? "Enviando codigo" : "Enviar codigo"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          </motion.form>
        ) : (
          <motion.form
            key="token"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyOtp();
            }}
          >
          <button
            type="button"
            disabled={busyState !== null || verified}
            onClick={() => {
              setStep("email");
              setToken("");
            }}
            className="-ml-2 flex min-h-[44px] w-fit items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[var(--foreground-muted)] outline-none transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:active:scale-100"
            aria-label="Volver a ingresar email"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Volver
          </button>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
              Codigo enviado a
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{normalizeEmail(email)}</p>
          </div>

          <label className="grid gap-2 text-xs font-semibold text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1.5">
              <KeyRound aria-hidden="true" className="size-4 text-[var(--foreground-muted)]" />
              Codigo de 6 digitos
            </span>
            <InputOtp
              value={token}
              onChange={(next) => setToken(next.replace(/\D/g, "").slice(0, 6))}
              disabled={busyState !== null || verified}
              success={verified}
              autoFocus
              onComplete={() => void verifyOtp()}
              aria-label="Codigo de 6 digitos"
            />
          </label>

          {verified ? (
            <div
              role="status"
              aria-live="polite"
              className="motion-pop-in flex items-center justify-center gap-2 rounded-xl border border-[var(--success)] bg-[var(--card-alt)] py-3 text-sm font-semibold text-[var(--success)]"
            >
              <CircleCheck aria-hidden="true" className="size-4" />
              Codigo verificado
            </div>
          ) : (
            <>
              <Button type="submit" className="w-full" disabled={busyState !== null}>
                {busyState === "verify" ? <LoadingDots /> : null}
                {busyState === "verify" ? "Verificando codigo" : "Verificar codigo"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>

              <button
                type="button"
                disabled={busyState !== null}
                onClick={() => {
                  void requestOtp("resend");
                }}
                className="mx-auto flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[var(--foreground-muted)] outline-none transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:active:scale-100"
              >
                {busyState === "resend" ? <LoadingDots /> : null}
                {busyState === "resend" ? "Reenviando codigo" : "Reenviar codigo"}
              </button>
            </>
          )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
