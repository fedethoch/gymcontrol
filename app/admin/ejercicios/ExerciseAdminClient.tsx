"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoaderCircle, PencilLine, Upload } from "lucide-react";

import { saveExerciseAction } from "@/app/admin/ejercicios/actions";
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
import { Textarea } from "@/app/components/ui/Textarea";
import {
  EXERCISE_IMAGE_ACCEPT,
  EXERCISE_IMAGE_BUCKET,
} from "@/app/lib/exercise-config";
import {
  INITIAL_EXERCISE_FORM_STATE,
  type ExerciseFormState,
} from "@/app/lib/exercise-form";
import type { AdminExerciseListItem } from "@/app/lib/exercises";
import { validateExerciseImageFile } from "@/app/lib/exercise-validation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type ExerciseAdminClientProps = {
  initialExercises: AdminExerciseListItem[];
};

type UploadStatus = "idle" | "uploading" | "uploaded";

export function ExerciseAdminClient({
  initialExercises,
}: ExerciseAdminClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [serverState, setServerState] = useState<ExerciseFormState>(
    INITIAL_EXERCISE_FORM_STATE,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const isEditing = selectedExerciseId !== null;
  const submitDisabled =
    isPending || uploadStatus === "uploading" || (!isEditing && !imageUrl);

  function resetFormControls() {
    clearObjectUrl();
    setSelectedExerciseId(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setPreviewSrc(null);
    setUploadStatus("idle");
    setUploadMessage(null);
    setSelectedFileName(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetFeedback() {
    setServerState(INITIAL_EXERCISE_FORM_STATE);
    setSuccessMessage(null);
  }

  function handleCancelEdit() {
    resetFormControls();
    resetFeedback();
  }

  function handleSelectExercise(exercise: AdminExerciseListItem) {
    clearObjectUrl();
    setSelectedExerciseId(exercise.id);
    setName(exercise.name);
    setDescription(exercise.description);
    setImageUrl(exercise.imageUrl);
    setPreviewSrc(exercise.imageUrl);
    setUploadStatus("idle");
    setUploadMessage("Imagen actual cargada.");
    setSelectedFileName(null);
    resetFeedback();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    resetFeedback();
    setSelectedFileName(file.name);

    const validation = validateExerciseImageFile(file);

    if (!validation.ok) {
      setUploadStatus("idle");
      setUploadMessage(validation.message);
      event.target.value = "";
      return;
    }

    const previousPreview = imageUrl || previewSrc;
    const temporaryPreviewUrl = URL.createObjectURL(file);
    clearObjectUrl();
    objectUrlRef.current = temporaryPreviewUrl;
    setPreviewSrc(temporaryPreviewUrl);
    setUploadStatus("uploading");
    setUploadMessage("Subiendo imagen...");

    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const sanitizedBaseName =
      file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "exercise";
    const path = `${crypto.randomUUID()}-${sanitizedBaseName}.${fileExtension}`;
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.storage
      .from(EXERCISE_IMAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      clearObjectUrl();
      setPreviewSrc(previousPreview || null);
      setUploadStatus("idle");
      setUploadMessage(error.message || "No se pudo subir la imagen.");
      event.target.value = "";
      return;
    }

    const { data } = supabase.storage
      .from(EXERCISE_IMAGE_BUCKET)
      .getPublicUrl(path);

    clearObjectUrl();
    setImageUrl(data.publicUrl);
    setPreviewSrc(data.publicUrl);
    setUploadStatus("uploaded");
    setUploadMessage("Imagen lista para guardar.");
    event.target.value = "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startTransition(async () => {
      const result = await saveExerciseAction({
        exerciseId: selectedExerciseId ?? undefined,
        name,
        description,
        imageUrl,
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

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  return (
    <section className="page-frame">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionEyebrow>Admin</SectionEyebrow>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
            Ejercicios
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
            Gestiona el catalogo base que luego consume rutinas, catalogo y modal
            de ejercicio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">{initialExercises.length} cargados</Badge>
          <Badge variant="neutral">
            {isEditing ? "Modo edicion" : "Modo alta"}
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle>{isEditing ? "Editar ejercicio" : "Crear ejercicio"}</CardTitle>
            <CardDescription>
              La imagen se sube primero a Supabase Storage y luego se persiste la
              URL publica en `exercises.image_url`.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Nombre del ejercicio
                <Input
                  name="name"
                  placeholder="Ej. Press de banca"
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
                  className="min-h-32 resize-none"
                  name="description"
                  placeholder="Explica como se realiza el ejercicio..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                {serverState.fieldErrors.description ? (
                  <span className="text-xs text-[#f8b4b4]">
                    {serverState.fieldErrors.description}
                  </span>
                ) : null}
              </label>

              <div className="grid gap-3 text-xs font-semibold text-[#c2c8d6]">
                <div className="flex items-center justify-between gap-3">
                  <span>Imagen del ejercicio</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[#7d8697]">
                    JPG, PNG o WEBP
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]">
                  <div className="relative aspect-[4/3]">
                    {previewSrc ? (
                      <Image
                        alt={name || "Preview del ejercicio"}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1280px) 100vw, 520px"
                        src={previewSrc}
                        unoptimized={previewSrc.startsWith("blob:")}
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_top,#2b1854_0%,#171d2a_48%,#0c1017_100%)] text-center text-sm text-[#96a0b5]">
                        <div className="space-y-2">
                          <p className="font-display text-base font-semibold text-white">
                            Sin imagen
                          </p>
                          <p>Sube un archivo para generar la preview.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-alt)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {selectedFileName ?? (isEditing ? "Mantener imagen actual" : "Seleccionar imagen")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">
                      {uploadMessage ??
                        (isEditing
                          ? "Puedes dejar la imagen actual o reemplazarla."
                          : "La imagen es obligatoria al crear. Maximo 5 MB.")}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadStatus === "uploading"}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadStatus === "uploading" ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {uploadStatus === "uploading" ? "Subiendo..." : "Elegir archivo"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    accept={EXERCISE_IMAGE_ACCEPT}
                    className="hidden"
                    name="image"
                    type="file"
                    onChange={handleFileChange}
                  />
                </div>

                {serverState.fieldErrors.imageUrl ? (
                  <span className="text-xs text-[#f8b4b4]">
                    {serverState.fieldErrors.imageUrl}
                  </span>
                ) : null}
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
                    El reemplazo de imagen no limpia archivos viejos en este MVP.
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
            <CardTitle>Catalogo administrable</CardTitle>
            <CardDescription>
              Listado reutilizable para este CRUD y para las lecturas transversales
              del MVP.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--border)] px-0 py-0">
            {initialExercises.length === 0 ? (
              <div className="grid min-h-72 place-items-center px-6 py-10 text-center">
                <div className="max-w-sm">
                  <p className="font-display text-lg font-semibold text-white">
                    Todavia no hay ejercicios
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    Crea el primero desde el formulario para empezar a poblar el
                    catalogo.
                  </p>
                </div>
              </div>
            ) : (
              initialExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="grid gap-4 px-5 py-4 transition-colors hover:bg-[var(--card-alt)] sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ExerciseListThumb
                      alt={exercise.name}
                      src={exercise.imageUrl}
                    />
                    <div className="min-w-0">
                      <h3 className="font-display truncate text-sm font-semibold text-white">
                        {exercise.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--foreground-muted)]">
                        {exercise.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#7d8697]">
                      {exercise.createdAtLabel}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <PencilLine className="size-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </section>
  );
}

type ExerciseListThumbProps = {
  src: string;
  alt: string;
};

function ExerciseListThumb({ src, alt }: ExerciseListThumbProps) {
  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]">
      <Image
        alt={alt}
        className="object-cover"
        fill
        sizes="56px"
        src={src}
      />
    </div>
  );
}
