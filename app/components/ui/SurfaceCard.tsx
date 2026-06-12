import type { ReactNode } from "react";

import { Card } from "./Card";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return <Card className={className}>{children}</Card>;
}
