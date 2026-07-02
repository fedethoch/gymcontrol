import type { CSSProperties } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { OtpLoginFlow } from "@/app/auth/login/OtpLoginFlow";
import { getOptionalAuthContext } from "@/app/lib/auth";
import { Button } from "@/app/components/ui/Button";
import { SectionEyebrow } from "@/app/components/ui/SectionEyebrow";
import { StatusToast } from "@/app/components/shared/StatusToast";

const statusCopy: Record<string, string> = {
  "signed-out": "La sesion se cerro correctamente.",
};

const errorCopy: Record<string, string> = {
  "missing-user": "La sesion se creo sin usuario resoluble. Reintenta el acceso.",
  "missing-profile":
    "No se encontro el profile asociado al usuario autenticado.",
  "google-provider-failed":
    "Google no esta habilitado o fallo al iniciar el provider.",
  "google-oauth-cancelled":
    "El acceso con Google fue cancelado antes de completar la sesion.",
  "google-oauth-failed":
    "No se pudo completar el acceso con Google. Intenta nuevamente.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
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
  const statusMessage = params.status ? statusCopy[params.status] : null;
  const errorMessage = params.error ? errorCopy[params.error] : null;
  const email = params.email ?? "";

  return (
    <div
      className="grid min-h-[100dvh] place-items-center bg-[var(--workspace)] px-6 py-10"
      style={
        {
          "--accent": "#10b981",
          "--accent-strong": "#34d399",
          "--accent-bright": "#6ee7b7",
          "--accent-foreground": "#04150d",
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
              className="size-full object-contain p-2"
              priority
              unoptimized
            />
          </span>
          <div className="grid gap-2">
            <SectionEyebrow>Bienvenido de vuelta</SectionEyebrow>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] text-white">
              Iniciar sesion
            </h1>
            <p className="mx-auto max-w-[300px] text-sm leading-6 text-[var(--foreground-muted)]">
              Te enviamos un codigo a tu email para entrar sin contrasena.
            </p>
          </div>
        </div>

        <StatusToast message={statusMessage} clearParams={["status"]} />
        <StatusToast message={errorMessage} isError clearParams={["error"]} />

        <OtpLoginFlow initialEmail={email} />

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          o continua con
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <form action="/auth/google/start" method="post">
          <Button type="submit" variant="outline" className="w-full">
            Entrar con Google
          </Button>
        </form>
      </div>
    </div>
  );
}
