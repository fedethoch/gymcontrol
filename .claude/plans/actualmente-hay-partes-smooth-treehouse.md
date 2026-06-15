# Plan — Sidebar fit, nutrición lista, /configuración, registro rediseñado

## Context

Cuatro mejoras de UI sobre la app gymcontrol (Next.js + Tailwind + shadcn-style components):

1. El sidebar desktop recorta items: `<nav>` usa `overflow-hidden` y un card grande de "Sesión activa" + footer `mt-auto` comen altura. Con 10 items (rol admin) el contenido se corta y queda inalcanzable. Objetivo: quitar el card de sesión, achicar piezas internas y que todo entre sin scroll.
2. `/nutricion` muestra alimentos como grilla de cards. Objetivo: lista (más densa, escaneable). Usuario pidió explícito skill **ui-ux-pro-max**.
3. No existe `/configuración`. Pero el backend (tabla `nutrition_profiles` con gender/age/height/weight/activity/goal + cálculo de plan) y un form completo ya viven en `/nutricion/perfil`. Decisión del usuario: **mover** perfil → `/configuración` y enlazarlo desde el sidebar.
4. `/nutricion/registro`: hoy un "alimento" se loguea con un número de comida (`meal_order` 1-6), sin nombre, y se renderiza como lista plana. Objetivo: poder "cargar una comida" que agrupe varios alimentos, con barras de progreso de calorías y de cada macro hacia el objetivo. Decisión del usuario: **agrupar por slot, sin cambios de DB**.

Resultado esperado: sidebar sin recortes, nutrición en lista, ruta de configuración accesible, registro agrupado por comida con barras de objetivo.

## Skills de frontend (obligatorio usar)

- `/nutricion` lista → **ui-ux-pro-max** (pedido explícito).
- Sidebar, `/configuración`, `/nutricion/registro` → **impeccable** (criterio propio; review visual + jerarquía).
- Validación end-to-end → **playwright-cli**.

---

## 1. Sidebar entra sin scroll

Archivo: `app/components/shared/PrimaryNavigation.tsx`

- **Quitar el card "Sesión activa"** (bloque inline líneas ~225-268, ambas variantes collapsed/expanded). Eliminar las vars que quedan huérfanas: `sessionLabel`, `sessionCopy`, `sessionMonogram`, `sessionMeta` (líneas 140-151) y el import de `Badge` si ya no se usa.
- Mantener el botón "Cerrar sesión" del footer (líneas 270-303) — sólo se va el card de arriba.
- **Achicar piezas** para garantizar fit:
  - Logo header: bajar `size-12` → `size-10`, título `text-xl` → `text-lg`, reducir paddings del panel (`py-4`→`py-3`).
  - Espaciados de nav: `space-y-6`→`space-y-4`, items `py-2.5`→`py-2`, icon tile `size-9`→`size-8`.
  - Divisor de grupos y `mt-7`→`mt-5`.
- **Cambiar `<nav>` (línea ~181) `overflow-hidden` → `overflow-y-auto`** como red de seguridad: si en una resolución chica aún no entra, scrollea sólo la región de nav en vez de clipear. Con el card removido + piezas achicadas el caso normal entra completo sin scroll.
- Verificar variante `collapsed` (w-88px) sigue ok tras los cambios de tamaño.

## 2. /nutricion como lista

Archivo: `app/nutricion/NutritionCatalogClient.tsx` (mantener `app/nutricion/page.tsx` igual)

- Invocar skill **ui-ux-pro-max** para el diseño de la fila/lista.
- Reemplazar el contenedor grid (`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ...`) por una lista vertical (`flex flex-col` / `divide-y` o `space-y-2`).
- Convertir `FoodCard` (botón con header gradiente `h-28`) en `FoodRow`: fila compacta con icono de categoría (`CATEGORY_ICONS`/accent de `nutrition-style.ts`), nombre, `{servingG} g · {calories} kcal`, y `MacroBar` inline (sin legend). Mantener el click → `FoodDetailSheet` existente (no tocar el Sheet).
- Conservar buscador + filtro de categoría y animación framer-motion (`staggerContainer`/`fadeUp`) aplicada a filas.
- Mobile-first: en chico, fila apilada legible; en `sm+` fila horizontal.

## 3. /configuración (mover desde /nutricion/perfil)

- **Mover ruta**: crear `app/configuracion/page.tsx` + `app/configuracion/actions.ts` reusando el contenido actual de `app/nutricion/perfil/page.tsx` y `actions.ts`. Mover/renombrar `ProfileClient.tsx` → `app/configuracion/ConfiguracionClient.tsx` (mismo componente; ajustar imports de `saveNutritionProfileAction`).
  - El server action sigue llamando `saveNutritionProfile` de `app/lib/nutrition-profile.ts` (no cambia la lib ni la tabla).
  - Eliminar la carpeta `app/nutricion/perfil/` tras mover.
