# Plan: Corrección visual Dashboard principal → fidelidad con referencia v1

## Context

El dashboard principal (`app/page.tsx`, ruta `/`) fue rediseñado pero **no replica** la
referencia `docs/design-references/dashboard-principal-redesign-v1.png`. El objetivo NO es
rediseñar libremente: es **corregir layout, jerarquía, distribución, tamaños y formas** para
calcar la imagen lo más posible. No se toca lógica, datos, auth, rutas ni navbar.

Todo el markup vive en un solo archivo server-component: `app/page.tsx` (sub-componentes
internos `HeroStat`, `SummaryStatCard`, `NutricionTodayCard`, `CargaMuscularCard`,
`ComidasHoyCard`). Los dos heatmaps de abajo viven en
`app/components/shared/TrainingCalendarCard.tsx` y `NutritionCalendarCard.tsx`.

---

## 1. Diagnóstico — diferencias actuales vs referencia

### Hero (`Home` líneas 237–336, `HeroStat` 481–497)
- ❌ "Hoy toca" está **fuera** de la imagen (label arriba, línea 244–246). Ref: pill **dentro** de la imagen, arriba-izquierda.
- ❌ Stats (duración / ejercicios / completados) están en **badges** (`rounded-lg bg-black/30 px-2 py-1`, línea 491). Ref: valores **libres** separados por **líneas verticales finas**, sin fondo de badge.

### 3 cards resumen — Entrenamiento / Nutrición / Constancia (`SummaryStatCard` 500–543)
- ❌ Layout vertical: icono → valor → label → sublabel. Ref:
  - icono **+ label al lado** ("Entrenamiento") en la fila superior.
  - counter grande **+ unidad chiquita a la derecha** ("0/8" + "ejercicios").
  - **barra de progreso abajo con texto propio** ("Pendiente" / objetivo / "racha actual"). Hoy no hay barra.

### Nutrición de hoy (`NutricionTodayCard` 546–645)
- ❌ Ring centrado arriba + barras de macros **debajo** (vertical). Ref: ring/círculo a la **izquierda** y barras de macros a su **derecha** (fila horizontal).
- ❌ Card demasiado alta.

### Carga muscular (`CargaMuscularCard` 647–697)
- ❌ Solo figura + leyenda de gradiente. Ref: incluye **botón "Ver detalle muscular"** que lleva a la rutina.
- ❌ Card demasiado alta.

### Comidas de hoy vacía (`ComidasHoyCard` empty-state 728–749)
- ❌ Orden actual: texto izquierda + icono grande derecha. Ref: **icono a la izquierda**, luego el bloque "Todavía no registraste comidas" + botón, y a la **derecha del todo, separado por una línea fina vertical, una sugerencia** (icono shaker + texto).

### Cards inferiores — Constancia semanal / Registro nutricional (`Home` 416–454)
- ❌ Heatmap calendario de **5 semanas** (grid 7×5). Ref: **vista semanal** — una fila de letras `L M M J V S D` con un punto por día.

---

## 2. Plan de corrección por bloque

### Bloque A — Hero
1. Mover el `<p>Hoy toca</p>` adentro del contenedor de imagen como pill absoluto top-left:
   `absolute left-3 top-3 z-10 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur` con el texto uppercase violeta actual. Quitar el `gap`/label externo.
2. Reescribir `HeroStat`: quitar fondo de badge. Render como `icono + valor + label` inline sin background. En la fila de stats (291–305) intercalar **separadores verticales** entre items: `<span className="h-3 w-px bg-white/15" />` (mini líneas). Mantener `flex items-center gap-2.5`.

### Bloque B — 3 cards resumen
Reescribir `SummaryStatCard` para recibir además `unit` (unidad chiquita) y `progress`
(`{ pct: number; text: string }`):
- Fila top: `icono-chip` + `label` a la derecha (mismo `accent`).
- Fila valor: `value` grande + `unit` chiquito a la derecha, baseline-alineados.
- Abajo: barra `h-1 rounded-full bg-[#1a2235]` con relleno al `accent` + `text` chiquito.
Actualizar las 3 invocaciones (345–379) pasando:
- Entrenamiento: value `0/{exerciseCount}`, unit `ejercicios`, progress pct = completados, text "Pendiente"/"Completado".
- Nutrición: value `totalKcal`, unit `kcal`, progress = `kcalPercent`, text `/ {targetKcal}`.
- Constancia: value `streak`, unit `racha actual`, progress proporcional, text "Iniciá tu racha hoy"/"días".

### Bloque C — Nutrición de hoy (layout horizontal + más baja)
Reestructurar `NutricionTodayCard` cuerpo: contenedor `flex items-center gap-3`:
- Izquierda: `AnimatedProgressRing` (mantener tamaño ~64–72) con kcal adentro.
- Derecha: `flex-1 flex flex-col gap-1.5` con las 3 barras de macros (reusar bloque 614–633).
Quitar el bloque "rest." centrado vertical; compactar. Mantener CTA "Agregar comida" abajo. Reducir `gap`/padding para bajar altura.

