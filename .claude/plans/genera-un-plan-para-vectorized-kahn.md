# Plan: arreglos de layout en /admin, /admin/ejercicios, /admin/rutinas y /catalogo

## Context

Cuatro ajustes de UI reportados por el usuario. Todos son problemas de
distribución/espaciado visual (no lógica). Patrón de referencia "bueno" ya
existe en `app/dashboard/rutinas/page.tsx` (`page-frame` + sub-wrappers
`grid gap-1.5`). Objetivo: que las páginas admin se vean compactas y
alineadas, y centrar el ícono de búsqueda del catálogo.

Stack: React + Tailwind + shadcn/ui. Mobile-first. No crear componentes
nuevos; reusar los existentes.

---

## Tarea 1 — `/admin` cards sin espacio sobrante

**Archivo:** `app/admin/page.tsx`

Causa del hueco: cards de cada fila van en `grid` → todas se estiran a la
altura de la más alta. La card más corta deja espacio en blanco abajo porque
el botón con `border-t` queda justo después del contenido, no empujado al
fondo.

Cambios:

1. **"Acciones rápidas" (≈165-184):** las filas/links ("crear ejercicios",
   "crear rutina", "ver catálogo de admin") deben **ocupar el ancho completo**
   de la card (`w-full`), con **texto más grande** (subir `text-sm`→`text-base`
   o más) e **íconos más grandes** (subir tamaño del lucide icon). Card/
   CardContent `flex flex-col h-full` y filas con `flex-1`/más `py` para que en
   conjunto llenen el alto y no quede hueco abajo.
   **"Resumen de gestión" (≈186-214):** mismo criterio — su contenido interno
   (filas `flex items-center justify-between`) a ancho completo, texto e íconos
   más grandes, repartido para llenar el alto de la card.

2. **"Últimas rutinas" (≈272-319) vs card izquierda "Ver todos los
   ejercicios" (≈219-270):** hacer la `Card` `flex flex-col h-full` y poner
   el `<Link>` botón final (`border-t`, líneas ≈312-318 derecha / ≈263-269
   izquierda) con `mt-auto` para empujar la línea divisoria al fondo. Así la
   `border-t` de "Últimas rutinas" queda alineada con la `border-t` del botón
   "Ver todos los ejercicios" de la card izquierda.

Verificación: ambas líneas `border-t` de la fila inferior deben quedar a la
misma `y`; ninguna card debe mostrar franja vacía bajo su contenido.

---

## Tarea 2 — `/admin/ejercicios` compactar + borrar contador

**Archivo:** `app/admin/ejercicios/ExerciseAdminClient.tsx`

1. **Borrar texto "{n} ejercicios"** a la derecha del filtro equipamiento:
   eliminar el `<span>` de líneas **310-312** (4ª col del grid de filtros).
   Tras borrar, revisar que el grid de filtros `sm:grid-cols-[1.4fr_1fr_1fr_auto]`
   (línea ≈269) siga balanceado; quitar la columna `auto` sobrante si queda
   vacía.

2. **Compactar / subir contenido:** replicar patrón de
   `app/dashboard/rutinas/page.tsx`. Opciones (aplicar la mínima que logre el
   efecto):
   - añadir `dashboard-page-frame` al `<section className="page-frame">`
     (línea 240) → `align-content:start` + `grid-auto-rows:max-content`
     pega todo arriba (def en `app/globals.css:105`).
   - agrupar header+stat-tiles y filtros+tabla en sub-wrappers
     `grid gap-1.5` para reducir separación entre título y su bloque.

Verificación: contenido alineado arriba, menos aire entre secciones, sin el
texto contador.

---

## Tarea 3 — `/admin/rutinas` compactar + borrar contador

**Archivo:** `app/admin/rutinas/RoutineAdminClient.tsx`

Estructura idéntica a Tarea 2.

1. **Borrar "{n} rutinas"** a la derecha del filtro objetivo: eliminar
   `<span>` líneas **304-306**. Revisar grid de filtros (línea ≈253).
2. **Compactar / subir:** mismo enfoque que Tarea 2 sobre el
   `<section className="page-frame">` (línea 224).

Verificación: igual que Tarea 2.

---

## Tarea 4 — `/catalogo` centrar lupita en Y

**Archivo:** `app/catalogo/RoutineCatalogClient.tsx` (líneas 109-119)

Estado actual:
```jsx
<label className="relative block">
  <span className="sr-only">Buscar rutinas</span>
  <Search className="... absolute left-3 top-1/2 -translate-y-1/2 size-4 ..." />
  <Input className="h-12 ... pl-9" placeholder="Buscar por nombre o descripcion..." ... />
</label>
```

**Causa real (lo "extra" que bloquea):** el `<label>` es `block`. Un contexto
block genera un *line-box / strut* con la `line-height` propia del label,
sumado a la altura del `<input>` en flujo. El ícono usa
`top-1/2 -translate-y-1/2` → se centra respecto a la altura TOTAL del label
(input + strut), que es mayor que el input → el ícono cae por debajo del
centro del campo. Confirmado contra `public/bugs/bug_lupita.png`: lupita ~4px
bajo el placeholder. `Input` es un único `<input>` (`app/components/ui/Input.tsx`),
`h-11` base + override `h-12` = 48px; no hay wrapper extra.

**Fix:** cambiar el wrapper `relative block` → `relative flex items-center`.
Flex establece un formatting context sin strut/line-box anónimo, el label
queda exactamente del alto del input, y `top-1/2 -translate-y-1/2` centra
correcto. No tocar `h-12` ni el ícono.

**Fallback** si tras testear sigue desalineado: anclar el ícono al input
real envolviéndolo (`relative flex items-center` ya lo logra); como último
recurso, fijar el ícono con valor explícito acorde al centro de 48px.

Verificación (OBLIGATORIA antes de dar por cerrado, el usuario ya tuvo
intentos fallidos): correr la app, abrir `/catalogo`, comparar visualmente la
lupita con el centro vertical del placeholder; idealmente screenshot y
contrastar contra `public/bugs/bug_lupita.png`. Probar en mobile y desktop.

---

## Archivos a modificar
- `app/admin/page.tsx`
- `app/admin/ejercicios/ExerciseAdminClient.tsx`
- `app/admin/rutinas/RoutineAdminClient.tsx`
- `app/catalogo/RoutineCatalogClient.tsx`
- (referencia, no editar) `app/dashboard/rutinas/page.tsx`, `app/globals.css`

## Verificación global
1. `npm run dev`, recorrer las 4 rutas.
2. `/admin`: sin huecos en cards, líneas `border-t` de fila inferior alineadas.
3. `/admin/ejercicios` y `/admin/rutinas`: contenido arriba, compacto, sin
   contador a la derecha de los filtros.
4. `/catalogo`: lupita centrada en Y con el placeholder (mobile + desktop).
5. `npm run lint` / build sin errores.
6. `graphify update .` tras los cambios.

## Riesgos
- "Agrandar contenido" en cards de /admin es ambiguo: el enfoque es
  `flex-1`/`justify-between`/`mt-auto` para llenar alto, sin inventar datos
  nuevos. Si el usuario quería más métricas/filas reales, confirmar.
- Quitar la columna contador puede desbalancear el grid de filtros; ajustar
  `grid-cols` si hace falta.