- **Sidebar link**: en `app/components/shared/navigation-config.ts` reemplazar la entrada que apunte a `/nutricion/perfil` por `/configuración` (label "Configuración", icono `Settings` de lucide), ubicada en el grupo Usuario. Buscar cualquier otro `href="/nutricion/perfil"` (`rg "nutricion/perfil"`) y actualizarlo.
- Contenido del form ya cubre lo pedido (peso, edad, género, actividad, **objetivo**: definición=cut / recomposición=recomposition / ganancia=bulk vía `GOALS`/`GOAL_INFO`). No se agrega data nueva.

## 4. /nutricion/registro rediseñado (agrupar por slot, sin DB)

Archivo principal: `app/nutricion/registro/RegistroClient.tsx` (lib y actions sin cambios de esquema)

- Invocar skill **impeccable** para layout/jerarquía.
- **Agregar comida = agregar alimentos a un slot**: reordenar el form para que la metáfora sea "Comida 1..6" como contenedor y dentro se sumen alimentos (alimento + gramos → Agregar). El `addMealLogItemAction` actual ya inserta por `(foodId, mealOrder, grams)`; se reutiliza tal cual.
- **Render agrupado**: en lugar de la lista plana (líneas 158-186), agrupar `items` por `mealOrder` en secciones "Comida N". Cada sección lista sus alimentos (nombre, gramos, kcal, borrar) y muestra subtotal de la comida. Slots sin items no se muestran (o se muestran como "vacía" mínima).
- **Barras de objetivo**: reemplazar/expandir el card "Total del día" con barras de progreso que se completan hacia el objetivo:
  - Calorías: barra `registrado/targetKcal`.
  - Cada macro (proteína/carbos/grasa): barra `registrado/objetivo` usando `targetMacros` y los colores `MACRO_COLORS` de `nutrition-style.ts`.
  - Reusar `MacroBar` donde aplique; para progreso hacia objetivo usar un componente de barra simple (o `AnimatedProgressRing` ya existente) — preferir barras horizontales con % y valor. Clamp visual al 100%, permitir mostrar exceso.
- Mantener `TrainingCalendarCard` de constancia al final.
- Mobile-first.

---

## Archivos a tocar (resumen)

- `app/components/shared/PrimaryNavigation.tsx` — quitar card sesión, achicar, overflow-y-auto.
- `app/components/shared/navigation-config.ts` — link `/configuración`.
- `app/nutricion/NutritionCatalogClient.tsx` — grid → lista.
- `app/configuracion/page.tsx` + `actions.ts` + `ConfiguracionClient.tsx` — nuevos (movidos desde perfil).
- `app/nutricion/perfil/` — eliminar tras mover.
- `app/nutricion/registro/RegistroClient.tsx` — agrupar por comida + barras de objetivo.

Sin migraciones Supabase. Sin cambios en `nutrition-calc.ts`, `nutrition-profile.ts`, `meal-logs.ts`, `actions.ts` de registro.

## Verificación (playwright-cli + build)

1. `pnpm build` (o `pnpm lint` + `pnpm tsc --noEmit`) sin errores de imports huérfanos tras mover perfil.
2. Skill **playwright-cli**, levantar dev server y validar:
   - Sidebar (rol admin y user): todos los items visibles sin recorte; card "Sesión activa" ausente; en viewport bajo, nav scrollea sin clipear; collapsed ok. Screenshot.
   - `/nutricion`: render en lista, buscador + filtro funcionan, click abre el Sheet de detalle. Screenshot.
   - `/configuración`: carga, edita peso/edad/género/actividad/objetivo, "Calcular mi plan" guarda y muestra plan. Verificar que el link viejo `/nutricion/perfil` ya no existe en el sidebar. Screenshot.
   - `/nutricion/registro`: agregar 2 alimentos a "Comida 1" y 1 a "Comida 2" → se agrupan por comida con subtotal; barras de kcal y de cada macro avanzan hacia el objetivo; borrar un alimento actualiza barras. Screenshot.
3. Revisar diffs con foco en no romper la variante mobile (Sheet) del sidebar.

## Riesgos

- Mover `/nutricion/perfil` puede dejar imports/redirects colgando — barrer con `rg "nutricion/perfil"` antes de borrar.
- Achicar el sidebar podría afectar la variante `collapsed`; validar ambos estados.
- Agrupar por `mealOrder` en el cliente: cuidar orden estable y el caso de 0 items.
