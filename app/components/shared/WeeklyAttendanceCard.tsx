import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/app/components/ui/Card";

type WeeklyAttendanceCardProps = {
  completedThisWeek: number;
  plannedDays: number;
};

export function WeeklyAttendanceCard({
  completedThisWeek,
  plannedDays,
}: WeeklyAttendanceCardProps) {
  const message = getMotivationalMessage(completedThisWeek, plannedDays);

  return (
    <Card className="flex h-full flex-col overflow-hidden border-[#27304a] bg-[linear-gradient(145deg,rgba(13,19,34,0.96)_0%,rgba(8,12,20,0.98)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
      <CardContent className="flex-1 p-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#34245b] bg-[#251640] text-[#b987ff]"
          >
            <Sparkles className="size-6" />
          </span>
          <h2 className="font-display text-xl font-semibold leading-tight text-white">
            Esta semana
          </h2>
        </div>

        <p className="mt-6 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
          {message}
        </p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold leading-none text-[#b987ff]">
            {completedThisWeek}
          </span>
          <span className="text-sm leading-6 text-[#c6cede]">
            {completedThisWeek === 1 ? "vez" : "veces"} esta semana
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-[#7d8697]">
          {plannedDays > 0
            ? `Entrenaste ${completedThisWeek} de ${plannedDays} dias planeados.`
            : "Todavia no tenes una rutina activa con dias planeados."}
        </p>
      </CardContent>
    </Card>
  );
}

function getMotivationalMessage(completedThisWeek: number, plannedDays: number) {
  if (plannedDays === 0) {
    return "Activa una rutina para empezar a llevar el control de tu semana.";
  }

  if (completedThisWeek >= plannedDays) {
    return "Venis muy bien, completaste todo lo planeado esta semana.";
  }

  const today = new Date();
  const weekdayIndex = (today.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
  const expectedByNow = Math.round((plannedDays * (weekdayIndex + 1)) / 7);

  if (completedThisWeek < expectedByNow) {
    return "Te quedaste atras esta semana. Todavia estas a tiempo de retomar el ritmo.";
  }

  return "Venis bien, segui asi para completar la semana.";
}
