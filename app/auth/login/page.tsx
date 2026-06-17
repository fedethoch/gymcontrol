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

const reasonCopy: Record<string, string> = {
  "auth-required": "Necesitas iniciar sesion para entrar a esa seccion.",
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
    reason?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getOptionalAuthContext();

  if (auth) {
    redirect(auth.profile.role === "admin" ? "/admin" : "/dashboard");
  }

  const params = await searchParams;
  const statusMessage = params.status ? statusCopy[params.status] : null;
  const reasonMessage = params.reason ? reasonCopy[params.reason] : null;
  const errorMessage = params.error ? errorCopy[params.error] : null;
  const email = params.email ?? "";

  return (
    <div className="grid min-h-[100svh] w-full lg:grid-cols-[1fr_minmax(420px,520px)]">
      {/* Left panel: brand */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(124,58,237,0.55), transparent 45%), radial-gradient(circle at 82% 88%, rgba(91,33,182,0.6), transparent 50%), linear-gradient(165deg, rgba(21,17,38,0.85) 0%, rgba(12,15,26,0.9) 52%, rgba(5,7,11,0.95) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center overflow-hidden rounded-2xl">
            <Image
              src="/logo/logo.png"
              alt="GymControl"
              width={56}
              height={56}
              className="size-full object-contain p-1.5"
              priority
              unoptimized
            />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold tracking-[-0.06em] text-white">
              GymControl
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">mejora cada dia</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-5xl font-semibold leading-[1.1] tracking-[-0.05em] text-white sm:text-6xl">
            Tu mejor
            <br />
            version empieza
            <br />
            <span className="text-[var(--accent-bright)]">hoy.</span>
          </h1>
        </div>
      </div>

      {/* Right panel: login form */}
      <div className="grid place-items-center bg-[var(--workspace)] p-6 sm:p-10">
        <div className="grid w-full max-w-[380px] gap-6">
          <div>
            <SectionEyebrow>Bienvenido de vuelta</SectionEyebrow>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
              Iniciar sesion
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Ingresa tus credenciales para entrar a tu cuenta.
            </p>
          </div>

          <StatusToast message={reasonMessage} isError clearParams={["reason"]} />
          <StatusToast message={statusMessage} clearParams={["status"]} />
          <StatusToast message={errorMessage} isError clearParams={["error"]} />

          <OtpLoginFlow initialEmail={email} />

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#6e7788]">
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
    </div>
  );
}
