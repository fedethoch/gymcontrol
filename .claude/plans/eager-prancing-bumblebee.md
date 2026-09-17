# Rediseño mobile de `/catalogo`: B · Planificador

## Contexto

`/catalogo` a 390px es la grilla del desktop partida en dos columnas: 8 cards iguales, restos del violeta viejo, paginación de web y el filtro de días escondido en un sheet. Es la ruta 4 de `docs/REDESIGN_DIRECTION.md` §7.

Con `/app-store-refs` (Ladder, NTC, Hevy) se armó un mock en 3 versiones: https://claude.ai/artifact/CgEQL6GSTzxnM26BDBPYX2 (v3 final). El usuario eligió **B · Planificador** y cerró 13 decisiones:

| Decisión | Qué se eligió |
|---|---|
| C-D1 | Dirección B |
| C-D2 | Una destacada por nivel |
| C-D3 | Días a la vista |
| C-D4 | Estado en la card y en la fila; CTA neutro si es tu rutina activa |
| C-D5 | Sin paginación |
| C-D6 | Un solo CTA emerald |
| C-D7 | Sin `MobileHeader` |
| C-D8 | Desktop con el mismo layout, pero sin violeta |
| B-D1 | Rueda horizontal Todas·2…6 |
| B-D2 | Con "Todas": carrusel por nivel + lista |
| B-D3 | Barra semanal |
| B-D4 | Token nuevo "Metric XXL" de 7rem |
| B-D5 | Nivel, objetivo y orden en el sheet Filtros |

El resultado es una pantalla que pregunta "¿Cuántos días por semana podés entrenar?". El número es el protagonista y los resultados se adaptan a la elección. Mobile <1024 únicamente; el desktop conserva su layout.

Dato de la base que ordena el diseño: cada cantidad de días tiene **un solo nivel**.

| Días | Nivel | Rutinas |
|---|---|---|
| 2 | principiante | 1 |
| 3 | principiante | 2 |
| 4 | intermedio | 1 |
| 5 | intermedio | 3 |
| 6 | avanzado | 3 |

Objetivos: hipertrofia 8, mantenimiento 2, fuerza 0. Hay 10 rutinas; 9 tienen portada, con el título horneado en el 27% superior.

## Coordinación con sesiones en paralelo (pedido del usuario)

La sesión `mobile-routine-focus-redesign [f1ce66]` tiene sin commitear cambios en `app/components/rutinas/*`, `app/components/workout/*`, DESIGN.md §11–§12 y REDESIGN_DIRECTION.md §7. Ya se les avisó por mensaje a esa sesión y a `gymcontrol-93` qué archivos toco, y se les preguntó por los suyos.

**Acordado con `gymcontrol-93`** (rediseño de `/nutricion/registro`, en plan mode):
- **DESIGN.md:** §13 es mía y §14 es suya. En §2.1, cada uno agrega su fila o nota. En §6.1, cada uno suma su ruta a la misma línea.
- **MobileHeader y `globals.css`:** en la lista de exclusión de `MobileHeader` (L111-119) y en el selector de padding-top de `globals.css`, cada uno suma lo suyo al lado de lo del otro.
- **Inputs:** esa sesión cambia la regla de inputs de `globals.css` (L81-88) a `input:not([type="hidden"], [data-metric-input])`. El buscador del catálogo no lleva ese atributo y sigue en 16px.
- **REDESIGN_DIRECTION §7:** a esa sesión le toca la ruta 6. El contador "Progreso: N / 15" lo edita cada uno releyendo el valor del momento y sumando 1.
- **`docs/codex`:** una fila cada uno.
- **Comandos:** `next build`, `pnpm check`, `next start` y `graphify update .` se avisan por mensaje y se espera el OK.
- `scripts/validate-mobile.mjs` es de esa sesión si lo necesita; yo no lo toco.
- **Rutas temporales:** la mía es `app/catalogo-preview-vacio/`; la de esa sesión, `app/registro-preview/`. Cada uno la borra antes del build final.

