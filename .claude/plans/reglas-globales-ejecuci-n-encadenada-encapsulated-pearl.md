# Dashboard principal — Rearquitectura de layout (FASE 2) + Piel premium (FASE 3)

## Context

El dashboard principal (`app/page.tsx`, ruta `/`, `Home()`) es un **stack vertical de ~6 cards charcoal idénticas**. La auditoría (FASE 1, StyleSeed 78/100 C) mostró que el "parece AI-generated" no viene de los tokens (coherentes) sino de la **estructura**: card soup monótona, redundancia de datos (entreno 3×, nutrición 3×, dos calendarios semanales idénticos), y el strip de 3 KPIs **oculto en mobile** (`hidden ... sm:grid`, `app/page.tsx:344`) — justo el patrón de scan rápido que usan todas las referencias premium de FASE 0.

**Objetivo FASE 2:** reemplazar el stack por un **sistema de distribución espacial con jerarquía y bento real** (prohibido stack vertical), consolidando zonas redundantes (decisión del usuario: consolidación **agresiva**).
**Objetivo FASE 3:** vestir ese layout con piel premium (tipografía/escala/spacing/elevación) **sin cambiar el layout**, respetando `DESIGN.md`.

Restricción dura: **no tocar** la bottom nav ni el header móvil (tamaño/posición/comportamiento) — `CLAUDE.md:115`, `DESIGN.md §6.2`. Solo color de acento permitido.

---

## Restricciones del shell (no modificar)

- `.page-frame` (`app/globals.css:519`) — grid 1 col, `gap:1.25rem`, `padding:1rem` + safe-area top/bottom que reserva header/nav. Desktop ≥1024: `gap/padding 1.5rem`.
- `MobileHeader` (absolute, top) + `MobileTabBar` (fixed, bottom) — **intocables**. `MobileHeaderBadgeSync` (racha) se mantiene.
- Tailwind **v4, sin config** — tokens vía CSS vars en `globals.css:3-24` (`--accent #10b981`, `--accent-bright #6ee7b7`, `--card #121824`, `--card-alt #171d2a`, `--card-hover #1b2230`, `--border`, `--border-strong`, `--foreground/-muted/-subtle`, `--success #a3e635`, `--warning #f59e0b`, `--focus-glow`). Usar estos, no hex crudo.
- Radios DESIGN.md: sm 8 (chips/inputs) · md 10 (controles) · lg 14 (cards) · xl 20 (sheets) · pill. Spacing base-4.

---

## FASE 2 — Sistema de distribución espacial

**Focal único:** *Entrenamiento de hoy* (verbo = empezar). El hero sigue siendo el elemento dominante; todo lo demás se demota.

### Zonas (mobile, base) — bento con 2 zonas horizontales que rompen el stack

```
┌───────────────────────────────┐
│ Z1  HERO (focal, full, ~200px)│  workout + stat row inline + CTA primario
├─────────┬─────────┬───────────┤
│ Kcal    │ Entreno │ Racha     │  Z2  KPI STRIP (3-col, thin, borderless)
├─────────┴─────────┴───────────┤
│ Z3  NUTRICIÓN (feature, full) │  ring + macros + "Agregar comida" (2º focal)
├───────────────┬───────────────┤
│ Z4 Carga      │ Z5 Semana     │  BENTO PAIR (2-col) — ritmo variado
│    muscular   │    combinada  │  (fusiona los 2 calendarios en 1)
├───────────────┴───────────────┤
│ Z6  COMIDAS DE HOY (list,full)│  lista con thumbnails / empty-state
└───────────────────────────────┘
```

### Zonas (desktop ≥1024) — bento dedicado que usa el ancho

```
┌────────────────────────┬──────────────┐
│ Z1 HERO (2/3, focal)   │ Z2 KPIs (1/3)│  KPIs verticales
├──────────┬─────────────┼──────────────┤
│ Z3 Nutri │ Z4 Carga    │ Z5 Semana    │  fila de 3
├──────────┴─────────────┴──────────────┤
│ Z6 Comidas de hoy (full)              │
└───────────────────────────────────────┘
```

### Decisiones de agrupamiento / jerarquía / densidad

