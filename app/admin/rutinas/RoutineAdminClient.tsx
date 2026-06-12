"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PencilLine, Plus, Trash2 } from "lucide-react";

import { saveRoutineAction } from "@/app/admin/rutinas/actions";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { SectionEyebrow } from "@/app/components/ui/SectionEyebrow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import type { ExerciseCatalogItem } from "@/app/lib/exercises";
import {
  INITIAL_ROUTINE_FORM_STATE,
  type RoutineFormDayPayload,
  type RoutineFormItemPayload,
  type RoutineFormState,
} from "@/app/lib/routine-form";
import {
  ROUTINE_DIFFICULTIES,
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVES,
  ROUTINE_OBJECTIVE_LABELS,
  type RoutineDifficulty,
  type RoutineObjective,
} from "@/app/lib/routine-metadata";
import type { AdminRoutineListItem } from "@/app/lib/routines";

type RoutineAdminClientProps = {
  initialExercises: ExerciseCatalogItem[];
  initialRoutines: AdminRoutineListItem[];
};

export function RoutineAdminClient({
  initialExercises,
  initialRoutines,
}: RoutineAdminClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<RoutineDifficulty | "">("");
  const [objective, setObjective] = useState<RoutineObjective | "">("");
  const [days, setDays] = useState<RoutineFormDayPayload[]>(() => [createEmptyDay(1)]);
  const [serverState, setServerState] = useState<RoutineFormState>(
    INITIAL_ROUTINE_FORM_STATE,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditing = selectedRoutineId !== null;
  const hasExercises = initialExercises.length > 0;
  const submitDisabled = isPending || !hasExercises;

  function resetFormControls() {
    setSelectedRoutineId(null);
    setName("");
    setDescription("");
    setDifficulty("");
    setObjective("");
    setDays([createEmptyDay(1)]);
  }

  function resetFeedback() {
    setServerState(INITIAL_ROUTINE_FORM_STATE);
    setSuccessMessage(null);
  }

  function handleCancelEdit() {
    resetFormControls();
    resetFeedback();
  }

  function handleSelectRoutine(routine: AdminRoutineListItem) {
    setSelectedRoutineId(routine.id);
    setName(routine.name);
    setDescription(routine.description);
    setDifficulty(routine.difficulty);
    setObjective(routine.objective);
    setDays(
      routine.days.map((day) => ({
        id: day.id,
        clientId: day.id,
        dayName: day.dayName,
        items: day.items.map((item) => ({
          id: item.id,
          clientId: item.id,
          exerciseId: item.exerciseId,
          series: String(item.series),
          repetitions: item.repetitions,
          rir: String(item.rir),
          rest: item.rest,
        })),
      })),
    );
    resetFeedback();
  }

  function handleAddDay() {
    setDays((currentDays) => [...currentDays, createEmptyDay(currentDays.length + 1)]);
  }

  function handleRemoveDay(dayClientId: string) {
    setDays((currentDays) => currentDays.filter((day) => day.clientId !== dayClientId));
  }

  function handleDayNameChange(dayClientId: string, value: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId ? { ...day, dayName: value } : day,
      ),
    );
  }

  function handleAddItem(dayClientId: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId
          ? { ...day, items: [...day.items, createEmptyItem()] }
          : day,
      ),
    );
  }

  function handleRemoveItem(dayClientId: string, itemClientId: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId
          ? {
              ...day,
              items: day.items.filter((item) => item.clientId !== itemClientId),
            }
          : day,
      ),
    );
  }

  function handleItemFieldChange(
    dayClientId: string,
    itemClientId: string,
    field: keyof Omit<RoutineFormItemPayload, "clientId" | "id">,
    value: string,
  ) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId
          ? {
              ...day,
              items: day.items.map((item) =>
                item.clientId === itemClientId ? { ...item, [field]: value } : item,
              ),
            }
          : day,
      ),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      const result = await saveRoutineAction({
        routineId: selectedRoutineId ?? undefined,
        name,
        description,
        difficulty,
        objective,
        days,
      });

      if (result.status === "success") {
        resetFormControls();
        setSuccessMessage(result.message);
        router.refresh();
        return;
      }

      setServerState(result);
    });
  }

  return (
    <section className="page-frame">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionEyebrow>Admin</SectionEyebrow>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
            Rutinas
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
            Crea y edita rutinas semanales completas usando el catalogo de
            ejercicios de G6 como fuente de verdad del builder.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">{initialRoutines.length} rutinas</Badge>
          <Badge variant="neutral">{initialExercises.length} ejercicios</Badge>
          <Badge variant="neutral">
            {isEditing ? "Modo edicion" : "Modo alta"}
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle>{isEditing ? "Editar rutina" : "Crear rutina"}</CardTitle>
            <CardDescription>
              El guardado persiste rutina, dias y filas en orden estable.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                  Nombre de la rutina
                  <Input
                    name="name"
                    placeholder="Ej. Hipertrofia superior / inferior"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {serverState.fieldErrors.name ? (
                    <span className="text-xs text-[#f8b4b4]">
                      {serverState.fieldErrors.name}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                  Descripcion
                  <Textarea
                    className="min-h-28 resize-none"
                    name="description"
                    placeholder="Contexto breve, enfoque o nivel sugerido."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  {serverState.fieldErrors.description ? (
                    <span className="text-xs text-[#f8b4b4]">
                      {serverState.fieldErrors.description}
                    </span>
                  ) : null}
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                  Dificultad
                  <Select
                    value={difficulty}
                    onValueChange={(value) => setDifficulty(value as RoutineDifficulty)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTINE_DIFFICULTIES.map((option) => (
                        <SelectItem key={option} value={option}>
                          {ROUTINE_DIFFICULTY_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {serverState.fieldErrors.difficulty ? (
                    <span className="text-xs text-[#f8b4b4]">
                      {serverState.fieldErrors.difficulty}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                  Objetivo
                  <Select
                    value={objective}
                    onValueChange={(value) => setObjective(value as RoutineObjective)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTINE_OBJECTIVES.map((option) => (
                        <SelectItem key={option} value={option}>
                          {ROUTINE_OBJECTIVE_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {serverState.fieldErrors.objective ? (
                    <span className="text-xs text-[#f8b4b4]">
                      {serverState.fieldErrors.objective}
                    </span>
                  ) : null}
                </label>
              </div>

              {!hasExercises ? (
                <div className="rounded-2xl border border-[#7a5a23] bg-[#2c2210]/70 px-4 py-3 text-sm text-[#f8dfaa]">
                  Necesitas al menos un ejercicio cargado en `/admin/ejercicios`
                  antes de guardar rutinas.
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Semana editable</p>
                  <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                    Agrega dias y filas. El orden final se toma del orden visible.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handleAddDay}>
                  <Plus className="size-4" />
                  Agregar dia
                </Button>
              </div>

              {serverState.structureErrors.days ? (
                <div className="rounded-2xl border border-[#7a2630] bg-[#3b1419]/60 px-4 py-3 text-sm text-[#ffd6db]">
                  {serverState.structureErrors.days}
                </div>
              ) : null}

              <div className="grid gap-4">
                {days.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-alt)] px-5 py-8 text-center">
                    <p className="font-display text-lg font-semibold text-white">
                      Sin dias cargados
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                      Agrega el primer dia para empezar a construir la rutina.
                    </p>
                  </div>
                ) : (
                  days.map((day, dayIndex) => {
                    const dayErrors =
                      serverState.structureErrors.dayErrors[day.clientId];

                    return (
                      <div
                        key={day.clientId}
                        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]"
                      >
                        <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="accent">Dia {dayIndex + 1}</Badge>
                              <Badge variant="neutral">
                                {day.items.length} filas
                              </Badge>
                            </div>
                            <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                              Nombre visible del dia
                              <Input
                                placeholder={`Dia ${dayIndex + 1}`}
                                type="text"
                                value={day.dayName}
                                onChange={(event) =>
                                  handleDayNameChange(day.clientId, event.target.value)
                                }
                              />
                              {dayErrors?.dayName ? (
                                <span className="text-xs text-[#f8b4b4]">
                                  {dayErrors.dayName}
                                </span>
                              ) : null}
                            </label>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleAddItem(day.clientId)}
                            >
                              <Plus className="size-4" />
                              Agregar fila
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveDay(day.clientId)}
                            >
                              <Trash2 className="size-4" />
                              Quitar dia
                            </Button>
                          </div>
                        </div>

                        {dayErrors?.items ? (
                          <div className="border-b border-[#7a2630] bg-[#3b1419]/40 px-5 py-3 text-sm text-[#ffd6db]">
                            {dayErrors.items}
                          </div>
                        ) : null}

                        <div className="grid gap-3 p-5">
                          {day.items.map((item, itemIndex) => {
                            const itemErrors = dayErrors?.itemErrors[item.clientId] ?? {};

                            return (
                              <div
                                key={item.clientId}
                                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                              >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8697]">
                                    Fila {itemIndex + 1}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      handleRemoveItem(day.clientId, item.clientId)
                                    }
                                  >
                                    <Trash2 className="size-4" />
                                    Quitar
                                  </Button>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-[2fr_0.7fr_0.9fr_0.7fr_0.9fr]">
                                  <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                    Ejercicio
                                    <Select
                                      value={item.exerciseId}
                                      onValueChange={(value) =>
                                        handleItemFieldChange(
                                          day.clientId,
                                          item.clientId,
                                          "exerciseId",
                                          value,
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un ejercicio" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {initialExercises.map((exercise) => (
                                          <SelectItem key={exercise.id} value={exercise.id}>
                                            {exercise.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {itemErrors.exerciseId ? (
                                      <span className="text-xs text-[#f8b4b4]">
                                        {itemErrors.exerciseId}
                                      </span>
                                    ) : null}
                                  </label>

                                  <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                    Series
                                    <Input
                                      inputMode="numeric"
                                      placeholder="4"
                                      type="text"
                                      value={item.series}
                                      onChange={(event) =>
                                        handleItemFieldChange(
                                          day.clientId,
                                          item.clientId,
                                          "series",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    {itemErrors.series ? (
                                      <span className="text-xs text-[#f8b4b4]">
                                        {itemErrors.series}
                                      </span>
                                    ) : null}
                                  </label>

                                  <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                    Repeticiones
                                    <Input
                                      placeholder="8-10"
                                      type="text"
                                      value={item.repetitions}
                                      onChange={(event) =>
                                        handleItemFieldChange(
                                          day.clientId,
                                          item.clientId,
                                          "repetitions",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    {itemErrors.repetitions ? (
                                      <span className="text-xs text-[#f8b4b4]">
                                        {itemErrors.repetitions}
                                      </span>
                                    ) : null}
                                  </label>

                                  <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                    RIR
                                    <Input
                                      inputMode="numeric"
                                      placeholder="2"
                                      type="text"
                                      value={item.rir}
                                      onChange={(event) =>
                                        handleItemFieldChange(
                                          day.clientId,
                                          item.clientId,
                                          "rir",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    {itemErrors.rir ? (
                                      <span className="text-xs text-[#f8b4b4]">
                                        {itemErrors.rir}
                                      </span>
                                    ) : null}
                                  </label>

                                  <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                    Descanso
                                    <Input
                                      placeholder="90s"
                                      type="text"
                                      value={item.rest}
                                      onChange={(event) =>
                                        handleItemFieldChange(
                                          day.clientId,
                                          item.clientId,
                                          "rest",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    {itemErrors.rest ? (
                                      <span className="text-xs text-[#f8b4b4]">
                                        {itemErrors.rest}
                                      </span>
                                    ) : null}
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {serverState.status === "error" && serverState.message ? (
                <div className="rounded-2xl border border-[#7a2630] bg-[#3b1419]/60 px-4 py-3 text-sm text-[#ffd6db]">
                  {serverState.message}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-[#24583d] bg-[#11281c]/70 px-4 py-3 text-sm text-[#c7f7d9]">
                  {successMessage}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                {isEditing ? (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                ) : (
                  <span className="text-xs text-[#7d8697]">
                    La edicion de hijos usa reemplazo estructural completo en este MVP.
                  </span>
                )}

                <Button disabled={submitDisabled} type="submit">
                  {isPending ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Guardando...
                    </>
                  ) : isEditing ? (
                    "Actualizar"
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle>Listado de rutinas</CardTitle>
            <CardDescription>
              Selecciona una rutina para editarla en la misma pantalla.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--border)] px-0 py-0">
            {initialRoutines.length === 0 ? (
              <div className="grid min-h-72 place-items-center px-6 py-10 text-center">
                <div className="max-w-sm">
                  <p className="font-display text-lg font-semibold text-white">
                    Todavia no hay rutinas
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    Guarda la primera desde el builder para dejar listo el catalogo
                    base de G8, G9 y G10.
                  </p>
                </div>
              </div>
            ) : (
              initialRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className="grid gap-4 px-5 py-4 transition-colors hover:bg-[var(--card-alt)] sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display truncate text-sm font-semibold text-white">
                        {routine.name}
                      </h3>
                      <Badge variant="neutral">{routine.dayCount} dias</Badge>
                      <Badge variant="neutral">{routine.itemCount} filas</Badge>
                      <Badge variant="outline">
                        {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
                      </Badge>
                      <Badge variant="outline">
                        {ROUTINE_OBJECTIVE_LABELS[routine.objective]}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--foreground-muted)]">
                      {routine.description || "Sin descripcion."}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#7d8697]">
                      {routine.createdAtLabel}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSelectRoutine(routine)}
                  >
                    <PencilLine className="size-4" />
                    Editar
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </section>
  );
}

function createEmptyDay(order: number): RoutineFormDayPayload {
  return {
    clientId: crypto.randomUUID(),
    dayName: `Dia ${order}`,
    items: [createEmptyItem()],
  };
}

function createEmptyItem(): RoutineFormItemPayload {
  return {
    clientId: crypto.randomUUID(),
    exerciseId: "",
    series: "",
    repetitions: "",
    rir: "",
    rest: "",
  };
}
