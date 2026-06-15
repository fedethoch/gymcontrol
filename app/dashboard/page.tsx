import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";

import { DashboardRoutinesClient } from "@/app/dashboard/DashboardRoutinesClient";
import { StatusToast } from "@/app/components/shared/StatusToast";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { fadeUp, MotionDiv, staggerContainer } from "@/app/components/ui/motion";
import { requireUser } from "@/app/lib/auth";
import {
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVE_LABELS,
} from "@/app/lib/routine-metadata";
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
          className="grid gap-3 xl:grid-cols-[minmax(0,1.43fr)_minmax(22rem,1fr)]"
        >
          <MotionDiv variants={fadeUp}>
          <Card className="relative min-h-[13rem] overflow-hidden border-[#27304a] bg-[#080b14] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#6d40ef] lg:min-h-[17.55rem]">
            {activeRoutine.coverImageUrl ? (
              <Image
                alt={activeRoutine.displayName}
                className="object-cover saturate-[0.82]"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 55vw"
                src={activeRoutine.coverImageUrl}
              />
            ) : (
              <div className="thumb-fitness absolute inset-0" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,11,0.98)_0%,rgba(5,7,11,0.86)_32%,rgba(5,7,11,0.2)_100%),radial-gradient(circle_at_72%_78%,rgba(124,58,237,0.35),transparent_29%)]" />
            <CardContent className="relative flex min-h-[13rem] max-w-[48rem] flex-col px-4 py-4 sm:px-6 lg:min-h-[17.55rem] lg:px-8 lg:py-6">
              <div className="flex flex-1 items-end">
                <div className="grid w-full gap-2.5 pb-1 sm:gap-3.5">
                  <h2 className="font-display max-w-3xl text-2xl font-semibold tracking-[-0.06em] text-white sm:text-[2.65rem] sm:leading-none sm:tracking-[-0.07em]">
                    {activeRoutine.displayName}
                  </h2>
                  <p className="max-w-3xl text-sm leading-5 text-[#d6dbe7] sm:text-base">
                    {activeRoutine.templateDescription ||
                      `Plantilla activa: ${activeRoutine.templateName}`}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-[#20283a] bg-[#070d18]/72 px-2.5 py-1.5 text-xs font-medium text-[#b7bfce] sm:px-3 sm:py-2 sm:text-sm">
                      <CalendarDays className="size-4 text-[#9a63ff]" />
                      {activeRoutine.dayCount} días
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-[#20283a] bg-[#070d18]/72 px-2.5 py-1.5 text-xs font-medium text-[#b7bfce] sm:px-3 sm:py-2 sm:text-sm">
                      <TrendingUp className="size-4 text-[#9a63ff]" />
                      {ROUTINE_DIFFICULTY_LABELS[activeRoutine.difficulty]}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-[#20283a] bg-[#070d18]/72 px-2.5 py-1.5 text-xs font-medium text-[#b7bfce] sm:px-3 sm:py-2 sm:text-sm">
                      <Target className="size-4 text-[#9a63ff]" />
                      {ROUTINE_OBJECTIVE_LABELS[activeRoutine.objective]}
                    </span>
                  </div>
                </div>
              </div>
              <Button asChild className="mt-4 h-10 w-full justify-between rounded-lg px-5 sm:w-48 sm:px-7">
                <Link href={`/catalogo/rutinas/${activeRoutine.routineTemplateId}`}>
                  Abrir rutina
                  <TrendingUp className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          </MotionDiv>

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

      {routines.length > 0 ? (
        <DashboardRoutinesClient
          routines={routines}
          activeRoutineId={activeRoutine?.id ?? null}
        />
      ) : null}
    </section>
  );
}
