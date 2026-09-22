import { Bell, ChevronRight } from "lucide-react";

import type { PushDeviceStatus } from "@/app/components/configuracion/usePushDevice";
import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";

const STATUS_LABELS: Record<PushDeviceStatus, string> = {
  loading: "",
  unsupported: "No disponibles",
  needs_install: "Instalá la app",
  denied: "Bloqueados",
  updating: "Actualizando",
  default: "Apagados",
  subscribed: "Activados",
};

/** Z3b · Notificaciones: una fila con el estado de este dispositivo que abre S7 (DESIGN.md §15.1). */
export function NotificationRows({ status, onOpen }: { status: PushDeviceStatus; onOpen: () => void }) {
  return (
    <section aria-labelledby="notifications-title" className="flex flex-col gap-3">
      <HomeSectionHeader id="notifications-title" title="Notificaciones" />
      <div className="border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--border)] py-2.5 text-left outline-none transition-colors active:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)]"
        >
          <Bell aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-muted)]" />
          <span className="flex-1 text-[15px] font-medium text-[var(--foreground)]">Avisos</span>
          <span className="text-[15px] text-[var(--foreground-muted)]">{STATUS_LABELS[status]}</span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--foreground-subtle)]" />
        </button>
      </div>
    </section>
  );
}
