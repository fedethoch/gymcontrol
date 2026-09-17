import type { CSSProperties } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { OtpLoginFlow } from "@/app/auth/login/OtpLoginFlow";
import { EmailLoginSheet } from "@/app/components/auth/EmailLoginSheet";
import { GoogleButton } from "@/app/components/auth/GoogleButton";
import { LoginNotice } from "@/app/components/auth/LoginNotice";
import { LoginWelcome } from "@/app/components/auth/LoginWelcome";
import { getOptionalAuthContext } from "@/app/lib/auth";
import { LOGIN_STATUS_COPY, resolveLoginNotice } from "@/app/lib/auth-otp";
import { SectionEyebrow } from "@/app/components/ui/SectionEyebrow";
import { StatusToast } from "@/app/components/shared/StatusToast";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    reason?: string;
    status?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getOptionalAuthContext();

  if (auth) {
    redirect(auth.profile.role === "admin" ? "/admin" : "/");
  }

  const params = await searchParams;
  const statusMessage = params.status ? (LOGIN_STATUS_COPY[params.status] ?? null) : null;
  const notice = resolveLoginNotice(params);
  const email = params.email ?? "";

  return (
    <>
      <StatusToast message={statusMessage} clearParams={["status"]} />

      {/* Mobile: portada + sheet de acceso (DESIGN.md §17) */}
      <div className="lg:hidden">
        <LoginWelcome notice={notice ? <LoginNotice notice={notice} /> : null}>
          <GoogleButton />
          <EmailLoginSheet initialEmail={email} />
        </LoginWelcome>
      </div>

      {/* Desktop: card centrada */}
      <div
        className="hidden min-h-[100dvh] place-items-center bg-[var(--workspace)] px-6 py-10 lg:grid"
        style={
          {
            paddingTop: "max(2.5rem, env(safe-area-inset-top))",
            paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          } as CSSProperties
        }
      >
        <div className="grid w-full max-w-[400px] gap-8">
          {/* Brand + heading */}
          <div className="grid justify-items-center gap-5 text-center">
            <span className="grid size-16 place-items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <Image
                src="/logo/logo.png"
                alt="GymControl"
                width={64}
                height={64}
                className="size-full object-contain p-2 brightness-0 invert"
                priority
              />
            </span>
            <div className="grid gap-2">
              <SectionEyebrow>Bienvenido de vuelta</SectionEyebrow>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] text-white">
                Iniciar sesión
              </h1>
              <p className="mx-auto max-w-[300px] text-sm leading-6 text-[var(--foreground-muted)]">
                Te mandamos un código a tu email para entrar sin contraseña.
              </p>
            </div>
          </div>

          {notice ? <LoginNotice notice={notice} /> : null}

          <OtpLoginFlow initialEmail={email} />

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            o continuá con
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <GoogleButton tone="outline" />
        </div>
      </div>
    </>
  );
}
