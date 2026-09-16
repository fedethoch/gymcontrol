/** Botón neutro de 52px (misma pieza que las acciones neutras de /rutinas). */
export const NEUTRAL_BUTTON_CLASS =
  "pressable flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-[15px] font-semibold text-white outline-none hover:bg-white/15 focus-visible:shadow-[var(--focus-glow)] disabled:pointer-events-none disabled:opacity-50";

/** Botón de 52px en blanco: la acción principal de un sheet cuando la pantalla ya tiene su emerald. */
export const STRONG_BUTTON_CLASS =
  "pressable flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 text-[15px] font-bold text-[var(--background)] outline-none hover:bg-white focus-visible:shadow-[var(--focus-glow)] disabled:pointer-events-none disabled:opacity-50";

/** Botón redondo de 44px para cerrar, volver o abrir un menú. */
export const ICON_BUTTON_CLASS =
  "pressable grid size-11 shrink-0 place-items-center rounded-full text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]";

/** Título del panel de una comida (Display XXL, DESIGN.md §2.1). Va después del tamaño en `cn`: si no, tailwind-merge descarta el `leading`. */
export const PANEL_TITLE_CLASS =
  "font-display font-extrabold uppercase leading-[0.9] tracking-[-0.05em] text-[var(--foreground)] [overflow-wrap:anywhere] hyphens-auto line-clamp-3 outline-none";

export const PANEL_TITLE_SIZES = {
  xxl: "text-[clamp(2.5rem,14vw,3.625rem)]",
  xl: "text-[clamp(2rem,10vw,2.75rem)]",
  l: "text-[clamp(1.625rem,8vw,2.25rem)]",
} as const;

/** Chip de opción (tipo de comida) con estado presionado. */
export const CHOICE_CHIP_CLASS =
  "pressable min-h-11 rounded-xl border px-3 text-sm font-medium outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-50";
