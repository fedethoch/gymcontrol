import Link from "next/link";

/** Título de sección del home mobile: H2 sin kicker (DESIGN.md §10). */
export function HomeSectionHeader({
  id,
  title,
  action,
}: {
  id: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2
        id={id}
        className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
      >
        {title}
      </h2>
      {action ? (
        <Link
          href={action.href}
          className="pressable -mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[var(--accent-bright)] hover:text-[var(--accent-strong)]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
