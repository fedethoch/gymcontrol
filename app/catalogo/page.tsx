import { RoutineCatalogClient } from "@/app/catalogo/RoutineCatalogClient";
import { listRoutineTemplates } from "@/app/lib/routines";

export default async function CatalogoPage() {
  const routines = await listRoutineTemplates();

  return (
    <section className="page-frame content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
          Catálogo de rutinas
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Elegí una rutina para activar tu semana
        </p>
      </div>

      <div className="-mt-2 sm:-mt-3">
        <RoutineCatalogClient routines={routines} />
      </div>
    </section>
  );
}