**Acordado con `mobile-routine-focus-redesign [f1ce66]`** (rediseño de `/configuracion`, en plan mode):
- **Líneas compartidas:** esa sesión suma lo suyo después de mis líneas en `MobileHeader`, en el selector de `globals.css` y en §6.1. En `validate-mobile.mjs` suma `/configuracion`; yo no lo toco.
- **REDESIGN_DIRECTION §7:** solo la fila y el checklist de la ruta 9.
- **Build y graphify:** mismo protocolo de aviso.
- **DESIGN.md:** esa sesión había pedido §14, que ya era de `gymcontrol-93`. Le propuse **§15**.
- **NumberStepper:** esa sesión y `gymcontrol-93` planean dos componentes distintos. Se les avisó a las dos para que lo acuerden entre ellas; no me afecta.
- **`RoutineCover.tsx` quedó libre.** Los cambios sin commitear en `app/components/rutinas/*` y `app/components/workout/*` **no son de ninguna de las tres sesiones activas**. Nadie los toca ni los commitea sin preguntarle al usuario.

Reglas:
- **No toco** `app/components/workout/*`, `app/rutinas/*` ni DESIGN.md §11/§12. En `app/components/rutinas/*` solo toco `RoutineCover.tsx`, para extraer su capa de imagen sin cambio visual. Ese archivo no forma parte del WIP ajeno.
- **Archivos compartidos** (DESIGN.md, REDESIGN_DIRECTION.md, globals.css, MobileHeader.tsx, FilterPanel.tsx y docs/codex): releer justo antes de cada Edit y hacer ediciones quirúrgicas. Nunca `git stash`, `checkout` ni `reset`.
- **`next build` y `graphify update .`**: avisar a las sesiones pares antes de correrlos, para que no haya dos a la vez en `.next` o en `graphify-out`.
- **Si lint o build fallan por archivos ajenos:** lint acotado a mis archivos y reportar las rutas ajenas sin tocarlas.
- **Commit:** no, salvo pedido explícito.

## Archivos

**Nuevos**
- `app/lib/routine-catalog.ts`: lógica pura. Solo importa `@/app/lib/routine-metadata`, que es testeable con el hook de alias, igual que `day-workout.ts`.
- `tests/unit/routine-catalog.test.mjs`
- `app/components/catalogo/`:
  - `CatalogMobileView.tsx`: dueño del estado.
  - `CatalogTopBar.tsx`
  - `DayCountWheel.tsx`
  - `CompactDayBar.tsx`
  - `WeekBar.tsx`
  - `LevelCarousel.tsx`
  - `CatalogFeatureCard.tsx`
  - `CatalogRoutineRow.tsx`: exporta `CatalogRoutineList`.
  - `CatalogEmptyState.tsx`
- `app/components/shared/RoutineCoverImage.tsx`: capa de imagen recortada al 137% y anclada abajo, extraída de `RoutineCover.tsx` L46-58, con `tone: "backdrop" | "card"`. `RoutineCover.tsx` pasa a usarla.

**Editados**
- `app/catalogo/page.tsx`: árbol mobile + desktop, arma el DTO y quita el radial violeta.
- `app/catalogo/RoutineCatalogClient.tsx`: solo colores (tabla en F6).
- `app/components/shared/FilterPanel.tsx`: pasa a vaul `Drawer`, con la API vieja compatible.
- `app/components/rutinas/RoutineCover.tsx`: usa `RoutineCoverImage`; el DOM queda idéntico.
- `app/components/shared/MobileHeader.tsx` L112-117: suma `pathname === "/catalogo"`.
- `app/globals.css` (~L548): suma `.catalogo-frame` al selector de `padding-top` que ya usan `.home-frame, .rutinas-frame, .workout-frame`.
- `DESIGN.md`: §2.1, §6.1 y §13 nueva.
- `docs/REDESIGN_DIRECTION.md` §7
- `docs/codex/FILE_OWNERSHIP.md`, `TEST_MATRIX.md`, `ROUTING_GRAPH.md`
- Temporal, borrada al final: `app/catalogo-preview-vacio/page.tsx`, para el estado de catálogo vacío.

