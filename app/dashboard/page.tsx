import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  Flame,
  Target,
} from "lucide-react";

import { StatusToast } from "@/app/components/shared/StatusToast";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { fadeUp, MotionDiv, staggerContainer } from "@/app/components/ui/motion";
import { requireUser } from "@/app/lib/auth";
import { ROUTINE_OBJECTIVE_LABELS } from "@/app/lib/routine-metadata";
import { listSavedRoutinesForUser } from "@/app/lib/saved-routines";

type DashboardPageProps = {
  searchParams: Promise<{
    reason?: string;
    status?: string;
    savedRoutineId?: string;
  }>;
};

const reasonCopy: Record<string, string> = {
  "admin-required":
    "No tienes permisos de administrador para entrar a esa seccion.",
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const [params, auth] = await Promise.all([searchParams, requireUser()]);
  const routines = await listSavedRoutinesForUser(auth.user.id);
  const activeRoutine = routines.find((routine) => routine.isActive) ?? null;
  const reasonMessage = params.reason ? reasonCopy[params.reason] : null;
  const statusMessage =
    params.status === "renamed"
      ? "Nombre de rutina actualizado."
      : params.status === "active"
        ? "Rutina activa actualizada."
        : params.status === "inactive"
          ? "Rutina activa desactivada."
        : params.status === "active-error"
          ? "No se pudo marcar la rutina como activa."
          : params.status === "deleted"
            ? "Rutina borrada de tus guardadas."
            : params.status === "delete-error"
              ? "No se pudo borrar la rutina."
      : params.status === "rename-error"
        ? "No se pudo actualizar el nombre de la rutina."
        : null;
  const statusIsError = Boolean(params.status?.endsWith("-error"));

  const metrics = [
    {
      label: "Rutinas guardadas",
      value: routines.length.toString(),
      detail: "Total de rutinas guardadas",
      icon: BookOpen,
    },
    {
      label: "Semana actual",
      value: activeRoutine ? `0 / ${activeRoutine.dayCount}` : "0 / 0",
      detail: "Días completados",
      icon: CalendarDays,
      progress: activeRoutine ? 0 : null,
    },
    {
      label: "Días entrenados",
      value: "0",
      detail: "Esta semana",
      icon: Flame,
    },
    {
      label: "Objetivo actual",
      value: activeRoutine
        ? ROUTINE_OBJECTIVE_LABELS[activeRoutine.objective]
        : "Sin objetivo",
      detail: "Enfoque principal",
      icon: Target,
    },
  ];

  return (
    <section className="page-frame dashboard-page-frame bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-semibold leading-none tracking-[-0.06em] text-white sm:text-4xl">
            {auth.profile.displayName ? `Hola, ${auth.profile.displayName}` : "Mis rutinas"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
            Administra, renombra y elige tu rutina activa.
          </p>
        </div>
      </MotionDiv>

      <StatusToast message={reasonMessage} isError clearParams={["reason"]} />
      <StatusToast message={statusMessage} isError={statusIsError} clearParams={["status", "savedRoutineId"]} />

      {activeRoutine ? (
        <MotionDiv
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-3"
        >
          <div className="grid grid-cols-2 auto-rows-fr gap-2.5 sm:gap-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <MotionDiv key={metric.label} variants={fadeUp}>
                <Card
                  className="bg-[linear-gradient(145deg,#0d1322_0%,#080d17_100%)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#6d40ef]"
                >
                  <CardContent className="flex h-full min-h-[6.5rem] flex-col items-start gap-2 p-3 sm:min-h-[8.125rem] sm:flex-row sm:items-center sm:gap-3 sm:p-3.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#5b2ab3] bg-[#27164d] text-[#9a63ff] sm:size-9">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-[#c4c8d5] sm:text-sm">{metric.label}</p>
                      <p className="font-display mt-1 truncate text-xl font-semibold leading-none tracking-[-0.06em] text-white sm:text-[1.55rem]">
                        {metric.value}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)] sm:text-sm">
                        {metric.detail}
                      </p>
                      {metric.progress !== undefined ? (
                        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#151c2d]">
                          <span
                            className="block h-full rounded-full bg-[#7c3aed]"
                            style={{ width: `${metric.progress ?? 0}%` }}
                          />
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
                </MotionDiv>
              );
            })}
          </div>
        </MotionDiv>
      ) : (
        <Card className="overflow-hidden border-[#27304a] bg-[#080b14]">
          <CardContent className="grid min-h-64 place-items-center p-5 text-center sm:min-h-80 sm:p-8">
            <div className="max-w-md">
              <span className="mx-auto grid size-16 place-items-center rounded-full border border-[#5b2ab3] bg-[#27164d] text-[#9a63ff]">
                <Dumbbell className="size-8" />
              </span>
              <p className="font-display mt-5 text-xl font-semibold tracking-[-0.05em] text-white sm:text-2xl">
                {routines.length > 0
                  ? "No tienes una rutina activa"
                  : "Aun no tienes rutinas guardadas"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                {routines.length > 0
                  ? "Activa una rutina desde tu listado para ver el seguimiento principal."
                  : "Explora el catalogo y guarda tu primera plantilla para verla aca."}
              </p>
              <Button asChild className="mt-5">
                <Link href={routines.length > 0 ? "/dashboard" : "/catalogo"}>
                  {routines.length > 0 ? "Ver mis rutinas" : "Ir al catalogo"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </section>
  );
}
