# Mejora visual de `/catalogo` (rutinas)

## Context

La pantalla `/catalogo` se siente como galería estática. El usuario quiere mantener
el estilo dark / neón violeta pero hacerla más profesional, clara y viva, sin rehacer
toda la UI. Es una PWA (React + Tailwind + shadcn + framer-motion).

Decisiones ya tomadas con el usuario (acotan el scope original):
- "FILAS" → **"ejercicios"** (cada `routine_item` = una línea de ejercicio).
- **Sin** badge "Activa": el catálogo queda público/anon, no se hace fetch auth-aware.
- **Sin** badges nuevos (nada de Nueva/Popular/Recomendada — no hay datos reales).
- **Sin** chips de filtro horizontales: se mantiene el `FilterPanel` (bottom sheet) actual.

Resultado buscado: cards más comparables, textos útiles, card 100% clickeable, CTA
menos pesada, y microinteracciones con framer-motion.

## Datos disponibles (modelo real, no inventar)
- `RoutineTemplate` (`app/lib/routines.ts:31-39`): `name`, `description`, `imageUrl`,
  `difficulty` (nivel), `objective` (enfoque), `days[]`.
- días/semana = `routine.days.length` (derivado).
- ejercicios = suma de `day.items.length` → ya existe `getRoutineItemCount`
  (`RoutineCatalogClient.tsx:323`).
- Labels: `ROUTINE_DIFFICULTY_LABELS` / `ROUTINE_OBJECTIVE_LABELS`
  (`app/lib/routine-metadata.ts`).
- Motion helpers existentes a reutilizar: `fadeUp`, `staggerContainer`, `listItemHover`,
  `tapFeedback`, `premiumEase`, `microTransition` (`app/components/ui/motion.tsx`).

## Archivos a tocar (solo 2)
1. `app/catalogo/page.tsx` — header + subtítulo.
2. `app/catalogo/RoutineCatalogClient.tsx` — search, card, label, CTA, animaciones.

No se crean componentes nuevos (la card sigue inline en el client). No se toca
`FilterPanel.tsx`, ni nav, ni el modelo de datos.

## Preview ASCII

Header:
```
┌──────────────────────────────────────────────┐
│  Catálogo de rutinas                           │
│  Elegí una rutina para activar tu semana       │  ← subtítulo nuevo
│                                                │
│  [🔍 Buscar por nombre…        ✕]   [⚙ filtros]│  ← clear (✕) + focus violeta
└──────────────────────────────────────────────┘
```

Card (toda clickeable, CTA integrada y liviana):
```
┌───────────────────────────┐
│ ░░░ imagen (zoom hover) ░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├───────────────────────────┤
│ Push Pull Legs            │  ← título
│ ┌────────┐ ┌───────────┐  │
│ │ 4 días │ │Hipertrofia│  │  ← chips claros (días · enfoque)
│ └────────┘ └───────────┘  │
│ Intermedio · 24 ejercicios│  ← meta línea corta y útil
│                           │
│ Ver rutina            →    │  ← CTA liviana, flecha animada al tap
└───────────────────────────┘
```

## Cambios concretos

### `page.tsx`
- Corregir acento: "Catalogo" → "Catálogo de rutinas".
- Agregar subtítulo debajo del `<h2>`:
  `<p>` con "Elegí una rutina para activar tu semana", texto `--foreground-muted`,
  tamaño sm.

### `RoutineCatalogClient.tsx`

Buscador (`~119-129`):
- Borde violeta suave al focus: agregar `focus-within:border-[rgba(139,92,246,0.5)]`
  + transición al `<label>`/`Input`.
- Botón limpiar: cuando `query` tiene texto, mostrar `<button>` con icono `X`
  (lucide) a la derecha del input que llama `handleQueryChange("")`.

Card `RoutineCatalogCard` (`254-321`) — rediseño de contenido + interacción:
- **Card clickeable completa**: mantener `motion.article` (con `whileHover`/`whileTap`),
  y dentro poner un `<Link href={…} className="absolute inset-0">` estirado
  (stretched link) con texto sr-only. El `<article>` pasa a `relative`. La franja
  CTA deja de ser el único click target → se vuelve aforancia visual
  (`pointer-events-none`).
- **Label**: "{itemCount} filas" → **"{itemCount} ejercicios"**.
- **Reemplazar meta slash + descripción larga** por jerarquía clara:
  - Título `<h3>` (igual).
  - Fila de chips: `{dayCount} días` y `{objective}` (enfoque) como pills pequeñas
    (mismo lenguaje visual que los chips del FilterPanel: `rounded-full`, borde sutil).
  - Línea meta corta: `{difficulty} · {itemCount} ejercicios`.
  - **Quitar** el `<p>` de `description` con `line-clamp-1` (es el texto largo
    truncado que el usuario no quiere). Los chips/meta lo reemplazan.
- **CTA integrada y menos pesada**: en vez de la franja full-bleed violeta
  (`-mx-2.5 … border-t bg-[rgba(124,58,237,0.12)]`), una fila liviana al pie:
  texto "Ver rutina" en acento violeta + `ChevronRight`, sin fondo de barra ni
  bordes laterales. `pointer-events-none` (el click lo maneja el stretched Link).

### Animaciones (framer-motion, reutilizando helpers)
- **Entrada escalonada**: `page.tsx`/grid ya usa `staggerContainer` + `fadeUp`.
  Extender el stagger al header (envolver título+subtítulo+search en un
  `motion.div` con `staggerContainer` y cada hijo con `fadeUp`). Respetar
  `initial/animate`.
- **Card tap feedback**: `whileTap={{ scale: 0.98, boxShadow: "0 0 0 1px rgba(139,92,246,0.5), 0 0 24px rgba(124,58,237,0.25)" }}`
  con `transition` de `premiumEase` (glow violeta sutil). `whileHover` mantiene
  `listItemHover` + borde violeta ya presente.
- **Zoom imagen**: ya existe `group-hover:scale-[1.03]`; añadir variante de tap
  vía `group-active:scale-[1.03]` para feedback táctil en PWA.
- **Flecha CTA**: la `ChevronRight` se mueve a la derecha al presionar la card
  (`group-active:translate-x-1` con transición, o variante motion ligada al tap).
- **Respetar `motion-reduce`**: seguir el patrón ya usado en el repo
  (`motion-reduce:transition-none`).

## No incluido (confirmado por el usuario)
- No badge "Activa" / fetch de `saved_routines`.
- No chips de filtro horizontales.
- No badges Nueva/Popular/Recomendada.
- No cambios en bottom nav / Admin.
- No bottom sheet nuevo (se usa el `FilterPanel` existente).

## Verificación
1. `npm run lint` y `npm run build` (o `tsc --noEmit`) sin errores.
2. Levantar la app (`npm run dev`) y abrir `/catalogo`:
   - Login con admin de `.env.local` si hace falta ver datos.
   - Confirmar: subtítulo visible; label dice "ejercicios"; no hay descripción
     larga truncada; card entera navega al detalle; CTA liviana; clear (✕) en
     búsqueda limpia el texto; focus del input muestra borde violeta.
3. Inspección visual con Playwright/`$playwright-cli` en viewport mobile (390px)
   y desktop: stagger de entrada, tap feedback con glow, zoom de imagen, flecha
   que se mueve al press. Verificar que las cards no se sientan apretadas en
   `grid-cols-2` mobile.
4. Pasada de refinamiento visual si algo se ve apretado o desalineado.
