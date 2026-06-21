"use client";

import { AlertCircle, Dumbbell, Loader2, PlayCircle, Star } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/app/components/ui/Badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/app/components/ui/Sheet";
import {
  MUSCLE_BADGE_STYLES,
  MUSCLE_GRADIENTS,
  equipmentLabel,
  muscleLabel,
} from "@/app/lib/exercise-form";
import { cn } from "@/app/lib/utils";

export type ExerciseHistoryEntry = {
  date: string;
  weight: string | null;
  reps: string | null;
};

export type ExerciseDetail = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  videoUrl?: string | null;
  exerciseDbId?: string | null;
  muscleGroup?: string | null;
  equipment?: string | null;
  series?: number;
  repsTarget?: string;
  rir?: number | string;
  rest?: string;
  minReps?: number | null;
  maxReps?: number | null;
  steps?: string[];
  tips?: string[];
  history?: ExerciseHistoryEntry[];
};

type ExerciseDetailModalProps = {
  exercise: ExerciseDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS = [
  { key: "descripcion", label: "Descripcion" },
  { key: "tecnica", label: "Tecnica" },
  { key: "demostracion", label: "Demostracion" },
  { key: "historial", label: "Historial" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type ExerciseDemoResponse =
  | {
      available: true;
      source: "manual" | "exercisedb";
      name: string;
      mediaUrl: string;
      mediaType: "video" | "gif";
      providerExerciseId?: string;
      instructions?: string[];
      imageUrl?: string;
    }
  | {
      available: false;
      reason: "missing-api-key" | "not-found" | "provider-error";
      message: string;
    };

type DemoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; demo: Extract<ExerciseDemoResponse, { available: true }> }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export function ExerciseDetailModal({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailModalProps) {
  const [tab, setTab] = useState<TabKey>("descripcion");
  const [demoState, setDemoState] = useState<DemoState>({ status: "idle" });
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const displayExercise = exercise;

  function handleTabSelect(nextTab: TabKey) {
    setTab(nextTab);

    if (nextTab !== "demostracion" || !displayExercise) {
      return;
    }

    if (demoState.status === "ready" || demoState.status === "loading") {
      return;
    }

    loadDemo(displayExercise);
  }

  function loadDemo(targetExercise: ExerciseDetail) {
    if (targetExercise.videoUrl) {
      setDemoState({
        status: "ready",
        demo: {
          available: true,
          source: "manual",
          name: targetExercise.name,
          mediaUrl: targetExercise.videoUrl,
          mediaType: "video",
        },
      });
      return;
    }

    setDemoState({ status: "loading" });

    fetch(`/api/exercises/${targetExercise.id}/demo`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as ExerciseDemoResponse;

        if (!data.available) {
          setDemoState({ status: "unavailable", message: data.message });
          return;
        }

        setDemoState({ status: "ready", demo: data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDemoState({
          status: "error",
          message: "No se pudo cargar la demostracion.",
        });
      });
  }

  const hasIdealRange =
    displayExercise?.minReps !== null &&
    displayExercise?.minReps !== undefined &&
    displayExercise?.maxReps !== null &&
    displayExercise?.maxReps !== undefined;

  const muscleGroup = displayExercise?.muscleGroup ?? null;
  const equipment = displayExercise?.equipment ?? null;
  const heroGradient = muscleGroup ? MUSCLE_GRADIENTS[muscleGroup] ?? MUSCLE_GRADIENTS.Core : MUSCLE_GRADIENTS.Core;
  const steps = displayExercise?.steps ?? [];
  const tips = displayExercise?.tips ?? [];
  const history = displayExercise?.history ?? [];

  return (
    <Sheet
      open={open && displayExercise !== null}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
          setTab("descripcion");
          setHeroImgFailed(false);
          if (displayExercise) {
            loadDemo(displayExercise);
          }
        } else {
          setDemoState({ status: "idle" });
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-full overflow-hidden p-0 sm:max-w-[34rem]"
        aria-describedby="exercise-detail-description"
      >
        {displayExercise ? (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="h-0.5 shrink-0 bg-[linear-gradient(90deg,transparent,#7c3aed_25%,#b995ff_60%,transparent)]" />

            {/* Hero */}
            <div className="relative h-[218px] shrink-0 overflow-hidden">
              {tab === "demostracion" && demoState.status === "ready" && demoState.demo.mediaType === "gif" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={displayExercise.name}
                    className="h-full w-full object-cover"
                    src={demoState.demo.mediaUrl}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,7,11,0.85)_100%)]" />
                </>
              ) : demoState.status === "ready" && demoState.demo.imageUrl && !heroImgFailed ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={displayExercise.name}
                    className="h-full w-full object-cover"
                    src={demoState.demo.imageUrl}
                    onError={() => setHeroImgFailed(true)}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,7,11,0.85)_100%)]" />
                </>
              ) : displayExercise.imageUrl && !heroImgFailed ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={displayExercise.name}
                    className="h-full w-full object-cover"
                    src={displayExercise.imageUrl}
                    onError={() => setHeroImgFailed(true)}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,7,11,0.85)_100%)]" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: heroGradient }} />
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(124,58,237,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.055) 1px,transparent 1px)",
                      backgroundSize: "38px 38px",
                      maskImage: "radial-gradient(ellipse 80% 100% at 30% 50%, black 0%, transparent 75%)",
                    }}
                  />
                  <p
                    aria-hidden="true"
                    className="font-display pointer-events-none absolute -bottom-4 -right-1 text-[118px] font-extrabold uppercase leading-none tracking-[-0.07em] text-[rgba(124,58,237,0.08)]"
                  >
                    {muscleGroup ?? ""}
                  </p>
                  {!muscleGroup ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-[var(--foreground-muted)]">
                      <Dumbbell className="size-8" aria-hidden="true" />
                      <p className="text-sm">Imagen no disponible</p>
                    </div>
                  ) : null}
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                <SheetTitle className="font-display text-2xl font-bold tracking-[-0.05em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
                  {displayExercise.name}
                </SheetTitle>
                <div className="flex flex-wrap gap-1.5">
                  {muscleGroup ? (
                    <Badge
                      className={cn(
                        "border",
                        MUSCLE_BADGE_STYLES[muscleGroup] ?? MUSCLE_BADGE_STYLES.Core,
                      )}
                    >
                      {muscleLabel(muscleGroup)}
                    </Badge>
                  ) : null}
                  {equipment ? <Badge variant="neutral">{equipmentLabel(equipment)}</Badge> : null}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 border-b border-[var(--border)] px-5">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleTabSelect(item.key)}
                  className={cn(
                    "-mb-px border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors",
                    tab === item.key
                      ? "border-[var(--accent-bright)] text-white"
                      : "border-transparent text-[#7887a6] hover:text-[var(--foreground-muted)]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <SheetDescription id="exercise-detail-description" className="sr-only">
                Detalle del ejercicio {displayExercise.name}
              </SheetDescription>

              {tab === "descripcion" ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                      Descripcion
                    </p>
                    <p className="text-sm leading-7 text-[var(--foreground-muted)]">
                      {displayExercise.description || "Sin descripcion adicional."}
                    </p>
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="flex flex-col gap-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                      Clasificacion
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      <SpecChip label="Grupo muscular" value={muscleLabel(muscleGroup) ?? "Sin definir"} />
                      <SpecChip label="Equipamiento" value={equipmentLabel(equipment) ?? "Sin definir"} />
                      <SpecChip
                        label="Rango ideal"
                        value={hasIdealRange ? `${displayExercise.minReps}-${displayExercise.maxReps} reps` : "Sin definir"}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "tecnica" ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                      Pasos de ejecucion
                    </p>
                    {steps.length > 0 ? (
                      <div className="flex flex-col gap-3.5">
                        {steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3.5">
                            <span className="mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-lg border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.12)] font-display text-[11.5px] font-bold text-[var(--accent-bright)]">
                              {index + 1}
                            </span>
                            <span className="pt-0.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#7887a6]">
                        Todavia no hay pasos de ejecucion para este ejercicio.
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                      Claves de tecnica
                    </p>
                    {tips.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
                            <span className="mt-2 size-[5px] shrink-0 rounded-full bg-[var(--accent-bright)] shadow-[0_0_6px_rgba(185,149,255,0.5)]" />
                            {tip}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#7887a6]">
                        Todavia no hay claves de tecnica para este ejercicio.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {tab === "demostracion" ? (
                <DemoPanel
                  state={demoState}
                  exerciseName={displayExercise.name}
                  onRetry={() => loadDemo(displayExercise)}
                />
              ) : null}

              {tab === "historial" ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                    Progresion de carga
                  </p>
                  {history.length > 0 ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4">
                      <div className="mb-2 flex justify-between text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#7887a6]">
                        <span>Fecha</span>
                        <span>Peso</span>
                        <span>Reps</span>
                      </div>
                      <div className="flex flex-col">
                        {history.map((entry, index) => {
                          const maxWeight = Math.max(
                            ...history.map((h) => Number.parseFloat(h.weight ?? "0") || 0),
                          );
                          const entryWeight = Number.parseFloat(entry.weight ?? "0") || 0;
                          const isPr = entryWeight > 0 && entryWeight === maxWeight;

                          return (
                            <div
                              key={index}
                              className={cn(
                                "flex items-center justify-between py-2 text-sm",
                                index < history.length - 1 && "border-b border-[rgba(37,43,54,0.35)]",
                              )}
                            >
                              <span className="font-mono text-xs text-[#7887a6]">{entry.date}</span>
                              <span className="flex items-center gap-1.5 font-display font-bold tracking-[-0.03em] text-white">
                                {entry.weight ?? "--"} kg
                                {isPr ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#4ade80]">
                                    <Star className="size-2.5" aria-hidden="true" />
                                    PR
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-xs text-[var(--foreground-muted)]">{entry.reps ?? "--"} reps</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#7887a6]">
                      Todavia no hay historial registrado para este ejercicio.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DemoPanel({
  state,
  exerciseName,
  onRetry,
}: {
  state: DemoState;
  exerciseName: string;
  onRetry: () => void;
}) {
  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="grid min-h-[18rem] place-items-center rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-6 text-center">
        <div className="grid gap-3 justify-items-center">
          <Loader2 className="size-7 animate-spin text-[var(--accent-bright)]" aria-hidden="true" />
          <p className="text-sm font-semibold text-white">Cargando demostracion</p>
          <p className="max-w-xs text-xs leading-5 text-[#7887a6]">
            Buscando una referencia visual para {exerciseName}.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "ready") {
    return (
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-black">
          <DemoMedia demo={state.demo} exerciseName={exerciseName} />
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4">
          <PlayCircle className="mt-0.5 size-4 shrink-0 text-[var(--accent-bright)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {state.demo.source === "manual" ? "Video del ejercicio" : state.demo.name}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#7887a6]">
              La demostracion se reproduce dentro de la app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[18rem] place-items-center rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-6 text-center">
      <div className="grid max-w-xs gap-3 justify-items-center">
        <AlertCircle className="size-7 text-[#facc15]" aria-hidden="true" />
        <p className="text-sm font-semibold text-white">
          {state.status === "unavailable" ? "Demostracion no disponible" : "No se pudo cargar"}
        </p>
        <p className="text-xs leading-5 text-[#7887a6]">{state.message}</p>
        {state.status === "error" ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent-bright)] hover:text-white"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DemoMedia({
  demo,
  exerciseName,
}: {
  demo: Extract<ExerciseDemoResponse, { available: true }>;
  exerciseName: string;
}) {
  const embedUrl = resolveEmbedUrl(demo.mediaUrl);

  if (embedUrl) {
    return (
      <iframe
        className="aspect-video w-full"
        src={embedUrl}
        title={`Demostracion de ${exerciseName}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (demo.mediaType === "video") {
    return (
      <video
        className="aspect-video w-full bg-black"
        src={demo.mediaUrl}
        controls
        preload="metadata"
      >
        Tu navegador no puede reproducir este video.
      </video>
    );
  }

  return (
    // ExerciseDB streams GIFs, so a plain image element avoids Next image optimization/cache.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="aspect-square w-full bg-black object-contain sm:aspect-video"
      src={demo.mediaUrl}
      alt={`Demostracion de ${exerciseName}`}
    />
  );
}

function resolveEmbedUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }

    if (url.hostname.endsWith("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname.endsWith("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3.5 py-2.5">
      <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#7887a6]">
        {label}
      </span>
      <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--foreground)]">{value}</span>
    </div>
  );
}
