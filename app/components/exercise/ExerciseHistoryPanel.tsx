import { ExerciseTrend } from "@/app/components/exercise/ExerciseTrend";
import {
  bestSessionId,
  bestSetLabel,
  compareLastSessions,
  formatShortDate,
  trendPoints,
  type SessionComparison,
} from "@/app/lib/exercise-history";
import { formatLoggedSet, formatSeconds, isValidSet, type ExerciseKind } from "@/app/lib/workout-progression";
import type { ExerciseHistoryEntry } from "@/app/lib/workout-tracking";

export type ExerciseHistoryData = {
  kind: ExerciseKind;
  entries: ExerciseHistoryEntry[];
};

/** Pestaña Historial (§11.4): última vs anterior, métrica con gráfico y sesiones. */
export function ExerciseHistoryPanel({ history }: { history: ExerciseHistoryData }) {
  const sessions = history.entries.filter((entry) => entry.sets.some(isValidSet));
  const points = trendPoints(sessions);
  const comparison = compareLastSessions(sessions);
  const bestId = bestSessionId(sessions);
  const only = sessions.length === 1 ? sessions[0] : null;

  return (
    <div className="grid gap-6">
      {comparison ? <Comparison comparison={comparison} /> : null}

      {points.length >= 2 ? (
        <ExerciseTrend points={points} kind={history.kind} />
      ) : only ? (
        <div className="grid gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
            Mejor serie · {formatShortDate(only.trainingDate)}
          </span>
          <span className="font-display text-[3rem] font-bold leading-none tracking-[-0.04em] tabular-nums text-[var(--foreground)]">
            {bestSetLabel(only)}
          </span>
          <span className="text-[14px] text-[var(--foreground-muted)]">
            Primera sesión registrada. El gráfico aparece con la segunda.
          </span>
        </div>
      ) : null}

      <section aria-labelledby="exercise-sessions-title" className="grid gap-1">
        <h3 id="exercise-sessions-title" className="font-display text-[1.0625rem] font-semibold text-[var(--foreground)]">
          {sessions.length === 1 ? "Sesión" : `Últimas ${sessions.length} sesiones`}
        </h3>
        <ol className="grid">
          {sessions.map((entry) => (
            <li key={entry.sessionId} className="grid">
              <p className="flex items-center gap-2 pb-1 pt-3">
                <span className="font-display text-[15px] font-semibold text-[var(--foreground)]">
                  {formatShortDate(entry.trainingDate)}
                </span>
                {entry.target ? (
                  <span className="text-[13px] text-[var(--foreground-subtle)]">objetivo {entry.target}</span>
                ) : null}
                {entry.sessionId === bestId && sessions.length > 1 ? (
                  <span className="ml-auto rounded-md border border-[var(--border-strong)] px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground)]">
                    Mejor
                  </span>
                ) : null}
              </p>
              <ol aria-label={`Series del ${formatShortDate(entry.trainingDate)}`}>
                {entry.sets.filter(isValidSet).map((set, index) => (
                  <li
                    key={index}
                    className="grid h-9 grid-cols-[1.75rem_1fr] items-center border-b border-[var(--border)] font-mono text-[14px] tabular-nums text-[var(--foreground)]"
                  >
                    <span className="text-[var(--foreground-subtle)]">{index + 1}</span>
                    <span>{formatLoggedSet(set, entry.kind)}</span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Comparison({ comparison }: { comparison: SessionComparison }) {
  const { sets, volume, best } = comparison;
  const volumeValue = (value: number) => (volume.unit === "secs" ? formatSeconds(value) : String(value));

  return (
    <section aria-label="Última sesión contra la anterior" className="grid gap-2">
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
          Última vez · {formatShortDate(comparison.date)}
        </span>
        <span className="text-[13px] text-[var(--foreground-muted)]">vs {formatShortDate(comparison.previousDate)}</span>
      </p>
      <dl className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-6 border-y border-[var(--border)] py-3">
        <Cell label="Series" value={String(sets.value)} detail={delta(sets.value, sets.previous, String)} />
        <Cell
          label={volume.unit === "secs" ? "Tiempo" : "Reps"}
          value={volumeValue(volume.value)}
          detail={delta(volume.value, volume.previous, volumeValue)}
        />
        <Cell label="Mejor serie" value={best.value} detail={`antes ${best.previous}`} />
      </dl>
    </section>
  );
}

function Cell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{label}</dt>
      <dd className="truncate font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[var(--foreground)]">
        {value}
      </dd>
      <dd className="truncate font-mono text-[12px] text-[var(--foreground-muted)]">{detail}</dd>
    </div>
  );
}

function delta(value: number, previous: number, format: (value: number) => string) {
  if (value === previous) return "= anterior";

  const sign = value > previous ? "+" : "−";
  const amount = format(Math.abs(value - previous));

  return `${sign}${amount} vs ${format(previous)}`;
}
