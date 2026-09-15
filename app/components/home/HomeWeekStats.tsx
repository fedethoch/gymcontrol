import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";

/** Z5 · semana calendario en números, sin cards. */
export function HomeWeekStats({
  completedDays,
  totalDays,
  streak,
  nutritionDays,
}: {
  completedDays: number;
  totalDays: number;
  streak: number;
  nutritionDays: number;
}) {
  const stats = [
    { label: "Entrenos", value: completedDays, unit: `/${totalDays}` },
    { label: "Racha", value: streak, unit: streak === 1 ? " día" : " días" },
    { label: "Comidas", value: nutritionDays, unit: "/7 días" },
  ];

  return (
    <section aria-labelledby="home-week-title" className="grid gap-4">
      <HomeSectionHeader id="home-week-title" title="Esta semana" action={{ href: "/rutinas", label: "Rutina" }} />
      <dl className="grid grid-cols-3 border-y border-[var(--border)]">
        {stats.map(({ label, value, unit }) => (
          <div
            key={label}
            className="grid min-w-0 gap-2 py-4 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-[var(--border)] [&:not(:first-child)]:pl-4"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
              {label}
            </dt>
            <dd className="font-display text-[1.75rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
              {value}
              <span className="font-sans text-sm font-medium tracking-normal text-[var(--foreground-muted)]">
                {unit}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
