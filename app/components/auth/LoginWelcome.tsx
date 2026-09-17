import type { ReactNode } from "react";
import Image from "next/image";

/** Entrada del acceso mobile (DESIGN.md §17.1): portada con foto en gris y acciones al pie. */
export function LoginWelcome({ notice, children }: { notice?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] [@media(max-height:500px)]:flex-row">
      <div className="relative isolate h-[min(60dvh,32.5rem)] min-h-[18rem] shrink-0 overflow-hidden [@media(max-height:500px)]:h-auto [@media(max-height:500px)]:min-h-[100dvh] [@media(max-height:500px)]:w-2/5">
        <Image
          alt=""
          fill
          priority
          sizes="(max-height: 500px) 40vw, 100vw"
          src="/images/hero.png"
          className="-z-20 object-cover object-[50%_20%] brightness-[0.62] contrast-[1.05] grayscale"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,7,11,0.6)_0%,rgba(5,7,11,0)_20%,rgba(5,7,11,0)_42%,rgba(5,7,11,0.9)_80%,var(--background)_100%)]"
        />
        <div className="absolute inset-x-6 top-0 flex items-center gap-2 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
          <Image
            alt=""
            width={28}
            height={28}
            src="/logo/logo.png"
            className="size-7 object-contain brightness-0 invert"
          />
          <span className="font-display text-base font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            GymControl
          </span>
        </div>
        <div className="absolute inset-x-6 bottom-1 grid gap-4 [@media(max-height:500px)]:bottom-6">
          <h1 className="font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--foreground)] [@media(max-height:500px)]:text-[2rem]">
            <span className="text-[var(--foreground-muted)]">Tu semana,</span>
            <br />
            bajo control.
          </h1>
          <p className="flex items-center gap-2.5 text-xs font-medium text-[var(--foreground-muted)]">
            Rutinas
            <span aria-hidden="true" className="size-[3px] rounded-full bg-[var(--foreground-subtle)]" />
            Series
            <span aria-hidden="true" className="size-[3px] rounded-full bg-[var(--foreground-subtle)]" />
            Comidas
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3 px-6 pb-[max(2.125rem,calc(env(safe-area-inset-bottom)+1rem))] pt-4 [@media(max-height:500px)]:justify-center [@media(max-height:500px)]:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {notice}
        {children}
        <p className="mt-1 text-center text-xs leading-snug text-[var(--foreground-muted)]">
          Sin contraseña. Te mandamos un código por mail.
        </p>
      </div>
    </div>
  );
}
