import { CircleAlert, LockKeyhole } from "lucide-react";

import type { LoginNotice as LoginNoticeData } from "@/app/lib/auth-otp";
import { cn } from "@/app/lib/utils";

/** Aviso en línea del acceso (DESIGN.md §17.3): sin caja, entre bordes. */
export function LoginNotice({ notice, className }: { notice: LoginNoticeData; className?: string }) {
  const Icon = notice.tone === "info" ? LockKeyhole : CircleAlert;

  return (
    <div
      role={notice.tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 border-y border-[var(--border)] py-3 text-sm leading-snug", className)}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-px size-[18px] shrink-0",
          notice.tone === "info" ? "text-[var(--info)]" : "text-[var(--danger)]",
        )}
      />
      <p className="min-w-0">
        <span className="block font-semibold text-[var(--foreground)]">{notice.title}</span>
        <span className="text-[var(--foreground-muted)]">{notice.body}</span>
      </p>
    </div>
  );
}