### Bloque D — Carga muscular (botón + más baja)
1. Reducir escala de la figura (`scale-[0.7]`) y paddings para acortar.
2. Agregar bajo la leyenda un botón estilo link igual al CTA de nutrición:
   `<Link href={primaryHref}>Ver detalle muscular</Link>` (lleva a la rutina activa / `/rutinas`).
   → requiere pasar `href` como prop a `CargaMuscularCard`.

### Bloque E — Comidas de hoy (empty state)
Reordenar el empty-state (728–749) a `flex items-stretch gap-3`:
- Icono `UtensilsCrossed` a la **izquierda** (tamaño medio, centrado vertical).
- Centro `flex-1`: bloque "Todavía no registraste comidas" + sub + botón "Agregar primera comida".
- Derecha: separador `w-px bg-white/10` + bloque sugerencia (icono pequeño + texto corto). Texto propio, sin copiar el de la imagen.

### Bloque F — Cards inferiores → vista semanal
Añadir modo semanal a `TrainingCalendarCard` y `NutritionCalendarCard` vía prop
`variant?: "heatmap" | "weekly"` (default `"heatmap"`, no rompe otros usos):
- `weekly`: calcular la semana actual Lun→Dom; render fila de 7 columnas, cada una con
  letra (`L M M J V S D`) arriba y un punto (`size-3 rounded`) abajo coloreado si
  `completed`/`logged`, hoy con borde violeta.
- En `app/page.tsx` (424–453): pasar `variant="weekly"`, ajustar subtítulos ("Entrenamientos
  consecutivos" / "Días con comidas registradas") y el contador inferior a `/ 7 días`
  (usar `countDatesInWindow(..., 7)`).

> Verificar antes de tocar: `rg "TrainingCalendarCard|NutritionCalendarCard" app` para
> confirmar que `/` es el único consumidor con `weeks={5} bare`; si hay otros, el default
> `heatmap` los deja intactos.

---

## 3. Archivos / componentes a modificar

| Archivo | Cambio |
|---|---|
| `app/page.tsx` | Hero (pill dentro + stats con separadores), `HeroStat`, `SummaryStatCard` (icono+label, unit, barra), `NutricionTodayCard` (horizontal, más baja), `CargaMuscularCard` (botón + altura), `ComidasHoyCard` empty-state (icono izq + sugerencia con divisor), invocaciones de las cards inferiores (`variant="weekly"`, subtítulos, contador /7) |
| `app/components/shared/TrainingCalendarCard.tsx` | prop `variant`, render semanal `L M M J V S D` |
| `app/components/shared/NutritionCalendarCard.tsx` | prop `variant`, render semanal `L M M J V S D` |

Reusar lo existente: `CardLabel`, `AnimatedProgressRing`, `AnimatedMacroBar`,
`BodyMuscleFigure`, `Button`, helpers `countDatesInWindow`, motion wrappers. **No** crear
componentes nuevos ni libs.

## 4. Riesgos / limitaciones

- `SummaryStatCard` y `HeroStat` cambian de firma → actualizar todas las invocaciones en el mismo archivo (riesgo bajo, archivo único).
- Prop `variant` en los calendarios: default `heatmap` preserva cualquier otro consumidor. Verificar con `rg` antes.
- Layout horizontal de Nutrición en columna estrecha (mitad de pantalla mobile): ring + 3 barras puede apretar; si no entra, aproximación = ring algo más chico (56–60px). Se explicará si ocurre.
- Densidad de texto a `[7–9px]`: ya se usa; mantener contraste legible (regla a11y del proyecto).
- No se modifica lógica de datos, auth, rutas ni navbar inferior.

## 5. Validación con Playwright (playwright-cli / MCP)

1. Levantar app: `npm run dev` (confirmar comando en `docs/codex/COMMANDS.md`).
2. Login admin con credenciales `EMAIL` / `EMAIL_PASSWORD` de `.env.local`.
3. Navegar a `/`, viewport mobile (~390×844) — es PWA mobile-first.
4. **Antes**: screenshot del estado actual.
5. Aplicar cambios por bloque (A→F).
6. **Después**: screenshot y comparar lado a lado contra
   `docs/design-references/dashboard-principal-redesign-v1.png`: posición del pill "Hoy toca",
   separadores de stats, las 3 cards con barra, nutrición horizontal, botón carga muscular,
   empty-state de comidas con divisor, fila semanal `L M M J V S D`.
7. **Ronda de refinamiento visual**: ajustar spacing/alturas/tamaños donde se desvíe del
   mockup; repetir screenshot hasta máxima fidelidad.
8. Chequear overflow/responsive y `prefers-reduced-motion`. Anotar cualquier desvío imposible
   de calcar y su aproximación.

> MCPs/skills: Playwright (obligatorio), shadcn (Card/Button/Progress si aplica), Context7
> (solo si hace falta doc), Magic UI (solo microdetalle, sin rediseñar), `ui-ux-pro-max`/
> `frontend-design` para revisión visual. Si alguno no está disponible, se avisa.
