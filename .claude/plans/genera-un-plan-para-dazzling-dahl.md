# Rediseño cards sin borde + headers compactos

## Context

Las cards de varias rutas usan un borde marcado (`border border-[#1a2235]`,
`border-[var(--border)]`, hex varios) que el usuario quiere eliminar. En su lugar,
cada card debe distinguirse del fondo **solo por un color de fondo levemente más
claro, sin línea de borde**. Además, el header de cada ruta gasta mucho espacio
vertical con eyebrow + título grande + descripción; se deja solo el nombre corto
(eyebrow) y se recupera el espacio agrandando los componentes clave.

Fondo de página (todas las rutas): gradiente oscuro `#070a12→#090d16→#05070b` +
glow radial violeta. No existe `tailwind.config` (Tailwind v4, config en
`app/globals.css`). No hay `<Card>` compartida para home/registro (divs a mano);
rutinas usa `<Card>` solo en estados vacíos.

## Decisiones confirmadas

- **Color card sutil**: fondo `#0e131e`, **sin borde**, conservar `rounded-2xl`.
- **Hero home** ("Hoy toca: [rutina]" + botón Comenzar): fondo = placeholder de
  imagen tipo banner (gris + ícono `Image` de lucide) con velo/scrim oscuro;
  texto y botón encima, sin borde, `rounded-2xl`. Preparado para imagen real.
- **Rutinas day-cards**: estado por tinte de fondo en vez de borde —
  completado `#0e1a14` (verdoso), actual `#15102a` (violeta), normal `#0e131e`.
  Quitar los `shadow-[0_18px_44px_...]` de glow para mantener look plano.
- **Headers**: conservar solo el eyebrow chico (nombre corto), eliminar `<h2>/<h1>`
  título y `<p>` descripción. Páginas sin eyebrow (home, dashboard, rutinas)
  convierten su título a una etiqueta eyebrow.
- **Énfasis**: recuperar espacio subiendo contenido y agrandar componentes clave
  por página.

## Tratamiento de card (patrón base)

Reemplazar en cada card el par borde+fondo por solo fondo sutil:

```
- rounded-2xl border border-[...] bg-[...]
+ rounded-2xl bg-[#0e131e]
```

Conservar `rounded-2xl`, padding y resto de clases. No agregar `border` ni
`shadow` de separación.

## Cambios por archivo

### 1. Home — `app/page.tsx`

- **Hero** (`:117-141`): envolver en bloque `relative overflow-hidden rounded-2xl`
  con un placeholder de imagen de fondo (`div` gris `bg-[#11151f]` + ícono
  `Image` de `lucide-react` centrado tenue) y un scrim
  (`bg-gradient-to-t from-black/60`) bajo el texto. Texto "Hoy toca" + `<Button>`
  encima (`relative z-10`). Sin borde.
- **5 cards de la grilla** (`:144-192`): la clase base repetida
  `flex h-full flex-col gap-2 rounded-2xl border border-[#1a2235] bg-[#0d1322]/70 p-2`
  → `flex h-full flex-col gap-2 rounded-2xl bg-[#0e131e] p-2`. Aparece en:
  `NutricionCard` (`:236`), `CargaMuscularCard` (`:296`), `ComidasHoyCard` (`:322`),
  Constancia inline (`:175`), Calendario nutrición inline (`:185`).
- **Header** (`:112-114`): `<h1>` "Inicio" → eyebrow chico (mismas clases de
  eyebrow Pattern A: `text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]`).
- **Énfasis**: aumentar altura/padding de las cards de la grilla (ej. `p-2`→`p-3`,
  permitir que el anillo/figuras crezcan) usando el espacio recuperado del header.

### 2. Rutinas — `app/dashboard/rutinas/page.tsx` + `WeekDaysList.tsx`

- `page.tsx` cards (`:38`, `:108`, `:129`, `MiniCard :208`, `:175`): quitar
  `border border-[...]` y reemplazar el `bg-[linear-gradient(...)]` por
  `bg-[#0e131e]` (o tinte violeta `#15102a` para la card de rutina activa `:108`
  si se quiere mantener su acento — confirmar visualmente en iteración Playwright).
- `WeekDaysList.tsx` day-cards (`:45-54`): quitar las 3 variantes de `border-[...]`
  y los `shadow-[0_18px_44px_...]`; mapear estado a fondo:
  completado→`bg-[#0e1a14]`, actual→`bg-[#15102a]`, default→`bg-[#0e131e]`.
  `DayMarker` (`:112-120`) se conserva como señal extra de estado.
- **Header**: rama empty-state (`:27-36`) deja solo eyebrow "Rutinas"; rama activa
  ya abre sin título global (ok).
- **Énfasis**: agrandar la card de rutina activa (`:108`) — más padding / tamaño
  de título.

### 3. Registro — `app/nutricion/registro/RegistroClient.tsx` + `app/nutricion/registro/page.tsx`

- Cards (`:290`, `:327`, `:363`, `:396`, `MealCard :611`): quitar
  `border border-[var(--border)]` y reemplazar fondo por `bg-[#0e131e]`
  (incluye `MealCard` que hoy usa `bg-[var(--card-alt)]`). Card "frase
  motivadora" (`:421`) ya no tiene borde — solo dejar fondo sutil si corresponde.
- Sub-elementos internos (filas de comida `:545`, dropdown búsqueda `:787`,
  draft `:206`): **dejarlos como están** salvo que en la iteración Playwright se
  vean con borde duplicado; el pedido es sobre las cards, no los items internos.
- **Header** (`app/nutricion/registro/page.tsx:30-39`): eliminar `<h2>` "Registro
  diario de comidas" (`:32`) y `<p>` descripción (`:35`); conservar eyebrow
  "Nutrición" (`:31`).
- **Énfasis**: agrandar anillo de calorías (card `:290`) y barras de macros
  (card `:327`) con el espacio recuperado.

## Verificación (iterar con Playwright hasta que quede)

1. `npm run dev` (ver `docs/codex/COMMANDS.md`) y login con credenciales de
   `.env.local` (`EMAIL` / `EMAIL_PASSWORD`).
2. Para cada ruta (`/`, `/dashboard/rutinas`, `/nutricion/registro`):
   - `playwright-cli goto <url>` + `screenshot` en mobile (375px) y desktop.
   - Verificar: **0 cards con borde visible**; fondo card apenas más claro que
     la página; header sin título grande ni descripción (solo eyebrow);
     componentes clave más grandes.
3. Rutinas: confirmar que completado (verdoso) y día actual (violeta) se
   distinguen por fondo sin borde.
4. Home: hero muestra placeholder de imagen + scrim con texto/botón legibles.
5. Ajustar tonos (`#0e131e`, tintes) según se vea en pantalla; iterar.
6. `graphify update .` tras los cambios.

## Riesgos

- El tinte `#0e131e` puede verse casi igual al fondo en algunos paneles
  (workspace `#0d1118`); ajustar en iteración Playwright si no se distingue.
- Quitar bordes de rutinas elimina la señal de estado actual/completado: se
  compensa con tinte de fondo + `DayMarker`; validar contraste.
- Items internos del registro mantienen borde — confirmar que no choca
  visualmente con cards sin borde.