**Reusar:**
- `Button` (`asChild`; default = emerald) y `Drawer*` de `app/components/ui/Drawer.tsx`, con el patrón de `RoutineSwitcher`/`TodayExercisesSheet`.
- `premiumEase` de `app/components/ui/motion.tsx` y `.pressable`.
- Clases de filas de `DayPanel.tsx` y patrón de la barra compacta de `RoutineWeekView.tsx` (L60-68 y L139-162).
- `listRoutineTemplates`, `getOptionalAuthContext`, `listSavedRoutineStatusesForUser` y `ROUTINE_*_LABELS`.

## Pantalla mobile (spec)

La página usa el patrón del home, `app/page.tsx:185-271`, y **no** el helper `Responsive` de `/rutinas`, porque otra sesión lo está editando:

```tsx
<section className="page-frame catalogo-frame relative content-start bg-[var(--background)] lg:bg-[linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
  <div className="flex flex-col lg:hidden">
    <div aria-hidden="true" className="home-safe-top" />
    <CatalogMobileView routines={catalog} statusById={saved} />
  </div>
  <div className="hidden lg:contents">{/* h2 y RoutineCatalogClient actuales, sin cambios */}</div>
</section>
```

- `catalog = routines.map(toCatalogRoutine)`: DTO chico, sin ejercicios, para no mandar el árbol completo al cliente.
- El desktop sigue recibiendo `routines`.

**Zonas**

- **Z1 · Barra superior.** "Catálogo" (`text-[13px] font-medium` muted, patrón de `/rutinas`), botón Buscar de 44px y `FilterTrigger`.
  - Al buscar, la barra se vuelve: `form role=search` + input `type=search` de 16px con `enterKeyHint=search` + Filtros + "Cancelar".
  - El foco se da con `flushSync` + `focus()` (en iOS abre el teclado). Esc hace `preventDefault()` y sale; el foco vuelve a Buscar.
- **Z2 · Pregunta y rueda.**
  - H1 "¿Cuántos días por semana podés entrenar?" (1.5rem/600).
  - `DayCountWheel`: spec abajo.
  - Debajo: marcador de 28×4 y la leyenda "días por semana" (o "Deslizá para elegir días" con Todas).
- **Z3 · WeekBar** (solo con un número elegido). 7 segmentos `h-2`: los N primeros en `--foreground` y el resto en `--border`. Leyenda de `weekSplit`: "5 entrenos · 2 descansos".
- **Z4 · Resultados.**
  - **Todas:**
    - H2 "Para cada nivel" + `LevelCarousel`, con una card por nivel (`pickLevelFeatured`). Se oculta si hay menos de 2 niveles.
    - Slides `w-[min(300px,calc(100%-2.5rem))]` con snap, índice actual con `carouselIndex` y barras debajo.
    - Después, H2 "Las N rutinas" + la lista completa.
  - **Con número:**
    - H2 de `resultsHeading` ("3 rutinas de 5 días") y, a la derecha, `sharedLevel`.
    - Una `CatalogFeatureCard` (la primera del orden) y el resto en filas.
    - Si hay 3 o menos, la pista "¿Pocas opciones? Probá con 4 o 6 días." (`neighborDayCounts`), con botones que cambian la rueda.
  - **Búsqueda:** oculta Z2, Z3 y el carrusel. Aplica `matchesQuery` (tokens AND, sin tildes, sobre nombre y descripción) más los filtros del sheet, e ignora los días. H2 "Resultados" + conteo. `<mark>` con `highlightSegments`.
  - **Anuncio:** una región `role="status"` sr-only estable, con debounce de 600ms al escribir (`catalogAnnouncement`).
