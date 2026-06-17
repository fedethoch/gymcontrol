"use client";

import { useState } from "react";
import { Bookmark, Dumbbell, Pencil, Plus, UserPlus } from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import type { RecentActivityKind } from "@/app/lib/admin-stats";

type RecentActivityEntry = {
  kind: RecentActivityKind;
  action: string;
  detail: string;
  at: string;
};

const ACTIVITY_ICONS: Record<RecentActivityKind, typeof Plus> = {
  rutina_nueva: Plus,
  ejercicio_nuevo: Dumbbell,
  rutina_actualizada: Pencil,
  usuario_nuevo: UserPlus,
  rutina_guardada: Bookmark,
};

const COLLAPSED_ROWS = 4;

export function RecentActivityTable({ activities }: { activities: RecentActivityEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? activities : activities.slice(0, COLLAPSED_ROWS);

  return (
    <div>
      <div className="divide-y divide-[var(--border)]">
        {visible.map((entry, index) => {
          const Icon = ACTIVITY_ICONS[entry.kind];
          return (
            <div
              key={`${entry.kind}-${entry.at}-${index}`}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-[8px] border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)]">
                <Icon className="size-3" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">
                {entry.detail}
              </span>
              <span className="shrink-0 text-[10px] text-[var(--foreground-muted)]">
                {formatActivityDate(entry.at)}
              </span>
            </div>
          );
        })}
      </div>
      {activities.length > COLLAPSED_ROWS && (
        <div className="border-t border-[var(--border)] px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-[var(--accent-bright)] hover:text-white"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Ver menos" : `Ver más (${activities.length - COLLAPSED_ROWS} más)`}
          </Button>
        </div>
      )}
    </div>
  );
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / dayMs,
  );

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
