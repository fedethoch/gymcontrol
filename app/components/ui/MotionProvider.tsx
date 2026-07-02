"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Aplica `reducedMotion="user"` a todo el árbol framer-motion:
 * whileTap/whileHover/variants respetan `prefers-reduced-motion` sin
 * tener que protegerlos uno por uno.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