- **`CatalogFeatureCard`.**
  - Caja: `article` con radio 20, `--card` y `--border`.
  - Portada de 170px (`RoutineCoverImage tone="card"`, brillo a ajustar contra el mock, ~1.9) con degradé a `--card`.
  - Píldora "[● Tu rutina activa · ]Nivel · N días", título `<h3>` con estilo H2 y meta "Objetivo · N ejercicios · N series".
  - CTA `<Link>` de 56px, con link estirado:
    - **emerald** si `featureCtaTone({ isCurrent, status })` da primary: card actual y **no** activa (guardada sí va emerald);
    - neutro (`bg-white/10`, también de 56px) en el resto de los casos.
  - Solo la primera card lleva `loading="eager" fetchPriority="high"`. `priority` está deprecado en Next 16.2.6.
- **`CatalogRoutineRow`.**
  - Lista `ol.border-y`. Cada fila es un Link `pressable min-h-[92px]`.
  - Miniatura de 64px con radio 14 y el mismo recorte (sin portada: `/images/hero.png`).
  - Nombre `displayRoutineName` con `line-clamp-2` y meta "Nivel · Objetivo · N ejercicios".
  - Estado: activa = punto emerald de 7px + "Tu rutina activa"; guardada = `Check` + "Guardada" (muted).
  - Chevron en subtle.
- **Vacíos (`CatalogEmptyState`).**
  - **Sin resultados** (solo con búsqueda + filtros): "Sin resultados" en 2.5rem/800 y `emptyResultsMessage` (ej.: `Ninguna rutina de nivel principiante incluye "legs". Sin filtros hay 5.`). Botones "Quitar filtros" (neutro) y "Borrar búsqueda" (ghost).
  - **Catálogo vacío:** "Pronto hay más" en XXL y un link neutro "Ir a Rutina" a `/rutinas`.
  - H1 sr-only cuando la pregunta no se ve.
- **`CompactDayBar`.** Patrón de `RoutineWeekView`: IntersectionObserver sobre el bloque de la rueda y `sticky top-[env(safe-area-inset-top)] z-30 -mx-4 h-0` + `motion.div absolute`, 0.18s con `premiumEase`, fondo `--background` y `border-b`.
  - Fila 1 de 44px: "Catálogo", Buscar y Filtros.
  - Fila 2: `radiogroup` en grilla con opciones de `min-h-11`. La elegida va a 1.375rem/800 con marcador `layoutId`; el resto a 15px muted.
  - Visible con `wheelAbove && !searchOpen`; el estado se resetea al desconectar el observer.
  - Al cambiar días desde la barra o desde la pista: `scrollIntoView` del H2 de resultados, con `scroll-mt` igual a la altura de la barra.
- **Un solo drawer de filtros**, controlado desde `CatalogMobileView`. Si hubiera uno dentro de la barra compacta, se desmontaría al cambiar el alto de la página.
- **Motion.**
  - El contenedor de resultados lleva `key` por días/búsqueda y recibe la clase existente `motion-empty-state` recién después de la primera interacción. Sin `AnimatePresence mode="wait"` (colapsa la altura), sin `layout` en las filas y sin `initial` en opacity 0 (no esconder el SSR).
  - `navigator.vibrate(8)` con guarda, solo cuando se confirma un cambio de días.
  - Todo respeta el `MotionConfig reducedMotion="user"` global.

### `DayCountWheel`: la pieza de mayor riesgo

**DOM**
- Scroller `role="radiogroup"` con `aria-labelledby` = id del H1, y clases `relative -mx-4 flex h-[6.25rem] snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain` + scrollbar oculta + `mask-image` con degradé 12%/88%.
- **Spacers flex** a cada lado, `basis-[calc(50%-slot/2)]` (el % del padding sería relativo al padre y descentraría). "Todas" queda centrado con `scrollLeft=0`, así que el SSR se ve bien sin JS.
- **Ítems:** `<button role="radio" aria-checked aria-label>` con tabindex móvil y `snap-center`. Slot de `w-[5rem]` para números y `w-[8.75rem]` para "Todas".
- **Glifo:** un `<span aria-hidden data-glyph>` a `text-[7rem]` (números) o `text-[3.25rem]` ("Todas"), `leading-[0.85] tracking-[-0.06em] font-extrabold`. Se escala **el span**, no el botón, para no achicar el área táctil ni el foco.
- Sin `will-change` y sin `sr-only` adentro (el incidente de overflow de `/rutinas`).

