"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { saveNotificationPreferencesAction } from "@/app/configuracion/actions";
import type { NotificationPreferences } from "@/app/lib/notifications";

const AUTOSAVE_DELAY_MS = 800;

/** Preferencias de avisos de S7 (DESIGN.md §15.2): guardan solas a los 800 ms y al cerrar el sheet. */
export function useNotificationPrefs(initial: NotificationPreferences) {
  const [prefs, setPrefs] = useState(initial);
  const signature = useMemo(() => JSON.stringify(prefs), [prefs]);
  const savedSignatureRef = useRef(signature);
  const pendingSaveRef = useRef<{ timeout: number; run: () => void } | null>(null);

  useEffect(() => {
    if (signature === savedSignatureRef.current) {
      return;
    }

    let ignore = false;

    const run = () => {
      pendingSaveRef.current = null;

      void saveNotificationPreferencesAction(prefs)
        .then((result) => {
          if (ignore) return;
          if (result.ok) {
            savedSignatureRef.current = signature;
          } else {
            toast.error(result.message);
          }
        })
        .catch(() => {
          if (!ignore) toast.error("No se pudieron guardar los avisos.");
        });
    };

    const timeout = window.setTimeout(run, AUTOSAVE_DELAY_MS);
    pendingSaveRef.current = { timeout, run };

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
      pendingSaveRef.current = null;
    };
  }, [prefs, signature]);

  /** Guarda ya lo pendiente (al cerrar el sheet), sin esperar el debounce. */
  const flush = useCallback(() => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timeout);
    pending.run();
  }, []);

  return { prefs, setPrefs, flush };
}

export type NotificationPrefsForm = ReturnType<typeof useNotificationPrefs>;
