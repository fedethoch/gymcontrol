import Image from "next/image";

import { cn } from "@/app/lib/utils";

/** Foto del hero del home: sin título horneado, no necesita recorte. */
const FALLBACK_COVER = "/images/hero.png";

const TONES = {
  /** Detrás del encabezado de `/rutinas` (DESIGN.md §12.1), bajo un degradé oscuro. */
  backdrop: { cover: "object-bottom brightness-[1.05]", fallback: "object-[70%_30%] brightness-[0.8]" },
  /** Cards y miniaturas del catálogo (§16.3): las portadas son siluetas oscuras y necesitan más luz. */
  card: { cover: "object-bottom brightness-[1.9]", fallback: "object-[70%_30%] brightness-[0.9]" },
} as const;

/**
 * Portada de una plantilla en gris, para llenar una caja con `position` y `overflow-hidden`.
 * Las portadas traen el título horneado en el 27% superior: la imagen ocupa el 137% de la caja,
 * anclada abajo, y el recorte lo tapa. Sin portada usa la foto del hero sin recortar.
 */
export function RoutineCoverImage({
  imageUrl,
  sizes,
  tone = "backdrop",
  priority,
  loading,
  fetchPriority,
}: {
  imageUrl: string;
  sizes: string;
  tone?: keyof typeof TONES;
  priority?: boolean;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}) {
  return (
    <div className={cn("absolute inset-x-0 bottom-0", imageUrl ? "h-[137%]" : "h-full")}>
      <Image
        alt=""
        fill
        priority={priority}
        loading={loading}
        fetchPriority={fetchPriority}
        sizes={sizes}
        src={imageUrl || FALLBACK_COVER}
        className={cn(
          "object-cover grayscale contrast-[1.15]",
          imageUrl ? TONES[tone].cover : TONES[tone].fallback,
        )}
      />
    </div>
  );
}
