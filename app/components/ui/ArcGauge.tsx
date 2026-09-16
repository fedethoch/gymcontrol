"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { premiumEase } from "@/app/components/ui/motion";
import { cn } from "@/app/lib/utils";

// Semicírculo de radio 110 centrado abajo; el viewBox deja lugar al trazo redondeado.
const ARC = "M20 132 A110 110 0 0 1 240 132";

/** Medidor semicircular (0–1) con contenido centrado abajo. El dibujo es decorativo: el texto va en `children`. */
export function ArcGauge({
  value,
  color,
  trackColor = "var(--card-alt)",
  strokeWidth = 14,
  className,
  children,
}: {
  value: number;
  color: string;
  trackColor?: string;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const progress = Math.max(0, Math.min(1, value));

  return (
    <div className={cn("relative w-full", className)} style={{ aspectRatio: "260 / 142" }}>
      <svg viewBox="0 0 260 142" aria-hidden="true" className="absolute inset-0 size-full">
        <path d={ARC} fill="none" stroke={trackColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <motion.path
          d={ARC}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: progress, opacity: progress > 0 ? 1 : 0 }}
          // MotionConfig no frena pathLength con reduced-motion: se corta acá.
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: premiumEase }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 grid justify-items-center text-center">{children}</div>
    </div>
  );
}
