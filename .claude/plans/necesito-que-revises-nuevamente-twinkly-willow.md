# Plan — Corrección visual Dashboard principal (PWA) vs referencia

## Context

La implementación actual del dashboard (`app/page.tsx`) no replica con fidelidad
`docs/design-references/dashboard-principal-redesign-v1.png`. No se quiere rediseño
libre: solo corregir layout, jerarquía, distribución, tamaños y formas para acercar
la pantalla al mockup. Cambios surgicales, sin tocar lógica, datos, rutas, auth ni
navbar inferior. Todo el dashboard vive en un único archivo con sub-componentes inline,
más dos componentes de calendario compartidos.

Referencia (lo que muestra el PNG):
- Hero con badge "Hoy toca" violeta, título grande, subtítulo, y 3 stats en fila —
  cada stat con icono a la izquierda y dato/descripción apilados a la derecha.
- 3 cards resumen (Entrenamiento/Nutrición/Constancia) con counter chico, unidad al
  lado del counter, barra debajo y texto descriptivo debajo de la barra.
- "Nutrición de hoy" con anillo kcal grande y aire respecto al header; "Carga muscular"
  compacta sin huecos verticales; ambas cards a la altura mínima de Carga muscular.
- "Comidas de hoy" vacía: bloque derecho = "Sugerencia" con icono estrella, texto de
  ayuda y un dibujo a la derecha.
- Cards inferiores más altas, días de semana (círculos + letras) más grandes, títulos
  más chicos.

## Archivos a modificar

1. `app/page.tsx` — único archivo del dashboard. Sub-componentes inline: `HeroStat`,
   `SummaryStatCard`, `NutricionTodayCard`, `CargaMuscularCard`, `ComidasHoyCard`, más
   las dos cards de calendario inline dentro de `Home()` y badge "Hoy toca".
2. `app/components/shared/TrainingCalendarCard.tsx` — rama `variant="weekly"` (líneas
   50-67): tamaño de círculos y letras de los días.
3. `app/components/shared/NutritionCalendarCard.tsx` — misma rama weekly (estructura
   espejo de TrainingCalendarCard); aplicar idéntico ajuste de tamaños.

No se tocan: lógica de datos, props, rutas, auth, navbar, otras pantallas.

---

## Plan de corrección por bloque

### 1. Hero card (`app/page.tsx` ~243-342, helper `HeroStat` 489-506)

**1a. Stats con icono izquierda + dato/desc apilados a la derecha, los 3 en una fila.**
- Reescribir `HeroStat`: contenedor `flex items-center gap-1.5`; icono a la izquierda
  (un poco más grande, `size-3.5`); a la derecha un `flex flex-col leading-none` con
  `value` arriba (`text-[12px] font-semibold text-white`) y `label` abajo
  (`text-[9px] text-[#8a96ae]`).
- En la fila de stats (291-311): quitar los divisores verticales
  (`mx-2.5 h-3 w-px bg-white/20`) y pasar el contenedor a
  `flex items-center justify-start gap-5` (o `gap-6`) para separar los 3 stats.
  Mantener los guards condicionales (`estimatedMinutes > 0`, etc.).

**1b. Título y subtítulo un poco más arriba / mejor distribución.**
- En el contenedor de contenido (263): reducir el `pt-14` y dejar de empujar todo con
  `justify-end`. Cambiar a un layout que reserve aire arriba para el título y baje los
  stats/CTA: usar `justify-end` pero subir el bloque título con menos `gap` y más
  `pt`, o cambiar a `flex flex-col justify-center gap-3 pt-12 pb-4`. Calibrar contra el
  PNG en la ronda Playwright (el título queda ~centro-alto, stats y CTA debajo).
- Subir levemente el `gap` entre título y subtítulo solo si hace falta.

