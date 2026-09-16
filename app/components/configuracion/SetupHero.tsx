import { ArrowRight } from "lucide-react";

import { Button } from "@/app/components/ui/Button";

/** Z2 sin perfil: pedir el plan en vez de mostrar valores inventados (DESIGN.md §15.3). */
export function SetupHero({ onStart }: { onStart: () => void }) {
  return (
    <section aria-labelledby="setup-title" className="flex flex-col gap-4">
      <p className="text-[0.6875rem] font-semibold uppercase leading-normal tracking-[0.08em] text-[var(--foreground-muted)]">
        Tu objetivo diario
      </p>
      <h2
        id="setup-title"
        className="font-display text-[clamp(2.75rem,14.5vw,3.625rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-[var(--foreground)]"
      >
        Calculá
        <br />
        tu plan
      </h2>
      <p className="text-[15px] leading-relaxed text-[var(--foreground-muted)]">
        6 preguntas, un minuto. Con eso sacamos tus kcal y tus macros.
      </p>
      <Button type="button" onClick={onStart} className="mt-2 h-14 rounded-2xl text-base font-bold">
        Empezar
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </section>
  );
}