- **Hero (Z1):** se mantiene como focal. La fila de stats inline del hero se conserva; el CTA "Comenzar entrenamiento" es el **único CTA primario** de la vista.
- **KPI strip (Z2) — arregla P1:** el `SummaryStatCard` hoy `hidden sm:grid` (`app/page.tsx:344`) pasa a **visible en todos los breakpoints**, re-tratado como **strip borderless** (divisores tonales, no 3 cards). 3 métricas: Nutrición (kcal), Entreno (día X/Y), Racha. Números `tabular-nums`, jerarquía número(600)/label(500 muted). **Acento único emerald** — se eliminan los hues amber `#f59e0b` / lime `#a3e635` decorativos (DESIGN.md: 1 acento, ≤10%).
- **Nutrición (Z3):** feature card, 2º focal. Ring + macros + CTA secundario. Se mantiene su composición mobile (ring izq / macros der).
- **Bento pair (Z4+Z5):** dos zonas a media-columna en mobile → **rompe la monotonía vertical**.
  - Z4 Carga muscular: figura `BodyMuscleFigure` **agrandada/legible** (hoy `scale-[0.72]` h-120 flotando — P6). Media columna.
  - Z5 **Semana combinada (consolidación agresiva — arregla P3):** UN card que reemplaza los dos `WeekStripCard` (Constancia + Registro nutricional). Dos filas de 7 dots etiquetadas (Entreno / Nutrición) en una sola vista de semana.
- **Comidas (Z6):** se mantiene la lista con thumbnails (patrón correcto de las refs) + empty-state existente.
- **Ritmo espacial:** gap **entre zonas** > gap **dentro** de zona (hoy todo ~12px plano — P2). Zonas relacionadas agrupadas, aire real entre grupos.

### Qué colapsa en mobile
- Desktop bento de 3 columnas (Z3/Z4/Z5) → en mobile: Z3 full + fila 2-col (Z4|Z5).
- KPIs verticales en desktop → strip horizontal 3-col en mobile.

---

## FASE 3 — Piel premium (solo si FASE 2 aprobada; NO cambia layout)

Aplicar sobre el layout de FASE 2, respetando `DESIGN.md`:

- **Tipografía/escala:** Sora (`--font-display`) para número hero y métricas KPI; tracking negativo leve en tipografía grande; escala DESIGN.md (Display 2rem/700, H2 1.25rem, Label 0.8125rem/500, Caption 0.75rem). `tabular-nums` en todo número dinámico.
- **Elevación por superficie (no sombras):** base `--card` → paso `--card-alt` para anidados; borde `--border` sutil. Radio por escala (cards 14, chips 8, controles 10). Radio concéntrico en anidados.
- **Restricción cromática:** emerald ≤10% superficie; un CTA primario; macro-hues solo semánticos (prot/carb/gras), gradiente de fuerza solo como data-viz.
- **Minimalismo:** editar de más — quitar labels uppercase redundantes (P4), reducir densidad de bordes.
- **Motion:** reutilizar sistema `motion.tsx` (fadeUp/stagger); confirmar `prefers-reduced-motion` (hoy solo `AnimatedProgressRing` lo maneja en JS — verificar strip/macrobar).

---

## Archivos a modificar

- **`app/page.tsx`** — reescribir el JSX de layout de `Home()` (l.225-455): nuevo grid/bento por zonas; mostrar KPI strip en mobile; sustituir los 2 `WeekStripCard` por el nuevo card Semana combinada; ajustar `SummaryStatCard` a variante strip borderless emerald. La lógica de datos (l.128-223) **no cambia**.
- **Nuevo** `app/components/shared/WeekCombinedCard.tsx` — card único que compone `TrainingCalendarCard` + `NutritionCalendarCard` en modo `variant="weekly" bare` (ambos ya soportan `bare`), con dos filas etiquetadas. Reutiliza los componentes existentes; no reimplementa el calendario.
- Posible ajuste menor en `SummaryStatCard` (subcomponente en `app/page.tsx:504`) o extraerlo a `app/components/shared/` si se reusa como strip.

### Reutilizar (no reinventar)
- `WeekStripCard` / `TrainingCalendarCard` / `NutritionCalendarCard` (`bare`, `variant="weekly"`) — `app/components/shared/`.
- `AnimatedProgressRing` (fixed-size) — `app/components/ui/ProgressRing.tsx:8`.
- `BodyMuscleFigure` (bare, `h-full w-full`) — `app/components/shared/BodyMuscleFigure.tsx:399`.
- Motion: `MotionDiv`, `MotionSection`, `fadeUp`, `staggerContainer`, `AnimatedMacroBar` — `app/components/ui/motion.tsx`.
- `Button` (`asChild`, size sm/default) — `app/components/ui/Button.tsx:40`.
- Grids inline Tailwind (convención del repo): `grid grid-cols-1 gap-4 lg:grid-cols-2` etc. No existe primitiva bento — usar tracks explícitos por zona.

