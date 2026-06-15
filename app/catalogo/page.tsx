import { RoutineCatalogClient } from "@/app/catalogo/RoutineCatalogClient";
import { listRoutineTemplates } from "@/app/lib/routines";

export default async function CatalogoPage() {
  const routines = await listRoutineTemplates();

  return (
    <section className="page-frame content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]">
          Catalogo
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">
          Catalogo de rutinas
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
          Explora rutinas disponibles y prepara el guardado.
        </p>
      </div>

      <div className="-mt-2 sm:-mt-3">
        <RoutineCatalogClient routines={routines} />
      </div>
    </section>
  );
}
