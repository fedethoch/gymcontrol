import { ChevronRight, LogOut, TriangleAlert } from "lucide-react";

import { SignOutForm } from "@/app/components/configuracion/SignOutForm";
import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";

const ROW =
  "flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--border)] py-2.5 text-left outline-none transition-colors active:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)]";

/** Z4 · nombre, email, cerrar sesión y borrar cuenta (DESIGN.md §15.1). */
export function AccountRows({
  displayName,
  email,
  onEditName,
  onDeleteAccount,
}: {
  displayName: string;
  email: string | null;
  onEditName: () => void;
  onDeleteAccount: () => void;
}) {
  const name = displayName.trim();

  return (
    <section aria-labelledby="account-title" className="flex flex-col gap-3">
      <HomeSectionHeader id="account-title" title="Cuenta" />
      <ul className="border-t border-[var(--border)]">
        <li>
          <button type="button" onClick={onEditName} className={ROW}>
            <span className="flex-1 text-[15px] font-medium text-[var(--foreground)]">Nombre</span>
            <span className="min-w-0 max-w-[55%] truncate text-[15px] text-[var(--foreground-muted)]">
              {name || "Sin nombre"}
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--foreground-subtle)]" />
          </button>
        </li>
        {email ? (
          <li className={ROW}>
            <span className="flex-1 text-[15px] font-medium text-[var(--foreground)]">Email</span>
            <span className="min-w-0 break-all text-right text-[13px] text-[var(--foreground-muted)]">{email}</span>
          </li>
        ) : null}
        <li>
          <SignOutForm>
            <button type="submit" className={ROW}>
              <LogOut aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-muted)]" />
              <span className="flex-1 text-[15px] font-medium text-[var(--foreground)]">Cerrar sesión</span>
            </button>
          </SignOutForm>
        </li>
        <li>
          <button type="button" onClick={onDeleteAccount} className={ROW}>
            <TriangleAlert aria-hidden="true" className="size-[18px] shrink-0 text-[var(--danger)]" />
            <span className="flex-1 text-[15px] font-medium text-[var(--danger)]">Borrar cuenta</span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--foreground-subtle)]" />
          </button>
        </li>
      </ul>
    </section>
  );
}
