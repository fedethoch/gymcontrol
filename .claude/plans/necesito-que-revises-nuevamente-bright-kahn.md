# Plan — Corrección visual Dashboard principal (PWA) vs referencia

## Context

La pantalla principal (`app/page.tsx`, ruta `/`) ya replica la **estructura** del mockup
`docs/design-references/dashboard-principal-redesign-v1.png` (hero, 3 summary cards, fila
Nutrición+Carga muscular, Comidas de hoy, fila de calendarios). El usuario pide **acercarla más
a la referencia** con dos correcciones puntuales y concretas, sin rediseño libre:

3. **Card "Carga muscular"** — mantener alto actual, pero bajar la barra de gradiente + su texto
   (`Base / Intensidad / Elite`).
4. **Card "Comidas de hoy" (estado vacío)** — mover el divisor un poco a la derecha y hacer el
   botón menos "nacho" (menos alto/grueso), con su texto ocupando un renglón completo.

Las correcciones 1 y 2 se perdieron en el `/clear`; este plan cubre solo 3 y 4 (lo explícitamente
pedido). Todo el cambio vive en un único archivo.

## Diagnóstico (actual vs referencia)

Verificado con Playwright (`auth.json` cargado, viewport 375px). La cuenta admin **no tiene rutina
activa**, así que el hero y "Carga muscular" se renderizan en estado vacío; igualmente el código de
ambos estados es visible y suficiente para planear.

| Bloque | Estado actual | Referencia | Acción |
|---|---|---|---|
| Carga muscular (poblada) | Figura en caja de 120px y luego `flex flex-1 items-center` centra la barra → la barra/leyenda queda a media altura | Barra de gradiente + labels pegada hacia el fondo de la card | Empujar barra+labels abajo manteniendo alto |
| Comidas vacía — divisor | `w-px` divisor entre columna central y sugerencia, centro angosto | Divisor más a la derecha, centro con más aire | Correr divisor a la derecha |
| Comidas vacía — botón CTA | `inline-flex w-fit ... px-3 py-1.5`, botón compacto/alto | Botón fino, ancho, texto en un renglón | Reducir alto y hacer ancho completo (texto 1 línea) |

## Plan de corrección por bloque

### 3. Card "Carga muscular" — bajar barra + texto (`app/page.tsx`, `CargaMuscularCard`, ~L707–730)
- Bloque actual:
  - `<div className="flex flex-1 flex-col gap-0">` contiene la figura (caja `height:120`) y luego
    `<div className="flex flex-1 items-center">` con la leyenda (barra gradiente + `Base/Intensidad/Elite`).
- Cambio: reemplazar `items-center` por `items-end` (o agregar `mt-auto` al bloque de leyenda y
  quitar `flex-1 items-center` del wrapper) para que la barra y su texto queden pegados al fondo de
  la card, **sin** tocar el alto de la card ni el `height:120` de la figura.
- Resultado: misma altura total, figura arriba, barra+labels desplazadas hacia abajo.

### 4. Card "Comidas de hoy" vacía (`app/page.tsx`, `ComidasHoyCard` empty branch, ~L773–814)
- **Divisor a la derecha**: el bloque es
  `Icono(left) | centro flex-1 | <div w-px divisor> | <div w-28 sugerencia>`.
  Para correr la línea a la derecha: reducir el ancho de la columna de sugerencia (de `w-28` a
  `w-24`) y/o dar al divisor un `ml-1`/`ml-2`, de modo que el divisor se desplace a la derecha y el
  centro gane aire. (Aproximación: el divisor es relativo al flex; "moverlo a la derecha" = darle
  más espacio al centro / menos a la sugerencia.)
- **Botón menos "nacho"**: el CTA `Agregar primera comida`
  (`inline-flex w-fit items-center gap-1 ... px-3 py-1.5`):
  - cambiar `w-fit` → `w-full` y `justify-center` para que ocupe todo el ancho de la columna central,
  - bajar el alto: `py-1.5` → `py-1` (botón fino),
  - mantener `whitespace-nowrap` para que el texto quede en un solo renglón.
  - Resultado: barra-botón ancha y fina, texto centrado en una línea.

> Nota de fidelidad: el estado vacío de "Comidas" solo se ve sin comidas registradas; el estado
> poblado (lista de comidas) no cambia.

## Archivos a modificar

- `app/page.tsx` — único archivo. Dos sub-componentes: `CargaMuscularCard` y `ComidasHoyCard`
  (rama empty). Solo clases Tailwind de layout/spacing. **Sin** cambios de lógica, datos, rutas ni
  otras pantallas. **Sin** tocar navbar inferior.

## Riesgos / limitaciones

- **No puedo ver "Carga muscular" poblada** con la cuenta admin actual (sin rutina activa) → para
  QA visual de ese fix hay que activar una rutina o usar una cuenta con rutina. El estado vacío no
  muestra la barra de gradiente, así que la verificación de #3 requiere ese paso.
- "Mover el divisor a la derecha" es relativo dentro de un flex; se logra rebalanceando anchos de
  columnas (aproximación más cercana, sin posicionamiento absoluto que rompería responsive).
- Cambios mínimos y reversibles; bajo riesgo de regresión en otros breakpoints (revisar a 375px y
  ~414px).

## Validación con Playwright

1. App ya corriendo en `http://localhost:3000`; sesión vía `state-load auth.json`.
2. **Antes**: ya capturado `scratchpad/dash-current.png` (375px). Comparar contra
   `docs/design-references/dashboard-principal-redesign-v1.png`.
3. Implementar los 2 cambios en `app/page.tsx`.
4. **Después**: `reload`, screenshot a 375px del bloque Carga muscular y de Comidas vacía; comparar
   contra la referencia.
5. Para #3: activar una rutina (o cuenta con rutina) y screenshot del estado poblado para confirmar
   que la barra quedó abajo manteniendo el alto.
6. **Ronda de ajuste**: si el divisor/botón/barra no calzan con el mockup, iterar spacing
   (`py`, `w-*`, `ml-*`, `items-end/mt-auto`) y re-capturar hasta máxima fidelidad.
7. Chequear 375px y ~414px que no haya overflow ni cambios en navbar.