---

## Verification

1. **Typecheck/lint:** `npm run build` o `tsc --noEmit` (no romper tipos de props de los componentes reusados).
2. **Playwright mobile (390×844):** login vía OTP admin (Supabase `admin/generate_link` con `SERVICE_ROLE_KEY` → `/api/auth/verify-otp` in-browser; email `gymcontrolweb@gmail.com`). Dev server gymcontrol en **:3001** (PID activo; `:3000` es OTRA app). Screenshot dashboard: verificar bento (no stack), KPI strip visible, sin overflow horizontal, header/nav intactos.
3. **Playwright desktop (≥1280):** verificar bento de 3 columnas, hero 2/3.
4. **Re-score StyleSeed** post-FASE 3 (objetivo ≥85): confirmar P1-P4/P6 resueltos.
5. **Antes/después:** screenshots mobile+desktop (entregable FASE 3).

## Riesgos
- Semana combinada: `TrainingCalendarCard`/`NutritionCalendarCard` en `weekly bare` deben encajar en media columna sin recorte — validar en Playwright.
- KPI strip: al quitar amber/lime, confirmar que la distinción entre KPIs se mantiene por label/posición, no por color.
- Bento 2-col en mobile: alturas dispares (figura vs semana) — usar `h-full` + `items-stretch`.
- No alterar el flujo de datos server (`Promise.all`) ni props que consumen los componentes.

---
---

# FASE 4-6 — A11y + Micro-interacciones + Verificación (continuación)

## Context (FASE 4-6)

FASE 2 (bento) y FASE 3 (piel) ya están **implementadas y verificadas** en `app/page.tsx` + nuevo `app/components/shared/WeekCombinedCard.tsx` (StyleSeed 78→~90). Ahora, sobre ese resultado:
- **FASE 4:** cerrar WCAG 2.2 en el dashboard. PWA instalada = se trata como app nativa, a11y no es opcional.
- **FASE 5:** micro-interacciones con feedback táctil (mobile no tiene hover real).
- **FASE 6:** verificación funcional end-to-end (que la reescritura visual no rompió el flujo).

Restricción dura sigue vigente: **no tocar** header móvil ni bottom nav. Solo el contenido del dashboard.

---

## FASE 4 — Accesibilidad (WCAG 2.2)

Defectos confirmados por auditoría (a11y-architect / frontend-a11y / web-design-guidelines) y sus fixes:

1. **Target táctil <44px (WCAG 2.5.8)** — CTA primario "Comenzar entrenamiento" es `Button size="sm"` = `h-9` (36px) en `app/page.tsx:~309`. **Fix:** subir a `size="default"` (`h-11`=44px) o `size="lg"`. Es el CTA focal; debe cumplir. Verificar que el hero no desborde.
2. **Contraste texto <4.5:1 (WCAG 1.4.3) + regla DESIGN.md** — `--foreground-subtle #6b7488` ≈3.6-3.8:1 sobre `--card`/`--card-alt` (FALLA). Usado en <14px en:
   - KpiStrip `sub` `text-[11px]` (`app/page.tsx`, componente `KpiStrip`)
   - `WeekCombinedCard.tsx`: day labels `text-[10px]`, separador `·`, y el `/7` de counts
   - CargaMuscular empty hint `text-xs` (`app/page.tsx`)
   **Fix:** reemplazar `text-[var(--foreground-subtle)]` → `text-[var(--foreground-muted)]` (#98a2b7 ≈6.9:1, PASA) en esos usos legibles. (Los dots inactivos usan `--card-alt` como fondo, no texto — OK.)
3. **Jerarquía de headings (WCAG 1.3.1)** — orden no monótono: Comidas es `h2` después de cards `h3`. Las cards KPI y "Esta semana" no tienen heading. **Fix:** hero title `h2` (focal) se mantiene; bajar "Comidas de hoy" a `h3`; dar a `WeekCombinedCard` un heading (`h3` "Esta semana"); dar a `KpiStrip` un `<h2 class="sr-only">Resumen de hoy</h2>` como grupo (los 3 números son datos, no secciones). Resultado: h1(sr-only) → h2(hero) → h2(sr-only resumen) → h3(nutrición/carga/semana/comidas).
4. **Iconos decorativos sin `aria-hidden`** — HeroStat icon, hero `Play`, `Plus` (×2), `UtensilsCrossed` (título Comidas, thumb) en `app/page.tsx`. **Fix:** añadir `aria-hidden="true"` a los decorativos (los que acompañan texto o están en links con `aria-label`).

**Ya OK (no tocar):** focus-visible global (`globals.css:452`), `prefers-reduced-motion` global (`globals.css:473-495`), demás targets `h-11`/`size-11`, `--foreground-muted` pasa contraste, nombres accesibles de links.

## FASE 5 — Micro-interacciones (Framer / CSS)

Prioridad: **press/active > hover** (mobile sin hover). Regla de calidad (StyleSeed): sin glows random ni bounce excesivo; usar el ease del sistema (`premiumEase` / `microTransition` en `motion.tsx`; DESIGN.md micro 120-160ms).

1. **Press feedback en KpiStrip `<Link>`** (único interactivo del dashboard sin feedback). **Fix:** añadir clase `.pressable` (`globals.css:468` → `active:scale-0.97`, ya cubierto por reduced-motion global). Preferir CSS `.pressable` sobre Framer `whileTap` porque Framer JS **no** respeta el `@media reduce` global.
2. **Count-up en números KPI** — reutilizar `AnimatedNumber` (`motion.tsx:119`) para los valores de KPI (kcal, racha) como micro-entrada, coherente con el count-up del `AnimatedProgressRing`. **Requisito:** `AnimatedNumber` hoy no usa `useReducedMotion` → **guardarlo** (añadir `useReducedMotion()` → si reduce, render directo del valor). Editar `motion.tsx`.
3. **Transición de icono** — el `ChevronRight` de Comidas ya translada en hover; añadir el mismo `group-hover:translate-x-0.5` + `active:translate-x-0.5` donde haya flecha/afordancia de navegación (KPI links opcional).
4. **Entrada** — ya existe (`fadeUp`/`staggerContainer` stagger). No agregar más; evitar sobre-animar.

Nota de alcance honesta: el dashboard **no tiene tabs/drawer/modal propios** (el sheet "Más" es nav intocable), así que FASE 5 se concentra en press-states + count-up + icono. No inventar UI para justificar motion.

## FASE 6 — Verificación funcional (end-to-end)

Con `playwright-cli` (dev en **:3001**, login por bypass admin — ver memoria `admin_account`), recorrer la pantalla real mobile (390) + desktop (1280) y correr el flujo, no solo typecheck:

1. **Typecheck/build:** `npx tsc --noEmit` (o confirmar compile limpio en dev).
2. **Navegación real (cada CTA del dashboard):**
   - Hero "Comenzar entrenamiento" → `/rutinas/dia?...` (o `/rutinas`).
   - Hero "Ver rutina" → `/rutinas`.
   - KPI "Nutrición" → `/nutricion/registro`; KPI "Entreno" → `primaryHref`.
   - "Agregar comida" (×2) → `/nutricion/registro`; "Ver detalle muscular" → `primaryHref`; Comidas chevron → `/nutricion/registro`.
   - Bottom tabs no alterados (Admin/Ejercicios/Rutinas/Alimentos/Más).
3. **A11y runtime:** tabular por teclado (Tab) confirmando foco visible y orden lógico; confirmar target del CTA ≥44px; (opcional) axe-core vía `playwright-cli eval` si está disponible.
4. **Regresión visual:** confirmar bento intacto mobile+desktop, sin overflow, header/nav OK.

**Entregable:** reporte OK/roto por CTA + checklist WCAG + screenshot/clip.

## Archivos a modificar (FASE 4-6)
- `app/page.tsx` — Button size del CTA hero; `text-subtle`→`text-muted` (KpiStrip sub, CargaMuscular hint); `.pressable` + count-up en KpiStrip; heading `h3` en Comidas + `sr-only h2` en KpiStrip; `aria-hidden` en iconos decorativos.
- `app/components/shared/WeekCombinedCard.tsx` — `text-subtle`→`text-muted` (labels/sep/counts); heading `h3` "Esta semana".
- `app/components/ui/motion.tsx` — `AnimatedNumber`: añadir guard `useReducedMotion`.

### Reutilizar
- `.pressable` (`globals.css:468`), focus global (`globals.css:452`), `@media reduce` (`globals.css:473`).
- `AnimatedNumber`, `premiumEase`, `microTransition` (`motion.tsx`).
- Tokens `--foreground-muted`, `--accent-bright`.

## Verificación (FASE 4-6)
Ver FASE 6 arriba: tsc + recorrido Playwright mobile/desktop de todos los CTAs + chequeo de foco/target por teclado + confirmación de no-regresión visual. Screenshots antes/después del foco y del press state.