**Algoritmo**
- **Medición y pintura:** `centers` se miden de `offsetLeft + width/2`. `paint()` calcula `fractionalIndex` y escribe `scale` y `color` en los glifos vía refs, con throttle de rAF. No hay re-render de React por frame.
  - Escala: `wheelGlyph` → [1, 0.3929, 0.25].
  - Color: `--foreground` → `--foreground-subtle` → `color-mix(in oklab, var(--foreground-subtle) 70%, var(--border-strong))`, que da ≥3:1 (`--border-strong` puro da 1.7:1 y falla DESIGN §1.5).
- **Valor controlado:**
  - El scroll solo propone un valor. Se confirma en `onScrollEnd` (React 19.2), o con un timer de 120ms donde no exista.
  - Solo si hubo **intención** (`pointerdown`/`touchstart`/wheel horizontal) y el dedo no sigue apoyado. Así VoiceOver o un `focus()` que desplacen la rueda no cambian el filtro.
  - Tap: `onChange` directo.
  - Teclado: `nextRadioIndex` (←↑→↓ con vuelta, Home, End) + `focus({ preventScroll: true })`.
- **Scroll:** lo mueve una sola fuente, un `useLayoutEffect([value, optionsKey])` que mide, hace `scrollTo` (smooth, o `auto` si cambiaron las opciones o hay reduced-motion) y pinta antes del paint.
  - `ResizeObserver` vuelve a centrar.
  - Al perder el foco (blur del grupo), vuelve a centrar el valor si quedó corrido.
- **Estilos del SSR:** `wheelGlyph(|i-idx|)` con `toFixed(4)`, iguales en server y cliente.
- **Lint:** refs escritos solo en efectos o handlers (reglas de react-hooks v7: `set-state-in-effect`, `refs`, `immutability`).
- **Si las opciones disponibles cambian** por los filtros: `resolveDayOption` se aplica en los handlers, no en un efecto, más una derivación defensiva en el render.

### FilterPanel (compartido por 7 consumidores)

**Tipos y exports**
- `FilterOption = { value; label; count? }`. Props de `FilterPanel`: `{ groups; onClear; resultLabel? }`. Sigue sin estado externo y usa `DrawerTrigger asChild`, así los otros 6 consumidores no cambian.
- Nuevos exports:
  - `FilterTrigger`: 44px; badge de 16px con `--accent-foreground` sobre emerald, 10px. `aria-label` dice "1 activo" o "N activos".
  - `FilterDrawer({ open, onOpenChange, groups, onClear, resultLabel? })`.
  - `countActiveFilters`.

**Drawer**
- `Drawer autoFocus`, con `DrawerContent className="max-h-[85dvh] sm:mx-auto sm:w-full sm:max-w-[34rem]"`.
- Header en fila: "Filtros" (`text-xl font-bold`) y la acción de texto "Limpiar" en `--accent-bright`, deshabilitada sin filtros. `DrawerDescription` sr-only.
- **Grupos:** micro label del sistema con `role="group" aria-labelledby`.
- **Chips:** `h-10` pill con área táctil de 44px (`before:`), `aria-pressed`, conteo en mono muted. Si el conteo es 0 y la opción no está elegida: `disabled` con opacity .4.
- **`kind:"sort"`:** filas de 48px con `Check`.
- **Footer:** `DrawerClose asChild` con un botón blanco de 56px (`bg --foreground`, texto `--background`) que dice `resultLabel ?? "Ver resultados"`, y `pb-[max(1.25rem,env(safe-area-inset-bottom))]`.

