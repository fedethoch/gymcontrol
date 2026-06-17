# Plan — Responsive mobile fixes (Home, Nutrición/Registro, Admin)

## Context

Solo **responsive mobile**. Tres páginas se sienten "encerradas" en cards y tienen
detalles rotos en pantallas chicas. Objetivos confirmados con el usuario vía previews:

- **Home**: misma distribución exacta, pero sin cards/bordes (todo más suelto). Calendarios
  Constancia/Nutrición centrados. Reconstruir el componente de carga muscular para que quede
  "casi idéntico" a `public/references/body_compontent.png`.
- **Nutrición/Registro**: mismo orden, sin cards. Sacar "Este mes" de Constancia (mantener "Racha").
  Acortar el mensaje bajo "Vas en camino" para que entre en 1-2 líneas.
- **Admin**: las dos tablas (Últimos ejercicios / Últimas rutinas) apiladas full-width, cada una
  entrando sin scroll horizontal.

No se cambia desktop salvo lo que herede del responsive. No se toca lógica de datos.

---

## 1. Home — `app/page.tsx` + `app/components/shared/BodyMuscleFigure.tsx`

### 1a. Sacar cards, misma distribución
Mantener la grilla actual `grid grid-cols-2 gap-2 lg:grid-cols-3` y el mismo orden/spans
(Nutrición, Carga muscular, Comidas hoy `col-span-2 lg:col-span-1`, Constancia, Nutrición cal).

- Quitar el chrome de `Card`/`CardContent` en los 4 componentes locales (`NutricionCard`,
  `CargaMuscularCard`, `ComidasHoyCard`) y en los dos calendarios: borde, fondo gradiente,
  shadow, hover translate. Reemplazar `<Card>...<CardContent className="p-3">` por un `<div>`
  suelto con solo padding mínimo. Conservar todo el contenido interno tal cual.
- **Hero "Hoy toca"** (L117-158): quitar borde/shadow/caja y el bloque decorativo
  `hidden lg:block`; dejar el bloque suelto (eyebrow + título + botón Comenzar).
- Separación entre filas con divisores finos (`border-t border-[var(--border)]/60`) en los
  items que arrancan fila (Comidas hoy, primer calendario) en vez de cajas. Mantener el look
  de la preview confirmada.

### 1b. Centrar calendarios
`TrainingCalendarCard` y `NutritionCalendarCard` rinden el heatmap con `w-fit` pegado a la
izquierda. Envolver el grid en un contenedor `flex justify-center` (o `mx-auto`) para centrarlo
dentro de su slot. Aplicar en ambos: `app/components/shared/TrainingCalendarCard.tsx` y
`NutritionCalendarCard.tsx` (en su render normal de home; cuidar no romper el modo `bare`).

### 1c. Reconstruir `BodyMuscleFigure.tsx` (hand-craft SVG detallado)
Estado actual: elipses/rects crudos, 3 niveles de color, leyenda gradiente abajo. No existe
librería ni asset (`react-body-highlighter` no instalado). Decisión: **SVG hand-craft**.

- Reescribir las dos vistas (front/back) con paths anatómicos con más detalle (musculatura
  definida: pecho/abs/cuádriceps/gemelos/hombros front; dorsales/glúteos/isquios/tríceps back),
  inspirado en la referencia pero en **dark theme** (cuerpo base oscuro, músculos coloreados).
- **Escala multi-tono** (reemplaza verde/amarillo/rojo): mapear ratio carga→color en gradiente
  bajos→altos (ej. verde → amarillo → naranja → púrpura → azul → rojo). Actualizar `COLOR`
  e `intensity()` para devolver más pasos, o interpolar sobre el ratio.
- **Sin leyenda lateral** (no entra en media pantalla): mantener solo los dos cuerpos + barra
  de escala horizontal abajo ("Bajos … Altos" con el gradiente multi-tono).
- Conservar la API actual (`muscleLoad`, `maxCount`) y el matching por keyword (`match()`).
- Quitar el tamaño fijo `h-[100px]` si conviene para que escale al slot; mantener `w-auto`
  y centrado.

Representative files: `app/page.tsx`, `app/components/shared/BodyMuscleFigure.tsx`,
`app/components/shared/TrainingCalendarCard.tsx`, `app/components/shared/NutritionCalendarCard.tsx`.

