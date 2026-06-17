# Plan: Rediseño responsive mobile (gymcontrol)

## Context

El usuario quiere ajustar **solo el responsive mobile** de varias pantallas. Problemas: cards del home no entran sin scroll, círculos/proporciones mal dimensionados, banner de rutina activa "feo", layouts admin apilados, y elementos sobrantes (textos, botones, fechas). Cada rediseño fue confirmado con preview ASCII. Objetivo: que cada pantalla entre sin scroll donde se pidió y se vea más limpia en mobile. **No tocar desktop salvo lo mínimo para no romperlo.**

Validación con Playwright en viewport mobile (375px) iterando hasta que cada criterio "sin scroll" se cumpla.

## Decisiones confirmadas (previews aprobadas)

### HOME — `app/page.tsx`
Meta global: **las 6 cards + hero entran sin scroll en mobile (375px)**.

1. **Hero "Hoy toca"** (L132-202): quitar badge "Semana activa", quitar botones "Cambiar rutina activa" y "Ver semana completa". Dejar **solo un botón "Comenzar"**, chico (~1/3 ancho), **abajo a la izquierda**, que linkea a `primaryHref` (día de hoy: `/dashboard/rutinas/dia?savedRoutineId=...&day=...`). Fondo = **imagen placeholder** (div con bg placeholder, no la decoración "machine" actual). **Altura mucho menor** (reducir padding/min-height; quitar arte lateral `lg:block` no afecta mobile pero el alto sí: compactar a ~110px).
2. **NutricionCard** (L270-327): círculo **más grande (>1/2 ancho)** → subir `AnimatedProgressRing size`. Texto **"{X} kcal restantes"** como una sola línea (hoy está dividido). **Quitar** `MacroBar` segmentada. Macros P/C/G como **3 barritas apiladas** (una arriba de otra) que se llenan según % del objetivo; **sin número** al costado.
3. **CargaMuscularCard** (L339-379): reemplazar las barras horizontales por una **silueta de cuerpo (1 figura) con grupos musculares coloreados** (mock estático tipo `public/references/body_compontent.png`) + **barrita de leyenda/escala abajo** (baja→alta). Crear componente nuevo SVG `app/components/shared/BodyMuscleFigure.tsx` con paths de grupos musculares y colores mockeados (hoy hardcode; futuro: umbrales configurables por admin).
4. **HidratacionCard** (L429-466): mostrar **litros a tomar hoy** (número grande centrado + "a tomar hoy"), calculado de datos del perfil (~35 ml/kg de peso). Quitar las 8 "glasses" y el "Próximamente".
5. **TrainingCalendarCard "Constancia"** (`app/components/shared/TrainingCalendarCard.tsx`): **icono chico** + título "Constancia" en una línea; **quitar subtítulo** "Tus ultimas 10 semanas..."; calendario 10 semanas **completo dentro de la card** (ajustar tamaño de celdas para que no se recorte). Reducir padding `p-6`→menor.
6. **Reemplazar `WeeklyAttendanceCard` (frase motivadora)** por un **calendario de NUTRICIÓN** idéntico al de Constancia entrenamiento pero con datos de nutrición: **violeta = cumplió objetivo del día**, **rojo = no cumplió**, gris = sin datos. Reusar/parametrizar `TrainingCalendarCard` (agregar variante de color/dataset) o crear `NutritionCalendarCard` basado en él.

### `/dashboard/rutinas` — `app/dashboard/rutinas/page.tsx` + `WeekDaysList.tsx`
7. **Header**: círculo de progreso **mucho más grande (~1/2 ancho)** a la izquierda (subir `size` de `AnimatedProgressRing`, hoy 80). Las 3 stats (Días completados / Racha / Tiempo) **a la derecha**, apiladas (mover el stack `MetricItem` al lado del círculo en fila).
8. **Cards de días** (`WeekDaysList.tsx`): los marcadores deben ser **círculos reales** (ya hay `aspect-square rounded-full`; asegurar redondez). **Quitar** `<p>Dia {dayOrder}</p>` (L64). Dar **protagonismo al nombre del día** (L65-67, agrandar). **Agrandar botón "Ver"** (L85-89).

### `/catalogo/rutinas/[id]` — `page.tsx` + `RoutineDetailClient.tsx`
9. En mobile: **solo la imagen con info en overlay** (nombre + chips: cant. días, objetivo, nivel). Debajo, **botones sueltos** (no en card): **Activar/Desactivar** e **"Ir a mis rutinas"**. Al guardar, **toast sonner auto-dismiss** (reusar `sonner` ya montado en `app/layout.tsx:64`; hoy hay banners inline + StatusToast en `/dashboard`). Días/ejercicios en **formato tabla** (ya existe `Table` en `RoutineDetailClient`; usar tabla también en mobile en vez de los cards). **Sin scroll hasta los primeros 5 ejercicios** (compactar imagen + tabla).

