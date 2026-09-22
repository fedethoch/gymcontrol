import { ConfiguracionClient } from "@/app/configuracion/ConfiguracionClient";
import { requireUser } from "@/app/lib/auth";
import { getNotificationPreferences } from "@/app/lib/notification-preferences";
import { getNutritionProfile } from "@/app/lib/nutrition-profile";

type ConfiguracionPageProps = {
  searchParams: Promise<{ panel?: string | string[] }>;
};

export default async function ConfiguracionPage({ searchParams }: ConfiguracionPageProps) {
  const [auth, { panel }] = await Promise.all([requireUser(), searchParams]);
  const [profile, notificationPrefs] = await Promise.all([
    getNutritionProfile(auth.user.id),
    getNotificationPreferences(auth.user.id),
  ]);

  return (
    <section className="page-frame configuracion-frame content-start bg-[var(--background)] lg:bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      {/* Mobile trae su propio encabezado (DESIGN.md §15); desktop sin cambios. */}
      <div className="hidden lg:block">
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

      <ConfiguracionClient
        initialProfile={profile}
        initialDisplayName={auth.profile.displayName}
        email={auth.user.email}
        initialNotificationPrefs={notificationPrefs}
        openNotifications={panel === "notificaciones"}
      />
    </section>
  );
}
