import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import { MyRoutinesList, type MyRoutineRow } from "@/app/rutinas/MyRoutinesList";

export const ROUTINE_XXL_CLASS =
  "font-display text-[clamp(2.75rem,13vw,3.25rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-white";
const CHIP_CLASS =
  "inline-flex h-[30px] w-fit items-center rounded-full bg-[rgba(5,7,11,0.72)] px-3 text-xs font-semibold uppercase tracking-[0.06em] text-white";

/** Sin rutina activa (con o sin guardadas), DESIGN.md §12.2. Sin portada: no hay rutina que mostrar. */
export function ChooseRoutineMobile({ routines }: { routines: MyRoutineRow[] }) {
  const hasSaved = routines.length > 0;

  return (
    <>
      <div className="flex min-h-14 flex-col justify-center">
        <p className="text-[13px] font-medium text-[var(--foreground-muted)]">Rutinas</p>
        <h1 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
          Mis rutinas
        </h1>
      </div>
      <div className="mt-6 grid gap-3.5">
        <p className={CHIP_CLASS}>{hasSaved ? "Sin rutina activa" : "Sin rutinas guardadas"}</p>
        <h2 className={ROUTINE_XXL_CLASS}>
          Elegí tu <em className="not-italic text-[var(--accent-bright)]">rutina</em>
        </h2>
        <p className="text-[15px] font-medium leading-snug text-white/80">
          {hasSaved
            ? "Activá una de tus rutinas guardadas para ver tu semana."
            : "Guardá una del catálogo y acá vas a ver tu semana, día por día."}
        </p>
      </div>
      {hasSaved ? (
        <>
          <div className="mt-6">
            <MyRoutinesList routines={routines} />
          </div>
          <Link
            href="/catalogo"
            className="pressable mx-auto mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--accent-bright)]"
          >
            <Search aria-hidden="true" className="size-4" />
            Explorar catálogo
          </Link>
        </>
      ) : (
        <Button asChild className="mt-7 h-14 w-full rounded-2xl text-base font-bold">
          <Link href="/catalogo">Explorar catálogo</Link>
        </Button>
      )}
    </>
  );
}

/** Rutina activa sin días cargados, DESIGN.md §12.2. */
export function EmptyRoutineMobile() {
  return (
    <div className="grid gap-3.5 pt-[clamp(8rem,30svh,12rem)]">
      <p className={CHIP_CLASS}>Sin días cargados</p>
      <h2 className={ROUTINE_XXL_CLASS}>
        Rutina <em className="not-italic text-[var(--accent-bright)]">vacía</em>
      </h2>
      <p className="text-[15px] font-medium leading-snug text-white/80">
        Esta rutina todavía no tiene días. Elegí otra desde el título o buscá una en el catálogo.
      </p>
      <Link
        href="/catalogo"
        className="pressable mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white/10 text-[15px] font-semibold text-white hover:bg-white/15"
      >
        <Search aria-hidden="true" className="size-4" />
        Explorar catálogo
      </Link>
    </div>
  );
}