### `/dashboard` — `app/dashboard/page.tsx`
10. Reemplazar el **banner grande** de rutina activa (L120-169) por algo **sutil**: solo un **punto verde + nombre de la rutina** (sin la etiqueta "Rutina activa", confirmado por el usuario), sin imagen grande. Mantener el grid de métricas debajo y el empty state.

### `/nutricion/registro` — `RegistroClient.tsx`
11. Círculo (L307-320) **~40% del ancho** (subir `size`, hoy 128). **Barras de macros se mantienen al lado** (a la derecha, en la fila flex actual L306).

### `/admin` — `app/admin/page.tsx`
12. **2 cards por fila en mobile**: fila 1 = **Acciones rapidas + Resumen de gestion**; fila 2 = **Ultimos ejercicios agregados + Ultimas rutinas agregadas**. Cambiar grids `sm:grid-cols-2` → `grid-cols-2` (2 columnas ya en mobile). **Renombrar** heading "Ultimas rutinas" → **"Ultimas rutinas agregadas"** (L213). Mover/compactar para que **acciones+resumen entren sin scroll** (stat tiles arriba se mantienen compactos).

### `/admin/rutinas` — `RoutineAdminClient.tsx`
13. **Quitar** la línea `<p>Creada {createdAtLabel}</p>` de las cards mobile (L490). **Compactar** las cards para que **las primeras 3 entren sin scroll**; el resto con scroll.

## Archivos a modificar

- `app/page.tsx` (hero + Nutricion/CargaMuscular/Hidratacion cards inline + grid)
- `app/components/shared/TrainingCalendarCard.tsx` (constancia compacta + variante nutrición)
- **Nuevo** `app/components/shared/BodyMuscleFigure.tsx` (SVG cuerpo con músculos coloreados, mock)
- **Nuevo/derivado** `NutritionCalendarCard` (o prop de color en `TrainingCalendarCard`)
- `app/dashboard/rutinas/page.tsx` + `app/dashboard/rutinas/WeekDaysList.tsx`
- `app/catalogo/rutinas/[id]/page.tsx` + `RoutineDetailClient.tsx` (toast on save)
- `app/dashboard/page.tsx`
- `app/nutricion/registro/RegistroClient.tsx`
- `app/admin/page.tsx`
- `app/admin/rutinas/RoutineAdminClient.tsx`

## Reutilizables existentes (no recrear)

- `AnimatedProgressRing` (`app/components/ui/ProgressRing.tsx`) — círculos; cambiar prop `size`.
- `sonner` + `<Toaster richColors position="top-center"/>` ya montado (`app/layout.tsx:64`); patrón `StatusToast` (`app/components/shared/StatusToast.tsx`).
- `Card`, `Button`, `Badge`, `Table`, `Tabs`, `Input` en `app/components/ui/`.
- `MotionDiv`, `fadeUp`, `staggerContainer` (`app/components/ui/motion.tsx`).
- Datos de hidratación: `getNutritionProfile` (perfil con peso) ya se fetchea en `app/page.tsx`.

## Verificación (Playwright, iterar)

Para cada pantalla, viewport **375x812** (mobile), usuario admin (creds en `.env.local`: `EMAIL`/`EMAIL_PASSWORD`):

1. `/` (home): assert que hero + las 6 cards son visibles sin scroll (bounding box dentro de viewport); círculo nutrición ancho > 50% card; card hidratación muestra litros; constancia y calendario nutrición renderizan grid completo (sin recorte).
2. `/dashboard/rutinas`: círculo grande izq, stats a la derecha; cards de día sin "Dia N", botón Ver más grande, marcadores redondos.
3. `/catalogo/rutinas/[id]`: imagen con overlay, botones sueltos debajo, tabla de días, primeros 5 ejercicios visibles sin scroll; guardar → aparece toast y desaparece solo.
4. `/dashboard`: sin banner grande; punto verde + nombre rutina visible.
5. `/nutricion/registro`: círculo ~40% ancho, barras al lado.
6. `/admin`: acciones+resumen en una fila y ejercicios+rutinas en otra (2 col mobile), sin scroll hasta acciones+resumen; heading "Ultimas rutinas agregadas".
7. `/admin/rutinas`: sin "Creada"; primeras 3 cards visibles sin scroll.

Criterio de éxito por pantalla = el assert de "sin scroll"/visibilidad pasa en 375px. Iterar ajustando tamaños/padding hasta verde. Correr `graphify update .` al final.

## Riesgos

- "Todo sin scroll" en mobile es agresivo (home con 6 cards + hero): puede requerir reducir bastante alturas/padding; si no entra en 375x812 real, priorizar compactación y avisar.
- `BodyMuscleFigure` es **mock** hoy (colores hardcode); la config por umbrales del admin queda fuera de alcance.
- Hidratación: el cálculo depende de que el perfil tenga peso cargado; si falta, mostrar fallback.
- Cambiar grids admin a `grid-cols-2` en mobile puede apretar texto en pantallas muy chicas; verificar legibilidad.
