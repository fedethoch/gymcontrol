# Plan: Fixes de front en /configuracion, /nutricion/registro y /admin/alimentos

## Context

Tres problemas de UI a resolver, todos visuales/layout (no tocan lógica ni datos):

1. **/configuracion** — la card "Mantenimiento estimado" dentro de "Tu plan estimado" tiene demasiado espacio vacío vertical en el medio. La idea/datos están bien, solo se ve mal.
2. **/nutricion/registro** — la pantalla está rota en términos de front: desordenada, las cosas no entran/overflowean. La idea funcional está bien; hay que ordenar el layout para que sea mobile-first y no desborde.
3. **/admin/alimentos** — el searchbar cambia (se agranda un poco) cuando llegás a una página incompleta de la paginación. Hay que mantener el tamaño del searchbar fijo, independiente del contenido de la tabla.

Objetivo: dejar las tres vistas prolijas y estables, validando visualmente con Playwright e iterando hasta que quede bien. Usar skills de front (ui-ux-pro-max / impeccable / frontend-design / shadcn-ui) para garantizar el mejor resultado.

## Diagnóstico técnico (ya investigado)

### 1. Configuracion — `app/configuracion/ConfiguracionClient.tsx:263-289`
La fila `Tu plan estimado` es `flex ... sm:flex-row` con `items-center`. El lado izquierdo es un `AnimatedProgressRing size={176}` (176px alto). El lado derecho (`:276`) es `grid w-full grid-cols-1 gap-3 sm:flex-1` con solo 2 ítems cortos (pill de mantenimiento + párrafo). Al centrarse contra el ring de 176px, queda mucho aire arriba/abajo del contenido → "espacio vacío en el medio".

### 2. Nutricion registro — `app/nutricion/registro/RegistroClient.tsx`
Problemas principales de layout (componentes primitivos están OK, el quiebre está en los grids/anchos fijos):
- `FoodPickerRow` (`:699`): salto abrupto de 1 col (mobile) a 4 cols fijas en `sm` (`sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]`). Adentro de la columna angosta (1.2fr del split en `:180`) se aprieta y desborda. Cuando `canChooseUnit` es false queda un `<div/>` vacío (`:761`) ocupando columna.
- `MealCard` fila de edición (`:554-578`): anchos fijos `w-28` + `w-20` + icon button junto a un `flex-1`, dentro de grid `lg:grid-cols-3` (`:350`) → overflow horizontal en cards angostas, sin wrap ni shrink responsive.
- Header de `MealCard` (`:485-525`): input `max-w-[12rem]` + kcal + 4 icon buttons en `gap-1.5` → apretado/desborde en cards angostas.
- Tabla de draft items (`:210`,`:228`): `grid-cols-[1fr_auto_auto_auto]` sin min-width guard; aceptable pero a revisar alineación de labels.

### 3. Admin alimentos — `app/admin/alimentos/FoodAdminClient.tsx` + `app/components/ui/Table.tsx`
Searchbar (`:166`), Card de tabla (`:203`) y paginación son hermanos dentro de `.page-frame` (`globals.css:97`, columna `minmax(0,1fr)`). La `<table>` usa `table-layout:auto` (`Table.tsx:8`) con celdas `whitespace-nowrap` (porción/calorías). En página llena el contenido más ancho fija el min-content de la tabla; en la última página (menos filas) ese ancho baja y la columna del grid reflowea, arrastrando el ancho del searchbar. Root cause = ancho de la tabla content-driven propagándose por la columna compartida.

## Approach

> Mantener cambios quirúrgicos (regla CLAUDE.md): tocar solo lo necesario, respetar estilo existente (Tailwind + tokens `var(--...)`, mobile-first, lucide-react, shadcn/ui). Sin estilos inline salvo justificado.

### Fix 1 — Configuracion: compactar card de mantenimiento
Archivo: `app/configuracion/ConfiguracionClient.tsx` (`:263-289`).
- Hacer que la columna derecha llene la altura del ring sin aire muerto. Opciones (elegir tras ver visual):
  - Convertir la columna derecha en `flex flex-col justify-center` con `gap` controlado, y/o
  - `self-stretch` + distribuir, o
  - Reducir `size` del ring (p.ej. 176→144) para equilibrar alturas.