**1c. "Hoy toca" como badge.**
- Reemplazar el `<p>` pill (259-261) por un Badge violeta (shadcn `Badge` si existe en
  `app/components/ui`, si no estilar el span): fondo violeta translúcido
  (`bg-[#7c3aed]/20` o `#2a1d4d`), borde `border-[#7c3aed]/40`, texto `text-[#b995ff]`,
  `rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest`.
  Mantener posición `absolute left-3 top-3 z-10`.

### 2. Cards Entrenamiento / Nutrición / Constancia (`SummaryStatCard` 508-574)

- **Achicar título:** label de `text-[9px]` (igual o `text-[8px]`) — ya es chico;
  asegurar que entre en una línea sin truncar feo (revisar en Playwright).
- **Achicar counter:** `font-display text-xl` → `text-base` (o `text-[17px]`).
- **Unidad a la derecha del counter:** ya está inline (`flex items-baseline gap-1`);
  mantener. Subir levemente la unidad a `text-[9px]` para legibilidad.
- **Orden barra→texto debajo del counter:** ya es header → counter → (barra + texto).
  Mantener; el texto va debajo de la barra (`flex flex-col gap-0.5`, barra primero,
  `span` después). Correcto.
- **Textos descriptivos** (en las llamadas a `SummaryStatCard`, 351-391):
  - Entrenamiento: `text` = "Pendiente" / "Completado" (ya está, ok).
  - Nutrición: cambiar `progress.text` de `/ ${plan.targetKcal}` a
    `Objetivo: ${plan.targetKcal} kcal`.
  - Constancia: `text` = "Iniciá tu racha hoy" cuando `streak === 0`; cuando hay racha,
    una frase de felicitación tipo `¡${streak} días seguidos!` / "racha activa".

### 3. Nutrición de hoy + Carga muscular (`NutricionTodayCard` 576-672, `CargaMuscularCard` 674-734)

- **Anillo kcal más grande:** `AnimatedProgressRing size={64}` → `size={84}` (o 88),
  `strokeWidth={6}` → `7`. Subir tamaño del número interno
  (`text-xs` → `text-sm`) y `kcal` (`text-[7px]` → `text-[8px]`).
- **Más aire entre header y anillo:** en el contenedor card subir el `gap-2` a `gap-3`,
  o agregar `mt-1` al row `flex items-center gap-3` del anillo (620).
- **Altura mínima sin huecos:** quitar `h-full` forzado que estira; ambas cards usan
  `flex h-full flex-col`. En `CargaMuscularCard`, la figura `scale-[0.72] origin-top`
  deja hueco entre el cuerpo y la barra de intensidad por el `mt-auto`. Ajustar:
  - reducir el espacio compensando el escalado (envolver la figura con altura acotada,
    p.ej. `-mb-*` para recortar el espacio fantasma del `scale`, o subir el `scale` a
    `0.8` y recortar con un wrapper `overflow-hidden` de altura fija).
  - quitar `mt-auto` de la barra de intensidad para que quede pegada bajo el cuerpo.
  - El `grid grid-cols-2` padre (402) ya iguala alturas; la card de Nutrición seguirá la
    altura mínima de Carga muscular. Calibrar contra PNG.

### 4. Comidas de hoy vacía (`ComidasHoyCard` 736-845, bloque empty 765-798)

- Reescribir el bloque derecho (790-797). En vez de Flame + "Registrá tu primera comida
  del día":
  - Header "Sugerencia" con icono estrella (`Star` de lucide-react) a la izquierda:
    `flex items-center gap-1` con `Star className="size-3 text-[#fbbf24]"` y
    `span text-[9px] font-bold uppercase tracking-wide text-[#7887a6]`.
  - Debajo, texto de ayuda: "Registrá tu primera comida para empezar a alcanzar tus
    objetivos diarios" (`text-[8px] leading-tight text-[#404e66]`).
  - A la derecha del texto, un dibujo/ilustración. Aproximación: icono lucide temático
    (p.ej. `Salad` / `Apple` / `Utensils`) tenue, o un SVG decorativo simple. (Ver
    Limitaciones: el PNG muestra una ilustración custom; se replicará la intención con
    un icono/figura, no un asset idéntico.)
  - Ensanchar el bloque derecho de `w-14` a `w-auto`/`flex-1` acotado según haga falta
    para que entren título + texto + dibujo. Mantener el divisor `w-px`.

