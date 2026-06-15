# Plan: ajustes UI (home, catalogo, rutina detalle, dashboard)

## Context
Cuatro retoques visuales pedidos por el usuario en distintas rutas. Ninguno toca
lógica de datos: solo clases Tailwind y un fix estructural de layout en el
dashboard. Mobile-first, shadcn/ui + lucide ya en uso.

---

## 1. Home `/` — 3 cards con alturas distintas
**Archivo:** `app/page.tsx`

Causa: el contenedor grid (`grid auto-rows-max gap-4 lg:grid-cols-3`, ~L169)
no estira las cards; cada `<Card>` solo tiene `min-h-[17rem]` (piso, no altura
fija) y los `MotionDiv` envoltorio no llevan `h-full`, así que cada Card crece
según su contenido (`mt-12` vs `mt-16`, `line-clamp-2`, ring de progreso).

**Cambios:**
- Los 3 wrappers `<MotionDiv variants={fadeUp}>` (~L171, L177, L185): agregar `h-full`.
- Las 3 `<Card>` (WeeklyProgressCard ~L211, WeeklyStreakCard ~L253, ActiveRoutineCard ~L290): agregar `h-full`.
- Mantener `min-h-[17rem]` como piso. La fila grid ya iguala al más alto; con
  `h-full` las 3 Cards llenan la fila → misma altura.

---

## 2. /catalogo — lupa de la searchbar no centrada en Y
**Archivo:** `app/catalogo/RoutineCatalogClient.tsx` (~L111)

El icono usa `top-1/2 -translate-y-1/2` relativo al `<label>`. Reemplazar por
centrado a prueba de balas:
- `top-1/2 -translate-y-1/2` → `inset-y-0 my-auto`
- Resultado: `pointer-events-none absolute left-3 inset-y-0 my-auto size-4 text-[#7d8697]`

---

## 3. /catalogo/rutinas/[id] — hover + columnas
**Archivo:** `app/catalogo/rutinas/[id]/RoutineDetailClient.tsx`

**3a. Nombre pegado al borde izq. del resaltado violeta (hover).**
La celda y el header "Ejercicio" usan `px-0`, el nombre queda flush contra el
borde izquierdo del `hover:bg-[rgba(124,58,237,0.08)]` (que ocupa toda la fila).
- `TableHead` "Ejercicio" (~L49): `px-0` → `pl-3 pr-0`
- `TableCell` del nombre (~L69): `px-0` → `pl-3 pr-0`
  (header y celda iguales = siguen alineados entre sí; +12px de aire respecto al violeta)

**3b. Centrar columnas Series / Reps / RIR / Descanso (header y filas mismo centro).**
Hoy todo hereda `text-left align-middle` de `Table.tsx`. Agregar `text-center`:
- `TableHead` Series, Reps, RIR (~L51-L53) y Descanso (~L54): agregar `text-center`.
- `TableCell` de `item.series`, `item.repetitions`, `item.rir`, `item.rest` (~L86-L89): agregar `text-center`.
- Header y celda de cada columna comparten el mismo `pr-0`/sin override → mismo centro.
- Columna "Ejercicio" queda left (sin cambios de alineación).

---

## 4. /dashboard/rutinas — espacios gigantes entre componentes
**Archivo:** `app/dashboard/rutinas/page.tsx`

**Causa raíz (confirmada):** la `<section>` (L101) usa solo `page-frame`.
`.page-frame` en `app/globals.css` es `display:grid; gap:1.25rem; min-height:100%`.
Con `min-height:100%` y `align-content` por defecto (stretch), las filas del grid
se **estiran para llenar el viewport** → los gaps reales (ya chicos: `gap-1.5`
≈6px) se ven enormes sin importar su valor.

El dashboard principal (`app/dashboard/page.tsx:91`) ya combina
`page-frame dashboard-page-frame`. `.dashboard-page-frame` = `align-content:start;
grid-auto-rows:max-content` → desactiva el stretch. Esta ruta lo omitió.

**Cambio principal:**
- L101: `className="page-frame ..."` → `className="page-frame dashboard-page-frame ..."`

Con eso las filas colapsan a su contenido y los `gap-1.5`/`page-frame gap`
existentes toman efecto real (card pegada al subtítulo, "Tu semana" cerca de la
card, días juntos).

**Ajuste fino opcional (verificar tras el fix, recién ahí decidir):**
- Si "Tu semana → días" o entre días queda muy junto/separado, tunear:
  - `app/dashboard/rutinas/WeekDaysList.tsx` L32 `grid gap-2` (entre días).
  - `page.tsx` L102 / L197 `grid gap-1.5` (header→card / Tu semana→días).

---

## Verificación
1. `npm run dev` → abrir cada ruta:
   - `/` → las 3 cards misma altura en desktop (≥lg) y stack en mobile.
   - `/catalogo` → lupa centrada vertical dentro del input.
   - `/catalogo/rutinas/[id]` → hover: nombre con aire respecto al violeta;
     Series/Reps/RIR/Descanso centrados, header alineado con sus celdas.
   - `/dashboard/rutinas` → sin huecos gigantes; card cerca del subtítulo,
     "Tu semana" cerca de la card, días juntos. Comparar contra `/dashboard`.
2. `graphify update .` tras editar.

## Riesgos
- Bajo. Solo clases Tailwind salvo el `dashboard-page-frame` (reusa helper existente).
- Centrado de la lupa y aire del hover: confirmar visualmente (pixel-level).
