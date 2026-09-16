import { ChefHat, Plus } from "lucide-react";

import { Button } from "@/app/components/ui/Button";

/** Vacíos de la lista: el único lugar de la pantalla con CTA emerald (DESIGN.md §18.2). */
export function RecipesEmpty({
  kind,
  query,
  canCreate,
  onCreate,
  onClear,
}: {
  kind: "search" | "own" | "catalog";
  query: string;
  canCreate: boolean;
  onCreate: (name: string) => void;
  onClear: () => void;
}) {
  if (kind === "catalog") {
    return (
      <div className="motion-empty-state grid justify-items-start gap-3 pt-12">
        <h2 className="font-display text-[2.75rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-[var(--foreground)]">
          Todavía no hay recetas
        </h2>
        <p className="text-[0.9375rem] leading-6 text-[var(--foreground-muted)]">
          {canCreate ? "Armá la primera con alimentos del catálogo." : "Pronto vas a encontrar recetas con sus macros acá."}
        </p>
        {canCreate ? <CreateButton label="Crear receta" onClick={() => onCreate("")} /> : null}
      </div>
    );
  }

  if (kind === "own") {
    return (
      <div className="motion-empty-state grid justify-items-start gap-3 pt-8">
        <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--accent-bright)]">
          <ChefHat aria-hidden="true" className="size-3.5" />
          Tus recetas
        </p>
        <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
          Armá tu primera receta
        </h2>
        <p className="text-[0.9375rem] leading-6 text-[var(--foreground-muted)]">
          Elegí alimentos del catálogo y los gramos. Calculamos kcal y macros por porción. Queda pública para todos.
        </p>
        <CreateButton label="Crear receta" onClick={() => onCreate("")} />
      </div>
    );
  }

  const name = query.trim();

  return (
    <div className="motion-empty-state grid justify-items-start gap-3 pt-8">
      <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)] [overflow-wrap:anywhere]">
        No encontramos «{name}»
      </h2>
      <p className="text-[0.9375rem] leading-6 text-[var(--foreground-muted)]">
        Ninguna receta lo tiene en el nombre ni en los ingredientes.
      </p>
      {canCreate ? <CreateButton label={`Crear receta «${name}»`} onClick={() => onCreate(name)} /> : null}
      <Button type="button" variant="ghost" className="h-12 w-full rounded-2xl" onClick={onClear}>
        Limpiar búsqueda
      </Button>
    </div>
  );
}

function CreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" className="mt-2 h-14 w-full rounded-2xl text-base font-bold" onClick={onClick}>
      <Plus aria-hidden="true" className="size-5" />
      <span className="truncate">{label}</span>
    </Button>
  );
}
