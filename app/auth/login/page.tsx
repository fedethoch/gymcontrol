import { redirect } from "next/navigation";

import { OtpLoginFlow } from "@/app/auth/login/OtpLoginFlow";
import { getOptionalAuthContext } from "@/app/lib/auth";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card";
import { SectionEyebrow } from "@/app/components/ui/SectionEyebrow";

const accessNotes = [
  "El acceso principal usa OTP por email de 6 digitos con autoregistro abierto.",
  "Google OAuth queda visible como alternativa y usa callback SSR solo para ese flujo.",
  "El profile de aplicacion sigue resolviendo rol, redirect final y guards.",
];

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
    <section className="page-frame">
      <div className="grid min-h-[34rem] overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] xl:grid-cols-[1.05fr_0.95fr]">
        <div className="fitness-photo relative hidden border-r border-[var(--border)] p-8 xl:flex xl:flex-col xl:justify-center">
          <div className="max-w-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)] font-display text-base font-bold text-[var(--accent-foreground)]">
                GC
              </span>
              <div>
                <p className="font-display text-2xl font-semibold tracking-[-0.06em] text-white">
                  GymControl
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  mejora cada dia
                </p>
              </div>
            </div>
            <p className="text-sm leading-7 text-[#d7dbe6]">
              Acceso dual, directo y alineado con el shell operativo. El login
              cambia de superficie, pero el rol sigue resolviendose en
              `profiles.type_rol`.
            </p>
            <div className="mt-8 grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7c1d9]">
                  Principal
                </p>
                <p className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-white">
                  Codigo OTP de 6 digitos
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d7dbe6]">
                  Envia el codigo, verifica y deja la sesion SSR lista sin
                  depender del callback de email.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7c1d9]">
                  Alternativa
                </p>
                <p className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-white">
                  Google OAuth
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d7dbe6]">
                  Mantiene el callback SSR y converge al mismo usuario y
                  profile cuando el email coincide.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid place-items-center bg-[#0f141d] p-4 sm:p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <SectionEyebrow>Acceso</SectionEyebrow>
              <CardTitle className="mt-2 text-2xl">Iniciar sesion</CardTitle>
              <CardDescription>
                Usa un codigo por email o entra con Google.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                {reasonMessage ? <Badge variant="outline">{reasonMessage}</Badge> : null}
                {statusMessage ? <Badge variant="success">{statusMessage}</Badge> : null}
                {errorMessage ? <Badge variant="accent">{errorMessage}</Badge> : null}
              </div>

              <OtpLoginFlow initialEmail={email} />

              <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b94a8]">
                    Opcion alternativa
                  </p>
                  <p className="mt-2 font-display text-lg font-semibold tracking-[-0.04em] text-white">
                    Continuar con Google
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    Si Google no esta configurado, volveras a esta pantalla con
                    un error explicito.
                  </p>
                </div>

                <form action="/auth/google/start" method="post">
                  <Button type="submit" variant="outline" className="w-full">
                    Entrar con Google
                  </Button>
                </form>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="neutral">Autoregistro activo</Badge>
                <Badge variant="success">Supabase Auth</Badge>
                <Badge variant="outline">Redirect por rol</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {accessNotes.map((note) => (
          <Card key={note} className="bg-[var(--card-alt)]">
            <CardContent className="p-4 text-sm leading-6 text-[var(--foreground-muted)]">
              {note}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