**Catálogo mobile**
- Grupos Nivel, Objetivo y Orden (Recientes · Nombre A-Z · Más ejercicios).
- Conteos con `optionCounts` sobre los filtros **efectivos**: en búsqueda los días no cuentan; fuera de búsqueda, la query no cuenta.
- `resultLabel = catalogResultLabel(n)`, que da "Ver 3 rutinas".

### Lib puro: `app/lib/routine-catalog.ts`

**Tipos**
- `CatalogRoutine`: `{ id, name, displayName, description, imageUrl, difficulty, objective, dayCount, itemCount, seriesCount }`.
- `CatalogFilters`: `{ query, days: "all"|number, level, objective }`.
- `CatalogSort`: `"recent"|"name"|"items"`, con `CATALOG_SORTS`.

**Funciones**

| Tema | Funciones |
|---|---|
| Datos y nombres | `toCatalogRoutine`, `displayRoutineName` ("dias"/"dia" → con tilde, respeta mayúsculas, no toca "media") |
| Búsqueda | `normalizeSearch`, `searchTokens`, `matchesQuery`, `highlightSegments` (mapa de índices normalizado→original) |
| Parsers | `parseLevelFilter`, `parseObjectiveFilter`, `parseCatalogSort` |
| Filtro y orden | `filterCatalog`, `sortCatalog` (estable; `name` con `localeCompare("es", { sensitivity: "base", numeric: true })`) |
| Días | `availableDayCounts`, `resolveDayOption`, `neighborDayCounts`, `weekSplit` |
| Conteos | `optionCounts` |
| Destacadas y CTA | `pickLevelFeatured`, `sharedLevel`, `featureCtaTone` |
| Textos | `countLabel`, `routineCountLabel`, `dayCountLabel`, `resultsHeading`, `catalogResultLabel`, `catalogAnnouncement`, `emptyResultsMessage` |
| Rueda y carrusel | `nextRadioIndex`, `fractionalIndex`, `carouselIndex` (clamp al final), `wheelGlyph` |

### Desktop: solo colores (C-D8)

Líneas de `RoutineCatalogClient.tsx`:

| Línea | Qué es | Cambio |
|---|---|---|
| L118 | borde del buscador en foco | `focus-within:border-[var(--accent)]` |
| L237 | página activa | `border-[var(--accent)] bg-[var(--accent)]/15 hover:bg-[var(--accent)]/20` |
| L286 | glow violeta en `whileTap` | se quita el `boxShadow` y queda la escala |
| L289 | borde en hover | `hover:border-[var(--border-strong)]` |
| L294 | outline de foco | `focus-visible:outline-[var(--accent-bright)]` |
| L337 | chip de objetivo | igual al chip de días, con tokens |
| L348 | borde | `border-[var(--border)]` |
| L349, L352 | texto | `text-[var(--accent-bright)]` |

En `page.tsx` se quita el radial violeta y queda el `linear-gradient` en `lg:`.

## Fases (cada una con su chequeo)

0. **Línea base, sin editar.**
   - Capturas en el scratchpad:
     - `/catalogo` a 390 y 1280;
     - `/rutinas` a 390;
     - `/alimentos`, `/recetas` y `/admin/rutinas` a 390 y 1280, con el sheet abierto.
   - `pnpm test:unit` y `pnpm exec tsc --noEmit` para anotar los errores previos ajenos.
   - Chequeo: capturas y lista de errores previos guardadas.
1. **F0 · Docs de diseño.** Releer antes de editar.
   - DESIGN.md §2.1: fila "Metric XXL | 7rem / 0.85 | 800 | Sora | Número protagonista de un selector (días del catálogo, §13); tracking −0.06em; uno por pantalla".
   - §6.1: la excepción suma `/catalogo` (el detalle conserva el header).
   - §13 nueva: zonas Z1–Z4, card, fila, rueda, barra compacta, sheet, estados y reglas.
   - Chequeo: `git diff DESIGN.md` muestra mis bloques más los ajenos intactos.
