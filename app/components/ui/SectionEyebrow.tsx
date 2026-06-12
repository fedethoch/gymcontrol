import type { ReactNode } from "react";

type SectionEyebrowProps = {
  children: ReactNode;
};

export function SectionEyebrow({ children }: SectionEyebrowProps) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a9b3c7]">
      {children}
    </p>
  );
}
