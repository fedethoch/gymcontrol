import { splitPlanValue } from "@/app/lib/exercise-history";

type PlanStat = { label: string; value: string; unit: string };

/**
 * Fila del plan en Metric M (§11.4): Series · Reps · RIR · Descanso. Envuelve si no entra.
 * Sin plan (admin) muestra el rango ideal del ejercicio; sin ninguno de los dos, nada.
 */
export function ExercisePlanRow({
  series,
  repsTarget,
  rir,
  rest,
  minReps,
  maxReps,
}: {
  series?: number;
  repsTarget?: string;
  rir?: number | string;
  rest?: string;
  minReps?: number | null;
  maxReps?: number | null;
}) {
  if (!repsTarget) {
    if (minReps == null || maxReps == null) return null;

    return (
      <div className="flex items-baseline justify-between gap-3 border-y border-[var(--border)] py-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
          Rango ideal
        </span>
        <Metric value={minReps === maxReps ? String(minReps) : `${minReps}–${maxReps}`} unit="reps" />
      </div>
    );
  }

  const stats: PlanStat[] = [
    ...(series ? [{ label: "Series", value: String(series), unit: "" }] : []),
    { label: "Reps", ...splitPlanValue(repsTarget) },
    ...(rir != null && String(rir) !== "" ? [{ label: "RIR", ...splitPlanValue(String(rir)) }] : []),
    ...(rest ? [{ label: "Descanso", ...splitPlanValue(rest) }] : []),
  ];

  return (
    <dl className="flex flex-wrap justify-between gap-x-5 gap-y-3 border-y border-[var(--border)] py-3.5">
      {stats.map((stat) => (
        <div key={stat.label} className="grid gap-1">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
            {stat.label}
          </dt>
          <dd>
            <Metric value={stat.value} unit={stat.unit} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Metric({ value, unit }: { value: string; unit: string }) {
  return (
    <span className="font-display text-[1.75rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
      {value}
      {unit ? (
        <span className="ml-1 text-[0.8125rem] font-semibold tracking-normal text-[var(--foreground-muted)]">{unit}</span>
      ) : null}
    </span>
  );
}
