import Link from "next/link";
import { CalendarCheck, ChevronDown, Flame, ListChecks } from "lucide-react";

import { LoadingDots } from "@/app/components/ui/LoadingDots";

/** Encabezado del registro mobile: día (abre el selector), racha o "Volver a hoy" y "Tu día". */
export function DiaryHeader({
  title,
  caption,
  streak,
  isToday,
  navigating,
  onOpenPicker,
  onOpenDay,
}: {
  title: string;
  caption: string;
  streak: number;
  isToday: boolean;
  navigating: boolean;
  onOpenPicker: () => void;
  onOpenDay: () => void;
}) {
  return (
    <header className="flex min-h-11 items-center justify-between gap-3">
      <h1 className="sr-only">Registro de comidas</h1>
      <button
        type="button"
        onClick={onOpenPicker}
        aria-haspopup="dialog"
        aria-label={`Cambiar de día. Estás viendo ${title.toLowerCase()}, ${caption}.`}
        className="pressable -ml-1 flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-1 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
      >
        <span className="font-display text-[1.625rem] font-bold leading-none tracking-[-0.02em] text-[var(--foreground)]">
          {title}
        </span>
        <span className="truncate text-[15px] font-medium text-[var(--foreground-muted)]">{caption}</span>
        {navigating ? (
          <LoadingDots className="text-[var(--foreground-muted)]" />
        ) : (
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--foreground-muted)]" />
        )}
      </button>

      <div className="flex shrink-0 items-center gap-2">
        {isToday ? (
          streak > 0 ? (
            <span className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 font-display text-sm font-bold tabular-nums text-[var(--foreground)]">
              <Flame aria-hidden="true" className="size-4 text-[#ff9a75]" />
              {streak}
              <span className="font-sans text-xs font-medium text-[var(--foreground-muted)]">
                {streak === 1 ? "día" : "días"}
              </span>
              <span className="sr-only">seguidos registrando comidas</span>
            </span>
          ) : null
        ) : (
          <Link
            href="/nutricion/registro"
            prefetch={false}
            aria-label="Volver a hoy"
            className="pressable inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 text-sm font-semibold text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            <CalendarCheck aria-hidden="true" className="size-4 text-[var(--foreground-muted)]" />
            Hoy
          </Link>
        )}
        <button
          type="button"
          onClick={onOpenDay}
          aria-haspopup="dialog"
          aria-label="Tu día: todas las comidas"
          className="pressable grid size-11 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          <ListChecks aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
    </header>
  );
}
