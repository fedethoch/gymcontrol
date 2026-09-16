import { RoutineCatalogClient } from "@/app/catalogo/RoutineCatalogClient";
import { CatalogMobileView } from "@/app/components/catalogo/CatalogMobileView";
import { getOptionalAuthContext } from "@/app/lib/auth";
import { toCatalogRoutine } from "@/app/lib/routine-catalog";
import { listRoutineTemplates } from "@/app/lib/routines";
import { listSavedRoutineStatusesForUser } from "@/app/lib/saved-routines";

export default async function CatalogoPage() {
  const [routines, auth] = await Promise.all([listRoutineTemplates(), getOptionalAuthContext()]);
  const savedStatusByTemplateId = auth ? await listSavedRoutineStatusesForUser(auth.user.id) : {};

  return (
    <section className="page-frame catalogo-frame relative content-start bg-[var(--background)] lg:bg-[linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      {/* Mobile (<1024): planificador por días, DESIGN.md §16. */}
      <div className="flex flex-col lg:hidden">
        <div aria-hidden="true" className="home-safe-top" />
        <CatalogMobileView routines={routines.map(toCatalogRoutine)} statusById={savedStatusByTemplateId} />
      </div>

      {/* Desktop: grilla de cards con paginación. */}
      <div className="hidden lg:contents">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
            Catálogo de rutinas
          </h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Elegí una rutina para activar tu semana
          </p>
        </div>

        <div className="-mt-2 sm:-mt-3">
          <RoutineCatalogClient routines={routines} savedStatusByTemplateId={savedStatusByTemplateId} />
        </div>
      </div>
    </section>
  );
}
