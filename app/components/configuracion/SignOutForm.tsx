"use client";

import { useRef, type ReactNode } from "react";

import { forgetThisDevice } from "@/app/lib/push-client";

const FORGET_TIMEOUT_MS = 1_500;

/**
 * Cerrar sesión (POST /auth/signout). Antes borra la suscripción a avisos de este dispositivo,
 * para que un celu compartido no siga recibiendo avisos de esta cuenta (DESIGN.md §6.4).
 */
export function SignOutForm({ className, children }: { className?: string; children: ReactNode }) {
  const submittingRef = useRef(false);

  return (
    <form
      action="/auth/signout"
      method="post"
      className={className}
      onSubmit={(event) => {
        if (submittingRef.current) return;
        event.preventDefault();
        submittingRef.current = true;
        const form = event.currentTarget;
        const timeout = new Promise((resolve) => setTimeout(resolve, FORGET_TIMEOUT_MS));

        void Promise.race([forgetThisDevice().catch(() => undefined), timeout]).then(() => form.submit());
      }}
    >
      {children}
    </form>
  );
}
