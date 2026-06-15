# Plan: rediseño nutrición + ajustes UI

## Context

Seis ajustes de frontend sobre el módulo de nutrición/config/admin. El grande es un **rediseño completo** de `/nutricion/registro` tomando `desing-refs/nutricionregistro.html` como referencia visual y estructural. Los otros cinco son cambios acotados de layout/estética. `Recipe` y `Food` ya tienen campo `imageUrl` en el type (`app/lib/nutrition-types.ts:50`), así que mostrar imagen en cards **no requiere cambios de DB ni de storage**.

Skills obligatorias (por instrucción del usuario):
- Front: `impeccable` y/o `frontend-design` para dirección visual del rediseño de registro y cards.
- Validación: `playwright-cli` para verificar cada cambio en navegador.

---

## 1. Rediseño completo `/nutricion/registro` (port fiel del ref)

**Archivo:** `app/nutricion/registro/RegistroClient.tsx` (reescritura del JSX/estructura, conservando toda la lógica de server actions y estado existente).

Referencia: `desing-refs/nutricionregistro.html`. Reproducir lo más fiel posible con los tokens/componentes del proyecto (Tailwind + vars `--card`, `--accent`, etc., no estilos inline del ref).

Estructura objetivo:
1. **Header**: título "Registro diario de comidas" + subtítulo + navegador de fecha (‹ fecha ›). Nota: hoy la fecha la fija el server (`page.tsx` pasa `logDate`); el nav de fecha del ref implica navegar entre días. Implementar como links/router a `?date=` (verificar cómo `page.tsx` resuelve `logDate` antes de cablear; si no soporta query, dejar el control visual navegando por ruta).
2. **Grid 2 columnas** (`minmax(0,1.2fr) minmax(300px,1fr)`):
   - **Izquierda — "Nueva comida"**: ícono + título, input nombre, y el bloque de agregar alimento.
   - **Derecha — "Resumen nutricional del día"**: donut (reusar `AnimatedProgressRing` de `app/components/ui/ProgressRing.tsx` en vez del SVG del ref) + filas de progreso por macro (reusar `TargetBar` ya existente, restilizado) + fila de stats (días registrados / promedio / racha).
3. **"Comidas de hoy"**: grid de `MealCard` (auto-fill minmax 220px) con header colapsable (chevron), lista de alimentos, chips P/C/G y acciones editar/borrar — manteniendo `MealCard` actual pero re-maquetado al estilo del ref.
4. **"Constancia nutricional"**: mantener `TrainingCalendarCard` (ya cumple el rol del heatmap del ref) restilizada acorde.

### 1.b "Agregar escondido" (scrolldown)
El buscador de alimento debe estar **oculto** y desplegarse. Dos piezas:
- Reemplazar el `<Select>` de `FoodPickerRow` (`RegistroClient.tsx:581`) por un **input de búsqueda con dropdown de resultados** (como el ref: `searchQ` + lista filtrada `filtered.slice(0,6)`, cierre por click-fuera con `useRef`+listener). El dropdown es el "scrolldown escondido": aparece solo al escribir/enfocar.
- Mantener la lógica de medida (g/unidades) y cantidad ya existente (`gramsPerUnit`, `canChooseUnit`, conversión en `handleAdd`).
- Conservar la "tabla de alimentos agregados" (draftItems) — el ref la muestra como tabla; re-maquetar el bloque `draftItems.map` (`:179-211`) a formato tabla.

**Lógica que NO cambia:** `handleSaveMeal`, `handleAddDraftItem`, `handleAddItem`, `handleDeleteItem`, `handleUpdateItem`, `handleRenameMeal`, server actions de `actions.ts`, tipos `MealGroup`/`DraftItem`, `previewItem`, `roundQuantity`.

---

## 2. Cards "Cerrar sesión" y "Borrar tu cuenta" más chicas/sutiles

**Archivo:** `app/configuracion/ConfiguracionClient.tsx` (~L313-345).

- Card "Sesión" (L313-325) y "Zona de peligro" (L327-345): reducir presencia. Opciones a aplicar: quitar el `Card` completo y dejar acciones como fila compacta de texto+botón, o reducir padding/tamaño de título y usar botones `size="sm"` con menos énfasis (texto más tenue `--foreground-muted`, borde sutil). Mantener el botón de borrar con color de peligro pero más discreto.
- Mantener intacto el `Dialog` de confirmación de borrado (L347-388) y el `<form action="/auth/signout">`.

---

## 3. /recetas card con imagen, sin ícono de macro

**Archivo:** `app/recetas/RecipeCatalogClient.tsx`, componente `RecipeCard` (L115-157).

