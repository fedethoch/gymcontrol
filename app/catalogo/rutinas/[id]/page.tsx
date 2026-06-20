import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  Dumbbell,
  FolderOpen,
  ListChecks,
  LogIn,
  Power,
  RefreshCw,
} from "lucide-react";
import { notFound } from "next/navigation";

import { RoutineDetailClient } from "@/app/catalogo/rutinas/[id]/RoutineDetailClient";
import { StatusToast } from "@/app/components/shared/StatusToast";
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
  const coverImageUrl = routine.imageUrl || routine.days[0]?.items[0]?.exercise.imageUrl || "";
  const objectiveLabel = ROUTINE_OBJECTIVE_LABELS[routine.objective];
  const isSavedState =
    savedRoutine !== null ||
    query.status === "created" ||
    query.status === "already-saved";
  const savedRoutineId = savedRoutine?.id ?? query.savedRoutineId;
  const isRoutineActive = savedRoutine?.isActive ?? query.status === "active";

  const toastMessage =
    query.status === "created"
      ? "Rutina guardada en tu cuenta."
      : query.status === "already-saved"
        ? "Rutina ya guardada en tu cuenta."
        : query.status === "active"
          ? "Rutina activada."
          : null;
  const toastError =
    query.status === "save-error"
      ? "No se pudo guardar la rutina. Intenta nuevamente."
      : query.status === "active-error"
        ? "No se pudo activar la rutina. Intenta nuevamente."
        : null;

  return (
    <section className="page-frame bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.13),transparent_30%),linear-gradient(180deg,#070a12_0%,#090d16_48%,#05070b_100%)]">
      <StatusToast message={toastMessage} clearParams={["status", "savedRoutineId"]} />
      <StatusToast message={toastError} isError clearParams={["status", "savedRoutineId"]} />

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* Breadcrumb row — tiny back btn visible on mobile only */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="sm:hidden -ml-1 size-6 text-[#9a63ff] hover:text-white"
            >
              <Link href="/catalogo" aria-label="Volver al catálogo">
                <ArrowLeft className="size-3.5" />
              </Link>
            </Button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]">
              Catalogo
            </p>
          </div>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.06em] text-white">
            Detalle de rutina
          </h1>
        </div>
        {/* Full back button — hidden on mobile, visible on sm+ */}
        <Button
          asChild
          variant="outline"
          className="hidden sm:flex w-fit border-[rgba(148,163,184,0.18)] bg-[#090d17]/80 text-white hover:border-[var(--accent)] hover:bg-[#111827]"
        >
          <Link href="/catalogo">
            <ArrowLeft className="size-4" />
            Volver al catalogo
          </Link>
        </Button>
      </header>

      <div className="-mt-3 grid gap-3 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="relative min-h-[8rem] overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.22)] bg-[#080b13] shadow-[0_22px_70px_rgba(0,0,0,0.42)] sm:min-h-[23rem] xl:min-h-[23.5rem]">
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
          {/* Mobile overlay: name + chips */}
          <div className="absolute bottom-0 left-0 right-0 xl:hidden bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-4 pt-12">
            <h2 className="font-display text-lg font-semibold text-white leading-tight">{routine.name}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(139,92,246,0.5)] bg-[rgba(20,15,36,0.7)] px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <CalendarDays className="size-3 text-[var(--accent-bright)]" />
                {dayCount} días
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(139,92,246,0.5)] bg-[rgba(20,15,36,0.7)] px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <RefreshCw className="size-3 text-[var(--accent-bright)]" />
                {objectiveLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(139,92,246,0.5)] bg-[rgba(20,15,36,0.7)] px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <BarChart3 className="size-3 text-[var(--accent-bright)]" />
                {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
              </span>
            </div>
          </div>

          {/* Desktop overlay: existing card */}
          <div className="hidden xl:block absolute bottom-5 left-5 right-5 max-w-sm rounded-xl border border-[rgba(148,163,184,0.13)] bg-[#101726]/88 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur">
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

        <aside className="hidden xl:flex flex-col rounded-2xl border border-[rgba(139,92,246,0.48)] bg-[linear-gradient(135deg,rgba(12,16,28,0.98),rgba(9,13,23,0.92))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.34)] sm:p-6 xl:min-h-[23.5rem]">
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

          <div className={isSavedState ? "mt-auto pt-4" : "mt-4"}>
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
          <Link href="/rutinas">
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
                      Nombre propio (opcional)
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

      {/* Mobile action buttons — shown below image, hidden on xl (aside handles it there) */}
      <div className="xl:hidden">
        {auth ? (
          isSavedState ? (
            <form action={activateRoutineFromCatalogAction} className="w-full">
              <input type="hidden" name="savedRoutineId" value={savedRoutineId ?? ""} />
              <input type="hidden" name="routineTemplateId" value={routine.id} />
              <Button
                type="submit"
                className={
                  isRoutineActive
                    ? "h-10 w-full rounded-lg border border-[#2f2847] bg-[#141827] px-4 text-sm text-[#c7bedf] shadow-none hover:bg-[#1a2033] hover:text-white"
                    : "h-10 w-full rounded-lg px-4 text-sm"
                }
                disabled={!savedRoutineId}
              >
                {isRoutineActive ? (
                  <Power className="size-4" />
                ) : (
                  <Check className="size-4" />
                )}
                {isRoutineActive ? "Desactivar rutina" : "Activar rutina"}
              </Button>
            </form>
          ) : (
            <form action={saveRoutineFromCatalogAction} className="grid gap-3">
              <input type="hidden" name="routineTemplateId" value={routine.id} />
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-white" htmlFor="customNameMobile">
                  Nombre propio (opcional)
                </label>
                <Input
                  id="customNameMobile"
                  name="customName"
                  maxLength={120}
                  placeholder={routine.name}
                />
              </div>
              <Button type="submit" className="h-10 rounded-lg text-sm">
                Guardar rutina
              </Button>
            </form>
          )
        ) : (
          <Button asChild className="h-10 rounded-lg px-4 text-sm">
            <Link href="/auth/login?reason=auth-required">
              <LogIn className="size-4" />
              Iniciar sesion para guardar
            </Link>
          </Button>
        )}
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
