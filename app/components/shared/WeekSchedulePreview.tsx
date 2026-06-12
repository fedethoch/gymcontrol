import Link from "next/link";

import { Badge } from "@/app/components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/app/components/ui/Card";
import { cn } from "@/app/lib/utils";

type WeekDay = {
  day: string;
  label: string;
  type: "training" | "rest";
  href?: string;
};

type WeekSchedulePreviewProps = {
  days: WeekDay[];
};

export function WeekSchedulePreview({ days }: WeekSchedulePreviewProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <div className="flex flex-wrap gap-2">
          {days.map((item) => (
            <Badge
              key={item.day}
              variant={item.type === "training" ? "accent" : "neutral"}
            >
              {item.day}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 pt-5 lg:grid-cols-2 xl:grid-cols-3">
        {days.map((item) => {
          const sharedClasses = cn(
            "block rounded-2xl border p-4 transition-colors",
            item.type === "training"
              ? "border-[#3f325b] bg-[#17132a] hover:border-[#6d45bf]"
              : "border-[var(--border)] bg-[var(--card-alt)]",
          );

          const content = (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8697]">
                    {item.day}
                  </p>
                  <h3 className="font-display mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                    {item.label}
                  </h3>
                </div>
                <Badge variant={item.type === "training" ? "accent" : "neutral"}>
                  {item.type === "training" ? "Detalle" : "Descanso"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                {item.type === "training"
                  ? "Entra al entrenamiento del dia sin mezclar el resto de la semana."
                  : "Dia sin navegacion adicional para mantener el organigrama claro."}
              </p>
            </>
          );

          if (item.type === "training" && item.href) {
            return (
              <Link key={item.day} href={item.href} className={sharedClasses}>
                {content}
              </Link>
            );
          }

          return (
            <div key={item.day} className={sharedClasses}>
              {content}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
