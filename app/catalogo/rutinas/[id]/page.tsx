import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Dumbbell,
  FolderOpen,
  ListChecks,
  LogIn,
  Power,
  RefreshCw,
} from "lucide-react";
import { notFound } from "next/navigation";

import { RoutineDetailClient } from "@/app/catalogo/rutinas/[id]/RoutineDetailClient";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { getOptionalAuthContext } from "@/app/lib/auth";
import {
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVE_LABELS,
} from "@/app/lib/routine-metadata";
import { getRoutineById } from "@/app/lib/routines";
import { getSavedRoutineByTemplateForUser } from "@/app/lib/saved-routines";
import {
  activateRoutineFromCatalogAction,
  saveRoutineFromCatalogAction,
} from "@/app/catalogo/rutinas/[id]/actions";

type CatalogRoutineDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    savedRoutineId?: string;
  }>;
};

export default async function CatalogRoutineDetailPage({
  params,
  searchParams,
}: CatalogRoutineDetailPageProps) {
  const [{ id }, auth, query] = await Promise.all([params, getOptionalAuthContext(), searchParams]);
  const routine = await getRoutineById(id);

  if (!routine) {
    notFound();
  }

  const savedRoutine = auth
    ? await getSavedRoutineByTemplateForUser({
        routineTemplateId: id,
        userId: auth.user.id,
      })
    : null;

  const dayCount = routine.days.length;
  const itemCount = routine.days.reduce((total, day) => total + day.items.length, 0);
  const coverImageUrl = routine.days[0]?.items[0]?.exercise.imageUrl || "";
  const objectiveLabel = ROUTINE_OBJECTIVE_LABELS[routine.objective];
  const isSaveError = query.status === "save-error";
  const isActiveError = query.status === "active-error";
  const isSavedState =
    savedRoutine !== null ||
    query.status === "created" ||
    query.status === "already-saved";
  const savedRoutineId = savedRoutine?.id ?? query.savedRoutineId;
  const isRoutineActive = savedRoutine?.isActive ?? query.status === "active";
  const showSavedFeedback = isRoutineActive;

  return (
    <section className="page-frame bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.13),transparent_30%),linear-gradient(180deg,#070a12_0%,#090d16_48%,#05070b_100%)]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]">
            Catalogo
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">
            Detalle de rutina
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
            Revisa la estructura completa antes de guardar la rutina.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="w-fit border-[rgba(148,163,184,0.18)] bg-[#090d17]/80 text-white hover:border-[var(--accent)] hover:bg-[#111827]"
        >
          <Link href="/catalogo">
            <ArrowLeft className="size-4" />
            Volver al catalogo
          </Link>
        </Button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="relative min-h-[19rem] overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.22)] bg-[#080b13] shadow-[0_22px_70px_rgba(0,0,0,0.42)] sm:min-h-[23rem] xl:min-h-[23.5rem]">
          {coverImageUrl ? (
            <>
              <Image
                alt={routine.name}
                className="object-cover saturate-[0.82]"
                fill
                sizes="(max-width: 1280px) 100vw, 50vw"
                src={coverImageUrl}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,7,17,0.42),rgba(8,7,17,0.18)),radial-gradient(circle_at_22%_22%,rgba(124,58,237,0.32),transparent_32%),linear-gradient(180deg,transparent_40%,rgba(5,7,11,0.78)_100%)]" />
            </>
          ) : (
            <div className="thumb-fitness absolute inset-0" />
          )}
          <div className="absolute bottom-5 left-5 right-5 max-w-sm rounded-xl border border-[rgba(148,163,184,0.13)] bg-[#101726]/88 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-xl bg-[rgba(124,58,237,0.16)] text-[var(--accent-bright)]">
                <Dumbbell className="size-6" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-white">
                  Rutina de {objectiveLabel.toLowerCase()}
                </p>
                <p className="mt-1 text-sm text-[#c4ccda]">
                  Enfoque en rendimiento y progresion.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col rounded-2xl border border-[rgba(139,92,246,0.48)] bg-[linear-gradient(135deg,rgba(12,16,28,0.98),rgba(9,13,23,0.92))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.34)] sm:p-6 xl:min-h-[23.5rem]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-bright)]">
            DETALLE DE RUTINA
          </p>
          <h2 className="font-display mt-2.5 text-3xl font-semibold tracking-[-0.06em] text-white">
            {routine.name}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c7cedd] sm:text-base">
            {routine.description || "Rutina semanal disponible para explorar antes de guardar."}
          </p>

          {!isSavedState || isRoutineActive ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <StatPill icon={CalendarDays} label={`${dayCount} dias`} />
              <StatPill icon={ListChecks} label={`${itemCount} filas`} />
              <StatPill
                icon={BarChart3}
                label={ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
              />
              <StatPill icon={RefreshCw} label={objectiveLabel} />
            </div>
          ) : null}

          {showSavedFeedback ? (
            <div className="mt-4 rounded-xl border border-[rgba(139,92,246,0.5)] bg-[rgba(55,31,101,0.28)] p-4 text-sm leading-6 text-[#eee7ff]">
              <div className="flex gap-3.5">
                <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-[var(--accent-bright)]" />
                <div>
                  <p className="font-semibold text-white">Rutina guardada en tu cuenta.</p>
                  <p className="mt-1 text-[#c7bedf]">
                    Puedes abrirla o gestionarla desde tus rutinas guardadas.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isSavedState && !isRoutineActive ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <InfoTile label="Dias por semana" value={`${dayCount}`} />
              <InfoTile label="Filas cargadas" value={`${itemCount}`} />
              <InfoTile
                label="Nivel"
                value={ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
              />
              <InfoTile label="Objetivo" value={objectiveLabel} />
            </div>
          ) : null}

          {isSaveError || isActiveError ? (
            <div className="mt-4 rounded-xl border border-[rgba(248,113,113,0.34)] bg-[rgba(88,28,45,0.34)] p-4 text-sm leading-6 text-[#fbd5df]">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#fda4af]" />
                <div>
                  <p className="font-semibold text-white">
                    {isActiveError
                      ? "No se pudo activar la rutina. Intenta nuevamente."
                      : "No se pudo guardar la rutina. Intenta nuevamente."}
                  </p>
                  <p className="mt-1 text-[#f5b8c7]">
                    Revisa la sesion e intenta nuevamente.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className={
              isSavedState && !isSaveError && !isActiveError
                ? "mt-auto pt-4"
                : "mt-4"
            }
          >
            {auth ? (
              isSavedState ? (
                <div className="flex flex-wrap gap-3">
                  <form action={activateRoutineFromCatalogAction}>
                    <input type="hidden" name="savedRoutineId" value={savedRoutineId ?? ""} />
                    <input type="hidden" name="routineTemplateId" value={routine.id} />
                    <Button
                      type="submit"
                      className={
                        isRoutineActive
                          ? "h-11 rounded-lg border border-[#2f2847] bg-[#141827] px-5 text-base text-[#c7bedf] shadow-none hover:bg-[#1a2033] hover:text-white"
                          : "h-11 rounded-lg px-5 text-base"
                      }
                      disabled={!savedRoutineId}
                    >
                      {isRoutineActive ? (
                        <Power className="size-5" />
                      ) : (
                        <Check className="size-5" />
                      )}
                      {isRoutineActive ? "Desactivar rutina" : "Activar rutina"}
                    </Button>
                  </form>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-lg border-[rgba(148,163,184,0.25)] bg-transparent px-5 text-base"
                  >
                    <Link href="/dashboard/rutinas">
                      <FolderOpen className="size-5" />
                      Ir a mis rutinas
                    </Link>
                  </Button>
                </div>
              ) : (
                <form action={saveRoutineFromCatalogAction} className="grid gap-3">
                  <input type="hidden" name="routineTemplateId" value={routine.id} />
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-semibold text-white"
                      htmlFor="customName"
                    >
                      Nombre propio opcional
                    </label>
                    <Input
                      id="customName"
                      name="customName"
                      maxLength={120}
                      placeholder={routine.name}
                    />
                  </div>
                  <Button type="submit" className="h-11 rounded-lg text-base">
                    Guardar rutina
                  </Button>
                </form>
              )
            ) : (
              <Button asChild className="h-11 rounded-lg px-5 text-base">
                <Link href="/auth/login?reason=auth-required">
                  <LogIn className="size-5" />
                  Iniciar sesion para guardar
                </Link>
              </Button>
            )}
          </div>
        </aside>
      </div>

      <RoutineDetailClient routine={routine} />
    </section>
  );
}

type StatPillProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
};

function StatPill({ icon: Icon, label }: StatPillProps) {
  return (
    <span className="inline-flex items-center gap-3 rounded-xl border border-[rgba(139,92,246,0.58)] bg-[rgba(20,15,36,0.5)] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <Icon className="size-[18px] text-[var(--accent-bright)]" />
      {label}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[3.75rem] rounded-lg border border-[rgba(148,163,184,0.14)] bg-[rgba(11,16,28,0.66)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8f98ad]">
        {label}
      </p>
      <p className="mt-1 truncate font-display text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
