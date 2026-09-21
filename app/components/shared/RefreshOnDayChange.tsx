"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getTodayDateKey } from "@/app/lib/local-date";

/**
 * La PWA puede quedar abierta de un día para otro: al volver a la app, si cambió la fecha
 * (hora argentina) respecto de la que se dibujó, pide los datos de nuevo ("hoy toca" cambia a medianoche).
 */
export function RefreshOnDayChange({ dateKey }: { dateKey: string }) {
  const router = useRouter();

  useEffect(() => {
    function check() {
      if (document.visibilityState === "visible" && getTodayDateKey() !== dateKey) {
        router.refresh();
      }
    }

    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [dateKey, router]);

  return null;
}
