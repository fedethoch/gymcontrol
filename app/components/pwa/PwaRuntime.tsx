"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone === true)
  );
}

export function PwaRuntime() {
  const pathname = usePathname();
  const router = useRouter();
  const handledLaunchRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "pwa-standalone",
      isStandaloneDisplay(),
    );
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

  useEffect(() => {
    if (handledLaunchRef.current) {
      return;
    }

    handledLaunchRef.current = true;

    if (!isStandaloneDisplay() || pathname === "/") {
      return;
    }

    router.replace("/");
  }, [pathname, router]);

  return null;
}
