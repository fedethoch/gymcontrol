"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, useAnimate, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, CircleAlert, CircleCheck, ExternalLink, Mail, WifiOff, X } from "lucide-react";
import { toast } from "sonner";

import { LoginNotice } from "@/app/components/auth/LoginNotice";
import { useOtpFlow } from "@/app/components/auth/useOtpFlow";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import { InputOtp } from "@/app/components/ui/InputOtp";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { fadeUp, motion } from "@/app/components/ui/motion";
import {
  RESEND_COOLDOWN_SECONDS,
  applyEmailDomain,
  formatCountdown,
  isGmailAddress,
  suggestEmailDomains,
} from "@/app/lib/auth-otp";
import { cn } from "@/app/lib/utils";

const TITLE_CLASS =
  "font-display text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--foreground)]";
const PRIMARY_CLASS =
  "pressable flex h-14 w-full shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-[var(--accent)] font-display text-base font-semibold text-[var(--accent-foreground)] outline-none hover:bg-[var(--accent-strong)] focus-visible:shadow-[var(--focus-glow)] disabled:opacity-45 [&_svg]:size-5";
const ICON_BUTTON_CLASS =
  "pressable grid size-11 shrink-0 place-items-center rounded-full text-[var(--foreground)] outline-none hover:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)] disabled:opacity-40 [&_svg]:size-5";
const TEXT_ACTION_CLASS =
  "pressable inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-[var(--accent-bright)] outline-none hover:text-[var(--accent-strong)] focus-visible:shadow-[var(--focus-glow)] disabled:opacity-40";

const SHAKE = { x: [0, -8, 8, -5, 5, 0] };

function StatusLine({
  id,
  tone,
  icon,
  children,
}: {
  id?: string;
  tone: "danger" | "warning" | "success" | "muted";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p
      id={id}
      className={cn(
        "flex items-start gap-1.5 text-[13px] leading-snug [&_svg]:mt-px [&_svg]:size-4 [&_svg]:shrink-0",
        tone === "danger" && "text-[var(--danger)]",
        tone === "warning" && "text-[var(--warning)]",
        tone === "success" && "text-[var(--success)]",
        tone === "muted" && "text-[var(--foreground-muted)]",
      )}
    >
      {icon}
      <span>{children}</span>
    </p>
  );
}

function CooldownRing({ secondsLeft }: { secondsLeft: number }) {
  const circumference = 2 * Math.PI * 9;
  const offset = circumference * (1 - secondsLeft / RESEND_COOLDOWN_SECONDS);

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[22px] shrink-0 -rotate-90">
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
      />
    </svg>
  );
}

