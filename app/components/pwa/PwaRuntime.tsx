"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { NOTIFICATION_LINK_PARAM, NOTIFICATION_LINK_VALUE } from "@/app/lib/notifications";

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone === true)
  );
}

/** Link abierto desde un aviso (`?origen=aviso`): se respeta y se limpia la marca de la URL. */
function consumeNotificationLink() {
  const url = new URL(window.location.href);

  if (url.searchParams.get(NOTIFICATION_LINK_PARAM) !== NOTIFICATION_LINK_VALUE) {
    return false;
  }

  url.searchParams.delete(NOTIFICATION_LINK_PARAM);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function PwaRuntime() {
  const pathname = usePathname();
  const router = useRouter();
  const handledLaunchRef = useRef(false);

  useEffect(() => {
    const standalone = isStandaloneDisplay();

    document.documentElement.classList.toggle("pwa-standalone", standalone);
    document.documentElement.classList.toggle("pwa-browser", !standalone);
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => undefined);
  }, []);

  // Tocar un aviso con la app abierta: el service worker pide ir a su link.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "gc:navigate" || typeof event.data.url !== "string") {
        return;
      }

      const target = new URL(event.data.url, window.location.origin);

      if (target.origin === window.location.origin) {
        window.location.assign(target.href);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    navigator.serviceWorker.startMessages();
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (handledLaunchRef.current) {
      return;
    }

    handledLaunchRef.current = true;

    if (consumeNotificationLink() || !isStandaloneDisplay() || pathname === "/") {
      return;
    }

    router.replace("/");
  }, [pathname, router]);

  return null;
}
