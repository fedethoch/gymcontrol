import { Plus, Salad } from "lucide-react";

import { Button } from "@/app/components/ui/Button";

/** Vacíos de la lista: el único lugar de la pantalla con CTA emerald (DESIGN.md §13.2). */
export function FoodsEmpty({
  kind,
  query,
  canCreate,
  onCreate,
  onClear,
}: {
  kind: "search" | "own";
  query: string;
  canCreate: boolean;
  onCreate: (name: string) => void;
  onClear: () => void;
}) {
  if (kind === "own") {
    return (
      <div className="motion-empty-state grid justify-items-start gap-3 pt-8">
        <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--accent-bright)]">
          <Salad aria-hidden="true" className="size-3.5" />
          Tus alimentos
        </p>
        <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
          Cargá tu primer alimento
        </h2>
        <p className="text-[0.9375rem] leading-6 text-[var(--foreground-muted)]">
          Marcas, comidas caseras o algo que no está en el catálogo. Copiás los valores de la etiqueta y queda listo para
          registrar tus comidas.
        </p>
        <Button type="button" className="mt-2 h-14 w-full rounded-2xl text-base font-bold" onClick={() => onCreate("")}>
          <Plus aria-hidden="true" className="size-5" />
          Crear alimento
        </Button>
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
        {canCreate
          ? "Revisá cómo está escrito o cargalo con los valores de la etiqueta. Solo lo vas a ver vos."
          : "Revisá cómo está escrito o probá con otro nombre."}
      </p>
      {canCreate ? (
        <Button type="button" className="mt-2 h-14 w-full rounded-2xl text-base font-bold" onClick={() => onCreate(name)}>
          <Plus aria-hidden="true" className="size-5" />
          <span className="truncate">Crear «{name}»</span>
        </Button>
      ) : null}
      <Button type="button" variant="ghost" className="h-12 w-full rounded-2xl" onClick={onClear}>
        Limpiar búsqueda
      </Button>
    </div>
  );
}