- Agregar zona de imagen arriba de la card usando `recipe.imageUrl` (`<img>` con `object-cover`, aspect ratio fijo, `rounded` superior).
- **Fallback (sin imageUrl):** placeholder neutro — fondo sutil (`bg-[var(--card)]`/gris) + ícono genérico de imagen de `lucide-react` (`ImageIcon`). NO usar el gradiente de categoría.
- **Eliminar** el span del ícono de macro (L124-131) y la línea `const Icon = CATEGORY_ICONS[recipe.category]` (L116) que queda huérfana. El badge de porciones (L132-134) puede reubicarse sobre la imagen o quedar en el cuerpo.
- Mantener nombre, descripción, kcal y `MacroBar`. **No tocar** `RecipeDetailSheet` (sigue usando su Icon).

Nota: confirmar que `imageUrl` puede venir vacío desde `app/lib/recipes.ts` para cubrir el fallback.

---

## 4. /configuracion: "Mantenimiento estimado" más a la derecha

**Archivo:** `app/configuracion/ConfiguracionClient.tsx` (L263-278).

- Cambiar el contenedor flex (L263) de `sm:justify-center` a `sm:justify-between`, o agregar `sm:ml-auto` al `<p>` (L274), para empujar el bloque "Mantenimiento estimado / {maintenanceKcal} kcal" hacia la derecha respecto del donut.

---

## 5. /admin/alimentos: searchbar tamaño fijo

**Archivo raíz del bug:** `app/globals.css`, regla `.page-frame` (L97-103) es `display:grid` sin `grid-template-columns`, así que el track se dimensiona al `max-content` de la tabla; en páginas incompletas la tabla es más angosta y el searchbar encoge/crece.

- **Fix preferido (1 línea):** agregar `grid-template-columns: minmax(0, 1fr);` a `.page-frame`. Estabiliza todos los hijos (searchbar incluido) al ancho del contenedor en todas las páginas.
- **Riesgo:** `.page-frame` es compartida por varias páginas → validar que no rompa otros layouts (dashboard, etc.). Si hay regresión, alternativa acotada: envolver la `<Table>` de `FoodAdminClient.tsx` (L203/L219) en `overflow-x-auto` + `min-w-0`/`table-layout:fixed` para que la tabla no empuje el track. Decidir tras probar con Playwright en varias rutas que usan `.page-frame`.

---

## Archivos a modificar

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `app/nutricion/registro/RegistroClient.tsx` | Rediseño completo (JSX), buscador-dropdown, tabla draft |
| 1 | `app/nutricion/registro/page.tsx` | Solo si se cablea nav de fecha por query param |
| 2,4 | `app/configuracion/ConfiguracionClient.tsx` | Cards sesión/peligro compactas + mantenimiento a la derecha |
| 3 | `app/recetas/RecipeCatalogClient.tsx` | Card con imagen + placeholder, quitar ícono macro |
| 5 | `app/globals.css` (o `FoodAdminClient.tsx`) | Fijar ancho searchbar |

Componentes reutilizados (no recrear): `AnimatedProgressRing`, `TargetBar`, `MealCard`, `TrainingCalendarCard`, `MacroBar`, `Card/Button/Input/Select`, `CATEGORY_GRADIENTS/ICONS` (este último ya no en card de receta).

---

## Verificación (Playwright + skills front)

1. Usar skill `impeccable`/`frontend-design` para la dirección visual del rediseño de registro y de la card de recetas antes/durante la implementación.
2. `pnpm dev` y validar con `playwright-cli`:
   - `/nutricion/registro`: agregar alimento vía buscador-dropdown (escondido hasta escribir), guardar comida, verificar donut/barras/stats y comidas de hoy. Comparar visualmente contra el ref.
   - `/recetas`: card con imagen real y card sin imagen (placeholder neutro), sin ícono de macro. Abrir detalle (Sheet intacto).
   - `/configuracion`: cards de sesión/borrado más chicas/sutiles; "Mantenimiento estimado" alineado a la derecha; flujo de borrado (Dialog) sigue ok.
   - `/admin/alimentos`: navegar a una página incompleta (última) y confirmar que el searchbar NO cambia de ancho. Verificar también dashboard u otra ruta con `.page-frame` si se tocó globals.css.
3. `pnpm lint` / `pnpm build` para descartar imports huérfanos (ej. `CATEGORY_ICONS`, `Icon` en RecipeCard) y errores de tipo.
4. `graphify update .` al terminar.

## Riesgos

- **Rediseño registro**: archivo grande; riesgo de romper lógica de server actions. Mitigar: conservar handlers/estado intactos, cambiar solo presentación + buscador.
- **Nav de fecha**: puede requerir tocar `page.tsx`; si es costoso, dejar control visual sin navegación o por ruta (confirmar resolución de `logDate`).
- **`.page-frame` global**: cambio transversal; validar otras páginas o usar el fix acotado en la tabla.
- **`imageUrl` vacío** en recetas: asegurar fallback para no romper layout.