### 5. Cards inferiores: Constancia semanal / Registro nutricional

**En `app/page.tsx` (436-462):**
- Hacerlas más altas: subir padding `p-2.5` → `p-3` y/o agregar `min-h-[*]` al wrapper,
  o subir el `gap` interno para más aire. Calibrar contra PNG.
- Achicar títulos: `CardLabel` usa `text-[10px]`. Para estas dos, pasar el label a
  `text-[9px]` (o aceptar un prop de tamaño en `CardLabel`). Evita que el título se
  sienta grande respecto a la referencia.

**En `TrainingCalendarCard.tsx` y `NutritionCalendarCard.tsx` (rama weekly bare, ~50-67):**
- Agrandar círculos de días: `size-3` → `size-4` (o `size-5`).
- Agrandar letras de días: `text-[8px]` → `text-[10px]`.
- Subir `gap-1` a `gap-1.5` entre letra y círculo si queda apretado.

---

## Riesgos / limitaciones

- **Ilustración de "Sugerencia" (punto 4):** el PNG usa un dibujo custom; no hay asset
  equivalente en el repo. Aproximación más cercana: icono lucide temático tenue o SVG
  decorativo simple. Si se quiere fidelidad exacta hace falta exportar el asset.
- **`HeroStat` es compartido** solo dentro del hero — seguro reescribirlo.
- **`CardLabel` es compartido** por 4 bloques (Nutrición de hoy, Carga muscular,
  Constancia semanal, Registro nutricional). Para achicar solo los títulos inferiores
  sin afectar los superiores, agregar un prop opcional de tamaño en vez de hardcodear.
- **Escalado de `BodyMuscleFigure` con `scale-[]`** deja espacio fantasma; recortarlo
  requiere calibración visual (no es exacto a priori) — se ajusta en la ronda Playwright.
- **Counters y unidades** comparten `SummaryStatCard`: cualquier cambio de tamaño aplica
  a las 3 cards por igual (deseado).
- No se modifica navbar, lógica, datos ni otras pantallas.

---

## Validación con Playwright (obligatoria)

Stack: Playwright (skill `playwright-cli` / `$playwright-cli`). Si el MCP de Playwright
no estuviera disponible, se usa el CLI/skill equivalente y se avisa.

1. **Levantar la app** (`npm run dev`) y loguear con las credenciales admin de
   `.env.local` (`EMAIL` / `EMAIL_PASSWORD`).
2. **Viewport PWA / mobile** (p.ej. 390×844, iPhone) — el dashboard es mobile-first.
3. **Screenshot del estado actual** del dashboard (`/`) ANTES de tocar nada, para tener
   baseline.
4. Implementar los cambios por bloque.
5. **Screenshot después** y **comparar lado a lado** con
   `docs/design-references/dashboard-principal-redesign-v1.png`: verificar
   - hero: badge, posición título, stats icono+dato/desc en fila;
   - 3 cards: tamaños de counter/título, textos;
   - Nutrición/Carga: tamaño anillo, aire, alturas sin huecos;
   - Comidas vacía: bloque Sugerencia;
   - cards inferiores: altura, tamaño de días, títulos.
6. **Ronda de corrección visual:** ajustar paddings/tamaños/gaps según diferencias
   detectadas y repetir screenshot hasta máxima fidelidad. Probar también con datos
   vacíos (sin comidas, sin rutina) para validar el empty state de "Comidas de hoy".
7. Revisar overflow/responsive y que el navbar inferior quede intacto.