/** "Continuar con email" + sheet de dos pasos: email y código (DESIGN.md §17.2). */
export function EmailLoginSheet({ initialEmail }: { initialEmail: string }) {
  const [open, setOpen] = useState(false);
  const flow = useOtpFlow({
    initialEmail,
    onSent: (mode) => {
      if (mode === "resend") {
        toast.success("Te mandamos otro código.");
        // El botón se reemplaza por la cuenta regresiva: el foco vuelve al código.
        window.requestAnimationFrame(() => document.getElementById("login-code")?.focus({ preventScroll: true }));
      }
    },
  });
  const { busy, error, verified, cooldownLeft, online } = flow;
  const locked = busy !== null || verified;
  const stepNumber = flow.step === "email" ? 1 : 2;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [shakeScope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (flow.errorCount === 0 || !shakeScope.current) {
      return;
    }
    // El campo se deshabilita durante el pedido y pierde el foco: se devuelve para corregir sin tocar.
    shakeScope.current.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
    if (!reduceMotion) {
      void animate(shakeScope.current, SHAKE, { duration: 0.32 });
    }
  }, [flow.errorCount, reduceMotion, animate, shakeScope]);

  // Al verificar se cierra el teclado: la pantalla ya no pide nada.
  useEffect(() => {
    if (verified && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [verified]);

  const emailError = error?.field === "email" ? error : null;
  const rateLimited = emailError?.code === "otp-rate-limited" && cooldownLeft > 0;
  const tokenError = error?.field === "token" ? error : null;
  const accountError = error?.field === "account" ? error : null;
  const suggestions = busy ? [] : suggestEmailDomains(flow.email);

  return (
    <>
      <button ref={triggerRef} type="button" className={PRIMARY_CLASS} onClick={() => setOpen(true)}>
        <Mail aria-hidden="true" />
        Continuar con email
      </button>

      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next && locked) {
            return;
          }
          setOpen(next);
        }}
        dismissible={!locked}
        repositionInputs
      >
        <DrawerContent
          className="h-[92dvh] max-h-[92dvh] rounded-t-3xl"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (flow.step === "email") {
              emailRef.current?.focus({ preventScroll: true });
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus({ preventScroll: true });
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
            <div className="flex min-h-11 items-center gap-3">
              {flow.step === "token" ? (
                <button
                  type="button"
                  aria-label="Cambiar el email"
                  disabled={locked}
                  onClick={flow.editEmail}
                  className={cn(ICON_BUTTON_CLASS, "-ml-3")}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
              ) : null}
              <span className="text-[13px] font-medium tabular-nums text-[var(--foreground-muted)]">
                <span className="text-[var(--foreground)]">{stepNumber}</span> / 2
                <span className="sr-only"> pasos</span>
              </span>
              <div aria-hidden="true" className="grid flex-1 grid-cols-2 gap-1">
                {[1, 2].map((segment) => (
                  <span
                    key={segment}
                    className={cn(
                      "h-0.5 rounded-full transition-colors duration-300",
                      segment <= stepNumber ? "bg-[var(--foreground)]" : "bg-[var(--border-strong)]",
                    )}
                  />
                ))}
              </div>
              <DrawerClose aria-label="Cerrar" disabled={locked} className={cn(ICON_BUTTON_CLASS, "-mr-3")}>
                <X aria-hidden="true" />
              </DrawerClose>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {flow.step === "email" ? (
                <motion.form
                  key="email"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                  noValidate
                  className="flex flex-1 flex-col gap-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void flow.request("request");
                  }}
                >
                  <DrawerTitle className={TITLE_CLASS}>
                    <span className="text-[var(--foreground-muted)]">¿Con qué email</span>
                    <br />
                    entrás?
                  </DrawerTitle>
                  <DrawerDescription className="sr-only">
                    Te mandamos un código de 6 dígitos para entrar, sin contraseña.
                  </DrawerDescription>

                  <div className="grid gap-3">
                    <div ref={shakeScope}>
                      <label
                        htmlFor="login-email"
                        className={cn(
                          "flex h-[4.25rem] cursor-text flex-col justify-center gap-0.5 rounded-2xl border bg-[var(--card)] px-4 transition-[border-color,box-shadow] duration-200 focus-within:shadow-[var(--focus-glow)] motion-reduce:transition-none",
                          emailError && !rateLimited
                            ? "border-[var(--danger)]"
                            : "border-[var(--border-strong)] focus-within:border-[var(--accent)]",
                        )}
                      >
                        <span className="text-xs font-medium text-[var(--foreground-muted)]">Email</span>
                        <input
                          ref={emailRef}
                          id="login-email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          enterKeyHint="send"
                          placeholder="tu@email.com"
                          value={flow.email}
                          disabled={busy !== null}
                          onChange={(event) => flow.setEmail(event.currentTarget.value)}
                          aria-invalid={emailError && !rateLimited ? true : undefined}
                          aria-describedby={emailError || !online ? "login-email-status" : undefined}
                          className="w-full bg-transparent text-base font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-subtle)] disabled:opacity-60"
                        />
                      </label>
                    </div>

                    <div aria-live="polite">
                      {!online ? (
                        <StatusLine id="login-email-status" tone="warning" icon={<WifiOff aria-hidden="true" />}>
                          Sin conexión. Conectate para recibir el código.
                        </StatusLine>
                      ) : rateLimited ? (
                        <StatusLine id="login-email-status" tone="warning" icon={<CircleAlert aria-hidden="true" />}>
                          Ya te mandamos un código hace poco. Podés pedir otro en{" "}
                          <span className="tabular-nums">{formatCountdown(cooldownLeft)}</span>.
                        </StatusLine>
                      ) : emailError ? (
                        <StatusLine id="login-email-status" tone="danger" icon={<CircleAlert aria-hidden="true" />}>
                          {emailError.message}
                        </StatusLine>
                      ) : null}
                    </div>

                    {suggestions.length > 0 ? (
                      <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 [scrollbar-width:none]">
                        {suggestions.map((domain) => (
                          <button
                            key={domain}
                            type="button"
                            // Mantiene el foco (y el teclado) en el campo.
                            onPointerDown={(event) => event.preventDefault()}
                            onClick={() => {
                              flow.setEmail(applyEmailDomain(flow.email, domain));
                              emailRef.current?.focus({ preventScroll: true });
                            }}
                            className="pressable relative inline-flex h-9 shrink-0 items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--foreground)] outline-none after:absolute after:inset-x-0 after:-inset-y-1 hover:border-[var(--border-strong)] focus-visible:shadow-[var(--focus-glow)]"
                          >
                            @{domain}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1" />

                  <button type="submit" className={PRIMARY_CLASS} disabled={busy !== null || !online || rateLimited}>
                    {busy === "request" ? (
                      <>
                        <LoadingDots />
                        Enviando código
                      </>
                    ) : (
                      <>
                        Enviar código
                        <ArrowRight aria-hidden="true" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="token"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                  className="flex flex-1 flex-col gap-6"
                >
                  <DrawerTitle className={TITLE_CLASS}>
                    {verified ? (
                      <>
                        <span className="text-[var(--foreground-muted)]">Listo.</span>
                        <br />
                        Entrando a tu semana.
                      </>
                    ) : (
                      <>
                        <span className="text-[var(--foreground-muted)]">Revisá tu mail.</span>
                        <br />
                        Escribí el código.
                      </>
                    )}
                  </DrawerTitle>
                  <DrawerDescription className="sr-only">
                    Escribí el código de 6 dígitos que mandamos a {flow.email}.
                  </DrawerDescription>

                  <div className="flex min-h-[3.25rem] items-center justify-between gap-3 border-y border-[var(--border)] text-[15px]">
                    <span className="min-w-0 truncate text-[var(--foreground-muted)]">
                      {verified ? "Sesión de " : "Enviado a "}
                      <span className="font-medium text-[var(--foreground)]">{flow.email}</span>
                    </span>
                    {verified ? null : (
                      <button type="button" disabled={locked} onClick={flow.editEmail} className={TEXT_ACTION_CLASS}>
                        Cambiar
                      </button>
                    )}
                  </div>

                  {accountError ? (
                    <div className="grid gap-4">
                      <LoginNotice
                        notice={{ tone: "danger", title: "No pudimos abrir tu cuenta", body: accountError.message }}
                      />
                      <button
                        type="button"
                        onClick={flow.editEmail}
                        className="pressable flex h-14 w-full items-center justify-center rounded-[14px] border border-[var(--border-strong)] bg-[var(--card-alt)] font-display text-base font-semibold text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
                      >
                        Volver a empezar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4">
                        <div ref={shakeScope}>
                          <InputOtp
                            id="login-code"
                            variant="display"
                            value={flow.token}
                            onChange={flow.setToken}
                            onComplete={(value) => void flow.verify(value)}
                            disabled={busy === "verify"}
                            success={verified}
                            invalid={tokenError !== null}
                            autoFocus
                            aria-label="Código de 6 dígitos"
                            aria-describedby="login-code-status"
                          />
                        </div>
                        <div id="login-code-status" aria-live="polite" className="min-h-5">
                          {verified ? (
                            <StatusLine tone="success" icon={<CircleCheck aria-hidden="true" />}>
                              Código correcto
                            </StatusLine>
                          ) : busy === "verify" ? (
                            <StatusLine tone="muted" icon={<LoadingDots className="mt-1.5" />}>
                              Verificando…
                            </StatusLine>
                          ) : !online ? (
                            <StatusLine tone="warning" icon={<WifiOff aria-hidden="true" />}>
                              Sin conexión. Conectate para verificar el código.
                            </StatusLine>
                          ) : error && error.field !== "account" ? (
                            <StatusLine
                              tone={error.code === "otp-rate-limited" ? "warning" : "danger"}
                              icon={<CircleAlert aria-hidden="true" />}
                            >
                              {error.message}
                            </StatusLine>
                          ) : null}
                        </div>
                      </div>

                      {verified ? null : (
                        <div className="flex items-center justify-between gap-3">
                          {cooldownLeft > 0 ? (
                            <span className="flex min-h-11 items-center gap-2.5 text-sm text-[var(--foreground-muted)]">
                              <CooldownRing secondsLeft={cooldownLeft} />
                              <span>
                                Reenviar en{" "}
                                <span className="tabular-nums text-[var(--foreground)]">
                                  {formatCountdown(cooldownLeft)}
                                </span>
                              </span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy !== null || !online}
                              onClick={() => void flow.request("resend")}
                              className={TEXT_ACTION_CLASS}
                            >
                              {busy === "resend" ? (
                                <>
                                  <LoadingDots />
                                  Reenviando código
                                </>
                              ) : (
                                "Reenviar código"
                              )}
                            </button>
                          )}
                          {isGmailAddress(flow.email) ? (
                            <a
                              href="https://mail.google.com/mail/"
                              target="_blank"
                              rel="noreferrer"
                              className="pressable inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-4 text-[13px] font-semibold text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
                            >
                              Abrir Gmail
                              <ExternalLink aria-hidden="true" className="size-3.5" />
                            </a>
                          ) : null}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
