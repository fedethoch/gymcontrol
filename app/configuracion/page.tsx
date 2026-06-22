import { ConfiguracionClient } from "@/app/configuracion/ConfiguracionClient";
import { requireUser } from "@/app/lib/auth";
import { getNutritionProfile } from "@/app/lib/nutrition-profile";

export default async function ConfiguracionPage() {
  const auth = await requireUser();
  const profile = await getNutritionProfile(auth.user.id);

  return (
    <section className="page-frame content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]">
          Configuración
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">
          Tu perfil nutricional
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
          Completá tus datos para calcular calorías y macros personalizados.
        </p>
      </div>

      <ConfiguracionClient initialProfile={profile} initialDisplayName={auth.profile.displayName} />
    </section>
  );
}