2. **Lib + tests, primero los tests.**
   - Chequeo: `pnpm test:unit` en verde y `pnpm exec eslint app/lib/routine-catalog.ts` limpio.
3. **`RoutineCoverImage` + `RoutineCover`.** Se crea el componente compartido y `RoutineCover.tsx` (L46-58) pasa a usarlo con `tone="backdrop"`, sin cambio visual.
   - Chequeo: eslint limpio, `outerHTML` de la portada de `/rutinas` idéntico al de la línea base y diff de píxeles a 390 = 0.
4. **FilterPanel con vaul.**
   - Chequeo en los 6 consumidores + desktop del catálogo, a 390 y 1280:
     - el drawer abre;
     - los chips filtran;
     - "Limpiar" resetea;
     - Esc cierra;
     - el foco vuelve al trigger;
     - los clics no chocan con el arrastre de vaul;
     - 0 errores de consola.
5. **Componentes del catálogo**, en este orden: Row → FeatureCard → WeekBar → EmptyState → Wheel → Carousel → TopBar → CompactBar → MobileView.
   - Chequeo: eslint de `app/components/catalogo` y `tsc` sin errores nuevos.
6. **Cableado:** `page.tsx`, `.catalogo-frame`, `MobileHeader` y los colores del desktop.
   - Chequeo: a 390 no aparece el header y el padding superior es igual al de `/rutinas`. A 1280 solo cambian los colores (comparar contra la línea base).
7. **Verificación de UI.** Script de Playwright en el scratchpad contra el dev en :3000, con Chromium y WebKit si está instalado.
   - Tamaños: 320, 375, 390 y 430, con admin y anónimo.
   - En cada estado: sin overflow en `documentElement` ni en `.shell-main`, como mucho 1 CTA emerald visible y 0 errores de consola.
   - Estados:
     1. **Todas:** carrusel [Full Body Mayores, PPL 5, Arnold] y 10 filas.
     2. **Tap en 2:** "1 rutina de 2 días", barra 2/5 y pista "Probá con 3 días".
     3. **Swipe con la rueda del mouse:** llega a 4.
     4. **Teclado:** →, End y Home.
     5. **Barra compacta:** aparece con `scrollTop` 900; tocar 5 deja el H2 visible.
     6. **Buscar "push":** 4 filas con `<mark>`; Esc sale.
     7. **"legs" + Principiante:** mensaje exacto; "Quitar filtros" da 5.
     8. **Sheet:** conteos, Fuerza deshabilitado, orden y "Ver 3 rutinas".
     9. **Reduced motion.**
     10. **Catálogo vacío:** ruta temporal, con el header oculto por CSS en el test. Se **borra** después y se confirma con `git status`.
   - Mirar las capturas y hacer una pasada de refinamiento visual contra el mock v3.
   - `VALIDATE_BASE_URL=http://localhost:3000 pnpm validate:mobile`.
   - Si el build pasa: `pnpm exec next start -p 3002` para confirmar el CSS global. Avisar antes a las sesiones pares.
8. **Cierre.**
   - REDESIGN_DIRECTION §7:
     - ruta 4 en ✅ con el mock, §13 y las decisiones;
     - checklist de la ruta 4 (sheet Filtros, búsqueda inline, barra compacta);
     - casillas de FilterPanel en las rutas 7, 8 y admin;
     - contador a 4/15.
   - Filas de catálogo en `docs/codex/FILE_OWNERSHIP.md`, `TEST_MATRIX.md` y `ROUTING_GRAPH.md`.
   - Avisar a las sesiones pares, luego `pnpm lint`, `pnpm build` y `graphify update .`.
   - Actualizar la memoria del proyecto (`catalogo_mobile_redesign.md`).
   - Sin commit, salvo pedido.

## Tests unitarios (fixture = las 10 rutinas reales)