---

## 2. Nutrición/Registro — `app/nutricion/registro/RegistroClient.tsx`

### 2a. Sacar cards, mismo orden
Mismo orden actual: Resumen del día → Comidas de hoy → fila `grid grid-cols-2` (Constancia + Tip).
- Quitar chrome de los 4 `Card` de sección (Resumen L292, Comidas L367, Constancia L408,
  `NutritionTipCard` L900) → `<div>` sueltos + divisores finos. Conservar contenido.
- `MealCard` (items de comida): aligerar (quitar borde de card pesado, dejar fila/bloque
  simple). Cambio menor, mantener legibilidad.

### 2b. Constancia: sacar solo "Este mes"
En el header de Constancia (L408-414): eliminar `<SummaryStat label="Este mes" .../>` (L413).
**Mantener** `<SummaryStat label="Racha" value={`${streak}d`} />` (L412).

### 2c. "Vas en camino" en 1-2 líneas
El tip queda en su slot de media pantalla (no se mueve la distribución). Acortar los mensajes
en `getNutritionTip` (L917-943), en particular el de "Vas en camino":
- De: `Llevás ${pct}% de tu objetivo diario (${remainingKcal} kcal restantes). Planificá tu próxima comida para mantener el ritmo.`
- A algo como: `Llevás ${pct}% · ${remainingKcal} kcal restantes.`
- Revisar los otros 3 mensajes de tip y acortarlos parejo para que ninguno pase de 2 líneas.
- Quitar/ajustar `line-clamp-3` en el `<p>` del mensaje (L911) para que muestre completo.

File: `app/nutricion/registro/RegistroClient.tsx` (header `page.tsx` no cambia).

---

## 3. Admin — `app/admin/page.tsx`

Tablas "Últimos ejercicios" + "Últimas rutinas" (L174) hoy en `grid grid-cols-2 gap-4` fijo
→ apretadas y con scroll horizontal interno en mobile.

- Cambiar ese wrapper a apilado full-width: `grid grid-cols-1 gap-4 lg:grid-cols-2`
  (mobile-first: 1 columna; desktop conserva 2-up). Cada tabla ocupa el ancho completo en su
  propia fila en mobile.
- Con ancho completo, las 3 columnas de ejercicios entran sin disparar el `overflow-x-auto`
  interno (`Table.tsx` L7). Objetivo confirmado: **solo** eliminar scroll horizontal; no limitar
  filas ni tocar scroll vertical.
- **No** tocar la sección de "Acciones rápidas/Resumen" (L121) ni los stat tiles — fuera de
  alcance.

File: `app/admin/page.tsx` (RecentExercisesTable / RecentActivityTable no requieren cambios).

---

## Verificación (Playwright, iterar hasta OK)

Login con credenciales de `.env.local` (`EMAIL` / `EMAIL_PASSWORD`). Viewport mobile (~375px).

1. **Home** `/`: screenshot. Verificar: sin bordes/cajas, misma distribución; Constancia y
   Nutrición heatmaps centrados; carga muscular renderiza cuerpos detallados + escala multi-tono;
   sin overflow horizontal de página.
2. **Registro** `/nutricion/registro`: screenshot. Verificar: sin cards; Constancia muestra
   "Racha" y NO "Este mes"; texto bajo "Vas en camino" en ≤2 líneas.
3. **Admin** `/admin`: screenshot. Verificar: las dos tablas apiladas full-width, cada una sin
   scroll horizontal.
4. Comparar carga muscular contra `public/references/body_compontent.png`; ajustar paths/colores
   hasta quedar "casi idéntico" (dark theme). Re-screenshot e iterar.
5. `graphify update .` al finalizar para mantener el grafo.

## Riesgos

- **BodyMuscleFigure** es el ítem de mayor esfuerzo: lograr "casi idéntico" en dark theme con
  SVG a mano requiere varias iteraciones visuales con Playwright.
- Sacar cards manteniendo divisores en una grilla 2-col puede necesitar reagrupar filas; cuidar
  no alterar el orden/spans confirmados.
- `MealCard` aligerado: validar que no quede ilegible sin su contenedor.
