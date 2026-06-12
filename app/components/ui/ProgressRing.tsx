"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/app/lib/utils";

export function AnimatedProgressRing({
  value,
  size = 144,
  strokeWidth = 16,
  trackColor = "rgba(39,47,66,0.9)",
  progressColor = "#7c3aed",
  className,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  className?: string;
  children?: ReactNode;
}) {
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

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (display / 100) * circumference;

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        {children ?? <span>{Math.round(display)}%</span>}
      </div>
    </div>
  );
}