**Datos y nombres**
- `toCatalogRoutine`: Arnold da 6 días, 38 ejercicios y 128 series; sin días da 0/0/0.
- `displayRoutineName`: "6 dias" → "6 días"; "DIAS" → "DÍAS"; "1 dia" → "1 día". No cambian "Media", "diaspora" ni un nombre que ya lleva tilde.

**Búsqueda**
- `normalizeSearch` y `searchTokens`: "Días" → "dias"; espacios repetidos se ignoran; una query vacía da `[]`.
- `filterCatalog` + `matchesQuery`:
  - "legs" da 5; "legs" + principiante da 0;
  - "dias" da 10; "push 6" da [PPL 6, PPLxAS 6]; "glúteos" da [Prio];
  - días 5 da 3, en el orden de entrada;
  - avanzado + mantenimiento da 0.
- `highlightSegments`: marca "días" al buscar "dias"; con varios tokens une los rangos; sin match o sin query devuelve un solo segmento.

**Orden y parsers**
- `sortCatalog`: `recent` es estable; `name` va de Arnold a Upper Lower con orden numérico; `items` va de 38 a 12 y es estable.
- Parsers: un valor desconocido da "all" / "recent".

**Días**
- `availableDayCounts`: sin filtros [2..6]; intermedio [4,5]; avanzado + mantenimiento []; excluye 0 y más de 7.
- `resolveDayOption`: (5, [6]) da "all".

**Conteos (`optionCounts`)**

| Filtros efectivos | Grupo | Resultado |
|---|---|---|
| Todas | nivel | {P3, I4, A3} |
| Todas | objetivo | {H8, F0, M2} |
| Días 5 | nivel | {P0, I3, A0} |
| Búsqueda "legs" | nivel | {P0, I3, A2} |
| Filtro propio aplicado | su grupo | lo ignora |

**Destacadas y CTA**
- `pickLevelFeatured`: [Mayores, PPL5, Arnold].
- `sharedLevel`: con días 5 da "intermedio"; con Todas, null.
- `featureCtaTone`: (actual, null) y (actual, saved) dan primary; (actual, active) da neutral; si no es la actual, neutral.

**Textos**
- `weekSplit`: 5, 6 ("1 descanso"), 1 y 7 ("sin descanso"). Un valor mayor a 7 se acota a 7.
- `neighborDayCounts`: 5 da [4,6]; 2 da [3]; con una sola opción, [].
- `resultsHeading`, `catalogResultLabel`, `catalogAnnouncement`: singulares, plurales y los textos del mock.
- `emptyResultsMessage`: el ejemplo aprobado exacto, más las variantes solo objetivo, nivel + objetivo y sin la segunda oración cuando el conteo es 0.

**Rueda y carrusel**
- `nextRadioIndex`: vuelta en ambos sentidos, Home, End, ↓; Enter da null; count 0 da null.
- `fractionalIndex`: interpola y acota.
- `carouselIndex`: clamp al final y max 0.
- `wheelGlyph`: escalas 1 / 0.3929 / 0.25; "Todas" a distancia 1 da 0.3846; una distancia negativa se trata como positiva.

## Riesgos

- **Sesiones en paralelo:** ver las reglas de coordinación. `pnpm build` puede fallar por trabajo ajeno; en ese caso se reporta.
- **Rueda en iOS** (`scrollend`, momentum, smooth + snap): timer + guarda de touch. Probar en WebKit y, si se puede, en un iPhone (`pnpm dev -H 0.0.0.0`).
- **FilterPanel en 6 consumidores:** en desktop el drawer queda centrado con `max-w-[34rem]`, y el arrastre de vaul con mouse puede molestar. Verificarlo en cada consumidor; si molesta, usar `handleOnly`.
- **CSS global:** el dev puede servir CSS viejo; confirmarlo en el build de prod.
- **La selección se pierde** al volver del detalle: persistir en la URL queda fuera de alcance y se anota para la ruta 5.
- **El carrusel empieza con "Full Body Mayores"** (sin portada): es un dato real (la principiante más reciente) y el mock aprobado lo muestra así.