- Mantener la pill (`Mantenimiento estimado` + valor) y el párrafo; objetivo: que el bloque derecho se vea balanceado verticalmente respecto al ring, sin hueco.
- Usar **ui-ux-pro-max** o **impeccable** para validar jerarquía/espaciado de la card.

### Fix 2 — Nutricion registro: ordenar layout (mobile-first)
Archivo: `app/nutricion/registro/RegistroClient.tsx`.
- `FoodPickerRow` (`:699`): introducir un breakpoint intermedio y/o reestructurar — mantener apilado más tiempo y pasar a multi-columna recién cuando hay ancho real (p.ej. `sm` apilar campos en 2 cols, `md/lg` la fila completa), o usar `flex-wrap` con anchos mínimos. Eliminar el `<div/>` vacío cuando `canChooseUnit` es false (no reservar columna).
- `MealCard` controles de edición (`:554-578`): reemplazar anchos fijos `w-28`/`w-20` por anchos fluidos (`w-full min-w-0` dentro de un contenedor con `flex-wrap` o grid), permitir wrap en cards angostas.
- Header de `MealCard` (`:485-525`): permitir que el bloque de acciones wrappee o reducir presión (revisar `max-w-[12rem]` y agrupación de botones).
- Verificar que el split de dos columnas (`:180`) y el grid de comidas (`:350`) no fuercen overflow en los hijos (asegurar `min-w-0` donde haga falta).
- Apoyarse en **impeccable** / **frontend-design** para el rediseño del orden visual y en **shadcn-ui** para patrones de componentes si conviene.

### Fix 3 — Admin alimentos: searchbar de ancho estable
Archivos: `app/admin/alimentos/FoodAdminClient.tsx` y/o `app/components/ui/Table.tsx`.
- Estabilizar el ancho de la tabla para que no propague reflow. Preferir fix **scoped a alimentos** para no afectar otras tablas:
  - Aplicar `table-layout:fixed` + `w-full` solo a la tabla de alimentos (vía `className` en el uso en `FoodAdminClient.tsx`, no global en `Table.tsx`), definiendo anchos de columna por `TableHead`, **o**
  - Garantizar `min-w-0`/`w-full` en el contenedor para que la columna `minmax(0,1fr)` no crezca al max-content de la tabla.
- Verificar comportamiento entre página llena y última página incompleta: el searchbar (`:166-201`) no debe cambiar de tamaño.
- Si `Table.tsx` se toca, confirmar que no rompe otras vistas que usan `Table` (admin ejercicios, rutinas, etc.) — preferir no tocarlo y resolver en la página.

## Archivos a modificar
- `app/configuracion/ConfiguracionClient.tsx` (card mantenimiento)
- `app/nutricion/registro/RegistroClient.tsx` (FoodPickerRow, MealCard, grids)
- `app/admin/alimentos/FoodAdminClient.tsx` (tabla/searchbar) — y solo si imprescindible `app/components/ui/Table.tsx`

## Verificación (Playwright, iterar hasta que quede bien)
Usar la skill **playwright-cli**. Login con credenciales admin de `.env.local` (`EMAIL` / `EMAIL_PASSWORD`).
1. **/configuracion** → screenshot de "Tu plan estimado"; confirmar que la card de mantenimiento no tiene hueco vertical; comparar mobile (≤640px) y desktop.
2. **/nutricion/registro** → screenshots en mobile (375px), tablet (768px) y desktop (1280px); confirmar que `FoodPickerRow`, draft items y `MealCard` no desbordan y se ven ordenados; probar agregar un alimento y abrir edición de una comida.
3. **/admin/alimentos** → cargar página llena, capturar ancho del searchbar; navegar a última página incompleta, recapturar; confirmar que el ancho del searchbar no cambia.
4. Iterar ajustes Tailwind y re-screenshot hasta que las tres queden prolijas.
5. Tras código OK: `graphify update .` para mantener el grafo (regla del repo).

## Riesgos
- Tocar `Table.tsx` global afectaría admin ejercicios/rutinas → preferir fix scoped en `FoodAdminClient`.
- `table-layout:fixed` requiere definir anchos de columna o se reparten parejo (puede cambiar la estética de la tabla) → validar visualmente.
- Rediseño de `FoodPickerRow`/`MealCard` toca varias zonas del mismo archivo → mantener cambios acotados y verificar funcionalidad (agregar/editar/guardar comida) sigue intacta.
