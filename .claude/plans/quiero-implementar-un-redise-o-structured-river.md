# Corrección visual — Dashboard principal (PWA) — Ronda 2

## Context

El rediseño v1 de `app/page.tsx` ya tiene la estructura general y todos los datos
reales, pero **no replica fielmente** el mockup
`docs/design-references/dashboard-principal-redesign-v1.png`. Diferencias clave:
hero demasiado alto y con imagen dinámica, cards de resumen sin color/jerarquía,
Nutrición y Carga muscular **apiladas** cuando la referencia las pone en **una
fila de 2 columnas**, empty state de Comidas sin la composición del mockup, y
cards inferiores que leen como "calendario genérico" sin header de día ni
contador. Objetivo: corregir la capa visual para acercarla al mockup **sin tocar
lógica, rutas, datos, auth ni DB**. Solo `app/page.tsx`.

## Decisiones confirmadas (esta ronda)

- **Hero**: imagen **fija** `/images/hero.png` (no `todayCardImageUrl`).
- **CTA "Ver detalle muscular"**: **se omite** (no existe ruta). La card Carga
  muscular queda sin CTA, igual que hoy.

## Diagnóstico — diferencias actuales vs referencia

1. **Hero**: usa imagen dinámica (`todayCardImageUrl`), `minHeight: 220` →
   demasiado alto. Referencia es más compacto.
2. **3 cards resumen**: poco color (todos los iconos violeta `#9a63ff`), número
   chico (`text-base`), labels en 8px apretados. Referencia: cada card con icono
   de color distinto (Entrenamiento violeta, Nutrición naranja/flame, Constancia
   verde/trending), número grande, label + sublabel legibles, más peso visual.
3. **Nutrición de hoy + Carga muscular**: hoy **apiladas full-width**. Referencia
   = **misma fila, 2 columnas**.
4. **Comidas de hoy (empty)**: hoy centrado vertical. Referencia: texto a la
   izquierda + ilustración/icono tenue a la derecha, CTA debajo.
5. **Constancia semanal / Registro nutricional**: `bare` actual orienta días en
   vertical (7 filas, flujo por columna), sin header de día ni contador.
   Referencia: subtítulo + grilla heatmap + contador `0 de 7 días`.

## Plan de corrección por bloque

### 1. Hero (compacto + imagen fija)
- `src={todayCardImageUrl}` → `src="/images/hero.png"`.
- Bajar altura: `minHeight: 220` → ~170–180, reducir `pt-28` y `pb-5`.
- Mantener: eyebrow "HOY TOCA", título grupos musculares con separador violeta,
  subtítulo "Día N…", fila de 3 `HeroStat`, CTAs (Comenzar + Ver rutina).

### 2. Tres cards de resumen (más color y jerarquía)
- `SummaryStatCard`: prop `accent` por card (icono + tinte del chip). Entrenamiento
  violeta (`--accent`), Nutrición naranja (`#fb923c`), Constancia verde (`#22c55e`).
- Subir número (`text-base` → `text-lg`/`text-xl`), label 9–10px legible (no 8px),
  sublabel 9px. Icono en chip redondeado con bg del accent al 10–15%.

### 3. Nutrición de hoy + Carga muscular en una fila
- Envolver ambas en `grid grid-cols-2 gap-2` (en vez del stack actual).
- `NutricionTodayCard` → layout vertical compacto (ring arriba, macros debajo,
  CTA al pie) para entrar en media columna. Mantener `AnimatedProgressRing` +
  `AnimatedMacroBar` + CTA "Agregar comida" → `/nutricion/registro`.
- `CargaMuscularCard` en la otra media columna; `BodyMuscleFigure` escalado para
  no recortarse; leyenda Base/Intensidad/Elite. **Sin CTA**.
- `ComidasHoyCard` pasa a fila propia full-width debajo de ese grid.

### 4. Comidas de hoy (empty state fiel)
- Empty: layout horizontal → título/texto/CTA a la izquierda, icono
  `UtensilsCrossed` grande y tenue a la derecha. CTA → `/nutricion/registro`.
- Estado con comidas: sin cambios.

### 5. Constancia semanal / Registro nutricional (heatmap con contexto)
- Mantener `TrainingCalendarCard`/`NutritionCalendarCard` `bare`.
- Wrapper en `page.tsx`: subtítulo ("Entrenamientos completados" / "Días con
  registro") + **contador** `X de N días` derivado de `completedTrainingDates` /
  `nutritionLoggedDates` en la ventana mostrada. Ajustar spacing al mockup.
- Header exacto `L M M J V S D` horizontal chocaría con la orientación vertical
  del `bare` (modificar el componente compartido está fuera de alcance);
  aproximación: subtítulo + contador sin tocar el componente.

## Archivos a modificar

- **`app/page.tsx`** (único): reescribir `return` + sub-componentes
  (`SummaryStatCard`, `NutricionTodayCard`, `CargaMuscularCard`, `ComidasHoyCard`,
  wrappers de heatmaps). Reutilizar sin tocar: `Button`, `AnimatedProgressRing`,
  `AnimatedMacroBar`, `GlowPulseWrapper`, motion helpers, `BodyMuscleFigure`,
  `TrainingCalendarCard`, `NutritionCalendarCard`, `MobileHeaderBadgeSync`.
  Iconos: solo `lucide-react`.
- **`app/globals.css`**: solo si hace falta ajuste mínimo de spacing. No tocar
  reglas de `mobile-tab-bar`.
- **No tocar**: `MobileTabBar`, `MobileHeader`, calendar/body components, rutas,
  queries, auth, DB.

## Riesgos / limitaciones

- **2 columnas en mobile (390px)**: ring + macros y dos figuras de cuerpo en
  media columna quedan apretados → reducir tamaños (ring ~72px, figuras
  escaladas) y validar overflow con Playwright.
- **`BodyMuscleFigure`** SVG fijo 90×180 → puede recortar en media columna;
  aplicar `scale`/contenedor `overflow-hidden` y verificar.
- **Header de día del heatmap**: replicarlo exacto requeriría tocar el componente
  compartido (fuera de alcance) → aproximación con subtítulo + contador.
- Cambios de densidad → revisar scroll y padding del `page-frame` (safe-area +
  navbar).

## Verificación con Playwright (obligatoria)

1. Dev en puerto libre: `npx next dev --port 3001` (3000 ocupado por otra app).
2. Auth: sesión Supabase vía `signInWithPassword` (service role key de
   `.env.local`); inyectar cookie `sb-ignlzahslkkfucgnekkb-auth-token` =
   `"base64-" + base64url(JSON.stringify(session))` en el contexto Playwright
   (método ya validado en ronda anterior).
3. Abrir `/`, viewport mobile ~390px; screenshot full del `shell-main`.
4. Comparar lado a lado vs `docs/design-references/...v1.png`: altura hero,
   color/jerarquía de las 3 cards, fila 2-col Nutrición+Carga, empty de Comidas,
   heatmaps con contador. Anotar diffs.
5. **≥1 ronda de corrección visual** sobre los diffs; re-screenshot.
6. Checks: `npm run lint` (0 errores nuevos) + `tsc --noEmit`. No tocar config del
   linter.
7. Confirmar empty states limpios con usuario sin datos.

## Formato de entrega (al implementar)

1. Diagnóstico  2. Archivos cambiados  3. Tests ejecutados  4. Riesgos.
