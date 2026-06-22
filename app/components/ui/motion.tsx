"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { animate, motion, type Variants } from "framer-motion";

export const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const microTransition = {
  duration: 0.18,
  ease: premiumEase,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: microTransition },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: microTransition },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.14, ease: premiumEase } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const listItemHover = {
  y: -2,
  transition: microTransition,
};

export const tapFeedback = {
  scale: 0.985,
  transition: { duration: 0.1, ease: premiumEase },
};

export function MotionSection({
  className,
  children,
  ...props
}: ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionDiv({
  className,
  children,
  ...props
}: ComponentProps<typeof motion.div>) {
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}

/** Pulso suave de brillo para destacar un elemento activo (ej. figura muscular). */
export function GlowPulseWrapper({
  active,
  children,
  className,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={
        active
          ? { filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"] }
          : undefined
      }
      transition={
        active
          ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

/** Barra de macro animada desde 0 hasta el porcentaje dado. */
export function AnimatedMacroBar({ pct, color, delay = 0.05 }: { pct: number; color: string; delay?: number }) {
  return (
    <motion.div
      className="h-full rounded-full"
      style={{ backgroundColor: color }}
      initial={{ width: 0 }}
      whileInView={{ width: `${pct}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, ease: premiumEase, delay }}
    />
  );
}

/** Contador animado que tween-ea desde el valor anterior hasta el nuevo. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const previousRef = useRef(0);

  useEffect(() => {
    const controls = animate(previousRef.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => {
        previousRef.current = latest;
        setDisplay(latest);
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{Math.round(display)}</span>;
}

export { motion };
