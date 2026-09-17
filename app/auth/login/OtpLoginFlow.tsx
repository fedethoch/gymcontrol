"use client";

import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CircleCheck, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

import { useOtpFlow } from "@/app/components/auth/useOtpFlow";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { InputOtp } from "@/app/components/ui/InputOtp";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { fadeUp, motion } from "@/app/components/ui/motion";
import { formatCountdown } from "@/app/lib/auth-otp";

const INPUT_WITH_ICON_CLASS = "pl-10";

type OtpLoginFlowProps = {
  initialEmail: string;
};

/** Card de acceso de desktop (≥1024). Mobile usa `EmailLoginSheet` (DESIGN.md §17). */
export function OtpLoginFlow({ initialEmail }: OtpLoginFlowProps) {
  const flow = useOtpFlow({
    initialEmail,
    onSent: (mode) =>
      toast.success(mode === "resend" ? "Te mandamos otro código. Revisá tu mail." : "Código enviado. Revisá tu mail."),
    onError: (error) => toast.error(error.message),
  });
  const { busy, verified, cooldownLeft } = flow;

  return (
    <div className="grid gap-5">
      <AnimatePresence mode="wait" initial={false}>
        {flow.step === "email" ? (
          <motion.form
            key="email"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
            className="grid gap-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void flow.request("request");
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
                value={flow.email}
                onChange={(event) => flow.setEmail(event.currentTarget.value)}
                placeholder="tu@email.com"
                type="email"
                autoComplete="email"
                required
                className={INPUT_WITH_ICON_CLASS}
              />
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={busy !== null || !flow.online}>
            {busy === "request" ? <LoadingDots /> : null}
            {busy === "request" ? "Enviando código" : "Enviar código"}
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
              void flow.verify();
            }}
          >
          <button
            type="button"
            disabled={busy !== null || verified}
            onClick={flow.editEmail}
            className="-ml-2 flex min-h-[44px] w-fit items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[var(--foreground-muted)] outline-none transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:active:scale-100"
            aria-label="Volver a ingresar email"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Volver
          </button>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
              Código enviado a
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{flow.email}</p>
          </div>

          <label className="grid gap-2 text-xs font-semibold text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1.5">
              <KeyRound aria-hidden="true" className="size-4 text-[var(--foreground-muted)]" />
              Código de 6 dígitos
            </span>
            <InputOtp
              value={flow.token}
              onChange={flow.setToken}
              disabled={busy !== null || verified}
              success={verified}
              autoFocus
              onComplete={(value) => void flow.verify(value)}
              aria-label="Código de 6 dígitos"
            />
          </label>

          {verified ? (
            <div
              role="status"
              aria-live="polite"
              className="motion-pop-in flex items-center justify-center gap-2 rounded-xl border border-[var(--success)] bg-[var(--card-alt)] py-3 text-sm font-semibold text-[var(--success)]"
            >
              <CircleCheck aria-hidden="true" className="size-4" />
              Código verificado
            </div>
          ) : (
            <>
              <Button type="submit" className="w-full" disabled={busy !== null}>
                {busy === "verify" ? <LoadingDots /> : null}
                {busy === "verify" ? "Verificando código" : "Verificar código"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>

              <button
                type="button"
                disabled={busy !== null || cooldownLeft > 0 || !flow.online}
                onClick={() => {
                  void flow.request("resend");
                }}
                className="mx-auto flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold tabular-nums text-[var(--foreground-muted)] outline-none transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:active:scale-100"
              >
                {busy === "resend" ? <LoadingDots /> : null}
                {busy === "resend"
                  ? "Reenviando código"
                  : cooldownLeft > 0
                    ? `Reenviar en ${formatCountdown(cooldownLeft)}`
                    : "Reenviar código"}
              </button>
            </>
          )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
