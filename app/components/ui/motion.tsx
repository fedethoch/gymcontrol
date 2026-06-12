"use client";

import type { ComponentProps } from "react";
import { motion, type Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
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

export { motion };
