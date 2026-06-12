import Link from "next/link";

type RouteCardProps = {
  href: string;
  title: string;
  description: string;
  badge: string;
};

export function RouteCard({
  href,
  title,
  description,
  badge,
}: RouteCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4 transition-colors hover:border-[#5b2ab3]"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#cbb7ff]">
        {badge}
      </span>
      <h3 className="font-display mt-2 text-base font-semibold text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
        {description}
      </p>
      <span className="mt-4 inline-flex text-sm font-semibold text-[#d6c6ff]">
        Entrar
      </span>
    </Link>
  );
}
