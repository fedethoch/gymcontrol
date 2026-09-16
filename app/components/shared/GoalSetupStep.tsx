import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";

import { Button } from "@/app/components/ui/Button";

/** Paso "Calculá tus kcal y macros" cuando todavía no hay objetivo (home y registro). */
export function GoalSetupStep({ detail }: { detail: ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-bright)]">
        <Target aria-hidden="true" className="size-3.5" />
        Tu objetivo
      </p>
      <p className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
        Calculá tus kcal y macros
      </p>
      <p className="text-sm text-[var(--foreground-muted)]">{detail}</p>
      <Button asChild variant="secondary" className="h-12 rounded-2xl">
        <Link href="/configuracion">
          Configurar
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
