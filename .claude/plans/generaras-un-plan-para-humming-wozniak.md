# Plan: Fixes responsive mobile (Home cuerpo + Nutrición registro)

## Context

Dos problemas de UI, **solo responsive mobile**:

1. **Home (`app/page.tsx`)** — la visualización "Carga muscular" usa un SVG dibujado a
   mano (`app/components/shared/BodyMuscleFigure.tsx`) con formas geométricas crudas. El
   usuario quiere que se vea como `public/references/body_compontent.png`: cuerpos
   anatómicos realistas (frente + espalda) con grupos musculares coloreados por
   intensidad. Decisión confirmada: **usar la librería `react-body-highlighter`** (su
   estética es la de la referencia). **Sin leyenda** (el usuario la descartó).

2. **`/nutricion/registro` (`RegistroClient.tsx`)** — el bloque "Constancia" muestra
   "Racha 1d", el calendario queda flotando centrado (desalineado del título), y el tip
   "Vas en camino" no tiene panel propio → se ve "perdido". Confirmado: quitar "Racha
   1d", **título "Constancia" centrado** sobre el calendario, y envolver el tip en un
   panel con borde.

Objetivo: iterar con Playwright (viewport mobile) hasta que ambos coincidan con lo
aprobado.

---

## Rediseño 1 — Cuerpo "Carga muscular" (Home)

**Archivos:** `app/components/shared/BodyMuscleFigure.tsx` (reescribir interior),
`package.json` (nueva dep). `app/page.tsx` **no cambia** (sigue pasando
`muscleLoad` + `maxCount` al mismo componente → cambio aislado).

**Pasos:**
1. Instalar dep: `npm i react-body-highlighter`.
   - ⚠️ Riesgo: la librería tiene peerDeps viejas (React 16/17). Con React 19.2 puede
     requerir `--legacy-peer-deps`. Verificar render real; si rompe, fallback abajo.
2. Reescribir `BodyMuscleFigure.tsx`:
   - Mantener firma de props (`muscleLoad?`, `maxCount?`) — no tocar `app/page.tsx`.
   - Conservar `intensity()` y el matching bilingüe `match()`/`c(...)` ya existentes
     (líneas 13-58) para mapear las keys de `muscleLoad` a los slugs de la librería:
     `chest, biceps, triceps, forearm, trapezius, front-deltoids, back-deltoids,
     upper-back, lower-back, abs, obliques, quadriceps, hamstring, calves, gluteal`.
   - Construir `data: IExerciseData[]` agrupando músculos por bucket de intensidad
     (frequency 1-4) y pasar `highlightedColors` = escala actual del COLOR map
     `[#16a34a, #ca8a04, #ea580c, #dc2626]`. `bodyColor` = gris base (`#263347`/`#1e2a3a`).
   - Renderizar **dos** `<Model type="anterior" />` y `<Model type="posterior" />`
     lado a lado, centrados, alto fijo tipo `~130px` (mobile-first).
   - **Sin leyenda.** Conservar la barra de escala gradiente inferior (Baja→Alta) que
     ya existe (líneas 151-161).
3. **Fallback si la librería no renderiza con React 19:** vendorizar el SVG anatómico
   (copiar los paths del paquete a un componente local) y colorear por `fill`, mismo
   data flow. No volver al SVG crudo actual.

**Layout aprobado (mobile):** 2 cuerpos centrados + barra de escala abajo, sin leyenda.

---

## Rediseño 2 — Bloque "Constancia" + tip (`/nutricion/registro`)

**Archivo:** `app/nutricion/registro/RegistroClient.tsx` (líneas ~403-413 y el
componente `NutritionTipCard` ~877-903). No tocar `getNutritionTip` (texto se mantiene).

**Cambios:**
1. **Quitar "Racha 1d":** borrar línea 406
   `<SummaryStat label="Racha" value={\`${streak}d\`} />`.
   - `streak` / `calculateStreak` siguen usándose en línea 360 ("Racha actual") → no
     se tocan. (Solo se elimina la racha del bloque Constancia, como pidió el usuario.)
2. **Título centrado + calendario alineado:** en la celda izquierda (línea 404):
   - Título "Constancia" → centrar (`text-center`).
   - Quitar el `flex flex-1 items-center justify-center` del wrapper del calendario
     (línea 407) que lo empuja al centro vertical; dejar el calendario pegado bajo el
     título (centrado horizontal: `flex justify-center`).
3. **Tip "Vas en camino" con panel propio:** envolver el contenido de `NutritionTipCard`
   (líneas 890-902) en un panel con borde/fondo igual al de los meal cards
   (`rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-3/p-4`) para que
   no quede "perdido". Mantener icono Flame + title + message.

**Layout aprobado:** grid 2 columnas — izq: "Constancia" centrado sobre calendario;
der: tip dentro de panel con borde.

---

## Verificación (Playwright, mobile)

Credenciales admin en `.env.local` (`EMAIL` / `EMAIL_PASSWORD`).

1. `npm run dev`, login con la skill `playwright-cli`, viewport mobile (~390x844).
2. **Home `/`:** screenshot del card "Carga muscular". Confirmar: 2 cuerpos anatómicos
   frente+espalda, músculos coloreados por intensidad, barra de escala, sin leyenda, sin
   overflow horizontal. Comparar contra `body_compontent.png`.
3. **`/nutricion/registro`:** screenshot del bloque inferior. Confirmar: no aparece
   "Racha 1d", "Constancia" centrado y calendario alineado debajo, tip dentro de panel
   con borde. Sin desbordes en mobile.
4. Iterar ajustes (tamaños/colores/spacing) hasta que coincida con lo aprobado.
5. `npm run lint` y `npx tsc --noEmit` (o `next build`) sin errores. Correr
   `graphify update .` al final.

## Riesgos

- `react-body-highlighter` peerDeps viejas vs React 19.2 → puede necesitar
  `--legacy-peer-deps` o el fallback de vendorizar el SVG.
- Mapeo de slugs de músculos: las keys reales de `muscleLoad` vienen de
  `exercise.muscleGroup` (DB) en español; validar que el `match()` cubra los valores
  reales (revisar datos de la rutina activa al testear).
- Mobile angosto: 2 cuerpos lado a lado pueden quedar chicos; ajustar alto/escala.
