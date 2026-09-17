# Plan · Rediseño mobile de `/alimentos` + retiro total de imágenes de alimentos

## Contexto

`/alimentos` a 390 px se lee plana:
- Filas de 145 px: entran 3,5 alimentos de 506.
- Todo pesa igual.
- El único emerald es "Crear".
- Quedan restos del violeta.
- El detalle es un sheet lateral con 5 cajas.

Las fotos de alimentos, además, pesan: son 203 archivos (56 MB, 282 kB promedio) y `image_url` viaja con los 506 alimentos.

El usuario pidió un rediseño completo tipo app nativa, con el mock ya aprobado (https://claude.ai/artifact/CVsfSwXJ3WBA9wmViRL2TN v2), y sacar las imágenes de alimentos por completo.

**Decisiones cerradas (16 sep)**
- **AL-D1 · A Buscador:** título grande, buscador sticky, chips, Frecuentes y filas densas agrupadas.
- **AL-D2 · Anillo de macros** al inicio de cada fila.
- **AL-D3 · "Registrar" en el detalle**, con la porción precargada. El tipo de comida sigue en Desayuno por defecto.
- **AL-D4 · Orden** Relevancia / Más proteína / Menos calorías, en el botón ⇅.
- **AL-D5 · Sin `MobileHeader`** en `/alimentos`.
- **AL-D6 · Borrar todo:** UI, código, scripts de media, PNGs versionados, columna `foods.image_url`, los 203 objetos y el bucket `food-images`. **Sin backup**, por elección del usuario.
- **AL-D7 · Desktop** igual que hoy, salvo foto y violeta.
- **Deploy autorizado:** commit, push a master, deploy y smoke en producción. Recién después, el borrado.

**Restricciones verificadas**
- **Otra sesión trabaja en el mismo working tree.** Tiene cambios *staged* (renames `StartDock→DayAction`, `WorkoutDock→WorkoutAction`) y sin commitear (`DESIGN.md`, `REDESIGN_DIRECTION.md`, `DayPanel`, `RoutineWeekView`, `WorkoutMobile`, `WorkoutTopBar`, `graphify-out/`).
  - Nuestros commits llevan solo nuestros archivos y hunks, y master tiene que compilar sin ese WIP.
  - Nunca stash, nunca `pnpm build` en el tree principal, nunca commitear `graphify-out/`.
  - Hoy HEAD = origin/master = `61762a9`. No hay git hooks.
- **`foods.image_url` es `NOT NULL` sin default**, y el código en producción la lee y escribe `""`.
  - Orden obligatorio: **expand** (`default ''`) → deploy del código sin la columna → **contract** (drop).
  - Ninguna vista ni función depende de esa columna: `save_recipe` usa `recipes.image_url`.
- **Supabase bloquea `delete` por SQL** en `storage.objects` y `storage.buckets` (trigger `storage.protect_delete`). Los objetos y el bucket se borran por la **Storage API** con service role.
- **El dev local escribe en la única base, que es producción.** Hay que limpiar los datos de prueba. La cuenta admin no tiene comidas recientes: Frecuentes se prueba con comidas creadas por el propio flujo "Registrar", que después se borran.

## Diseño mobile (<1024)

**Árbol:** copia local del helper `Responsive` de `app/rutinas/page.tsx:39-54`. Esa ruta es de la otra sesión, así que no se extrae.
- Mobile: `div.h-full.lg:hidden > section.page-frame.alimentos-frame.relative.isolate.auto-rows-max.content-start.bg-[var(--background)] > div.flex.flex-col > .home-safe-top + <FoodsMobile/>`.
- Desktop: `div.hidden.lg:contents > section` con el `NutritionCatalogClient` actual.
- El mismo array `foods` va a los dos árboles, sin `.map` ni spread, para que React Flight lo deduplique.

**Zonas**
1. **Encabezado:** `h1` "Alimentos" (2rem Sora 700), meta mono `506 alimentos · 1 tuyo`, y "+" `size-11` redondo neutro (solo con sesión).
2. **Buscador sticky:** `h-16`, `sticky top-[env(safe-area-inset-top)] z-10`, fondo sólido.
   - Input de 48 px, `text-base md:text-base`, label oculto, sin el ✕ nativo de WebKit.
   - ✕ propio `size-11`.
   - `SortMenu`: trigger de 48 px con `aria-label="Ordenar: …"`, punto emerald si el orden no es Relevancia, y radio items de `min-h-11`.
   - Conteo en `aria-live`.
3. **Chips:** radio nativos en `fieldset`, en una fila horizontal (`-mx-4 px-4 scroll-px-4`, sin scrollbar).
   - "Todos", "Tuyos" (con sesión) y las 6 categorías en singular con su conteo total.
   - Marcador `layoutId`, como en `DayTabs.tsx:56-62`.
4. **Frecuentes:** solo con sesión, con historial y en el estado por defecto (sin búsqueda, "Todos", "Relevancia").
   - Encabezado con `HomeSectionHeader`.
   - Tiles de 136 px: nombre, kcal de la última porción y `150 g · 12 veces`.
   - Al tocar, abre el detalle con esa medida preseleccionada.
5. **Lista:**
   - Agrupada por categoría (`section` + `h2` sticky en `top-[calc(env(safe-area-inset-top)+4rem)] z-[5]`, con nombre y total) solo sin búsqueda, en "Todos" y "Relevancia".
   - En los demás casos, plana con "N resultados".
   - Fila `button` de 64 px:
     - `MacroRing` de 32 px, `aria-hidden`.
     - Nombre, pill "Tuyo" y `100 g · 1 u ≈ 50 g`.
     - kcal (Sora 17) y `P 31 · C 0 · G 3` en mono 11: la línea visible es `aria-hidden` y va acompañada de texto oculto.
     - Con "Más proteína", la P va resaltada.
   - Feedback `active:bg-[var(--card-alt)]` y `scroll-mt-[calc(env(safe-area-inset-top)+6.5rem)]`.
   - "Mostrar más" de a 60. Al cambiar chip u orden, se vuelve al tope de la lista.
6. **Vacíos (`FoodsEmpty`, `.motion-empty-state`):**
   - Sin resultados: `No encontramos «q»`, emerald "Crear «q»" (con sesión) y ghost "Limpiar búsqueda".
   - Tuyos vacío: paso "Cargá tu primer alimento" y emerald "Crear alimento".
7. **Detalle (`FoodDetailDrawer`, vaul con `autoFocus`):**
   - Arriba: chip de categoría (+ "Tuyo"), ✕ de 44 px, `DrawerTitle` y `DrawerDescription`.
   - Porción: radiogroup nativo con la base `servingG` o `1 unidad · X g`.
   - kcal en Metric L con `AnimatedNumber`, más el valor en texto oculto.
   - Barra apilada estática con la proporción de kcal, 3 columnas (gramos de la porción y `% kcal`) y una nota.
   - **Registrar:** con sesión, CTA emerald `Button asChild` + `Link prefetch={false}` a `registroFoodHref(...)`.
   - **Alimento propio:** "Editar" cambia el cuerpo al `FoodForm` (sin drawers apilados) y vuelve al detalle actualizado. "Eliminar" abre la confirmación inline (reusa el markup de `NutritionCatalogClient.tsx:394-433` y `deleteOwnFoodAction`).
   - **Comportamiento:** mantiene el último alimento visible mientras se cierra (patrón `displayFood`). La porción se resetea por `key={food.id}`. `onCloseAutoFocus` devuelve el foco a la fila o tile, o al buscador si se borró.
8. **Crear (`FoodCreateDrawer`):** usa `FoodForm` con `initialName`. Al guardar se limpia la búsqueda y se abre el detalle del alimento nuevo.

**Regla del emerald:** la lista no tiene ninguno. El emerald vive solo en los vacíos o dentro de un drawer.

## Fases

### F0 · Fuente de verdad (docs primero)
- **`DESIGN.md`:**
  - §6.1: sumar `/alimentos` a la excepción del header.
  - **§13 nuevo "Alimentos mobile":** mock, decisiones AL-D1…D7, 13.1 Zonas, 13.2 Estados (explorar, buscar, orden ≠ relevancia, sin resultados, Tuyos vacío, invitado, sin historial), 13.3 Detalle y form. Reglas: un emerald, sin imágenes, nada fijo abajo, lógica en `app/lib/food-catalog.ts`, reduced-motion.
- **`docs/REDESIGN_DIRECTION.md` §7:**
  - Progreso 4/15 y fila 7 en ✅ con link a §13.
  - Checklist 7 marcado: chips + menú de orden reemplazan a `FilterPanel` en mobile; detalle; confirmación inline; nuevo/editar; Frecuentes; Registrar.
  - Actualizar la nota de `FilterPanel`.
- **`docs/codex/`:**
  - `FILE_OWNERSHIP.md`: fila nueva.
  - `ROUTING_GRAPH.md`: fila Nutrición con `?alimento=&medida=&cantidad=`, `components/alimentos/` y `food-catalog.ts`.
  - `TEST_MATRIX.md`: fila nueva.
- **Cómo:** las ediciones de los dos docs compartidos van en un script anclado e idempotente, `$SCR/doc-edits.mjs`, que exige exactamente una coincidencia. Se corre ahora sobre el working tree y se reusa al commitear sobre `git show BASE:<file>`.

### F1 · Lib pura + tests
**`app/lib/food-catalog.ts` (nuevo).** Solo importa libs puras (`@/app/lib/nutrition-types`, `@/app/lib/food-search`). Exporta:
- **Tipos:** `FoodChip`, `FoodSort`, `CatalogQuery`, `ChipCounts`, `FoodGroup`, `MacroGrams`, `MacroKcalSplit`, `FoodPortion`, `PortionNutrition`, `FrequentFoodTile`, `RegistroFoodParams`.
- **Constantes:** `CATALOG_PAGE_SIZE = 60`, `MAX_LOG_QUANTITY = 10_000` (igual que `quantitySchema`) y `FOOD_SORT_LABELS`.
- **Movidos desde `FoodPicker`:** `getFoodGramsPerUnit` y `formatQuantity`. `FoodPicker` los re-exporta y los imports de `RegistroClient` no cambian.
- **Porciones y nutrición:**
  - `portionGrams(food, measure, qty)`
  - `nutritionForGrams(food, grams)`: kcal con `Math.round` (igual que `previewNutrition`) y macros con 1 decimal.
  - `foodPortions(food)` y `defaultFoodPortion(food, preferred?)`, con etiquetas `100 g`, `1 unidad · 50 g` y `Registrar …` (ml en bebidas).
  - `splitMacroKcal(macros)`: P×4, C×4, G×9; porcentajes enteros que suman 100 por mayor resto, o todos 0.
  - `formatServingLine(food)` y `per100(food, v)`.
- **Catálogo:**
  - `countFoodsByChip`, `chipOptions(counts, signedIn)`, `formatCatalogMeta(counts, signedIn)` y `filterFoodsByChip`.
  - `sortFoods(foods, sort)`: estable, normalizado cada 100 g, con guard para `servingG` 0.
  - `searchCatalog(foods, {query, chip, sort})`: primero el chip, después `searchByName` (propios +10) y por último el orden. Sin query conserva el orden del server; nunca usa `localeCompare`.
  - `isGroupedCatalog(q)` y `groupFoodsByCategory(visible, counts)`, en el orden de `FOOD_CATEGORIES`.
  - `frequentFoodTiles(items, foods, limit)`: saltea recetas y alimentos inexistentes; "1 vez" / "N veces".
- **Deep link:**
  - `registroFoodHref({foodId, measure, quantity})` con `URLSearchParams`.
  - `parseRegistroFoodParams(params, foods)` devuelve un ítem de alimento o `null`. Rechaza: id inexistente, `unit` sin gramos por unidad, cantidad ≤0, NaN, >10 000 o vacía. Si llega un array, toma el primer valor.

**`tests/unit/food-catalog.test.mjs` (nuevo)** cubre todo lo anterior, con estos casos: fallback de unidad, conteos, orden por 100 g con porciones distintas y empates, búsqueda con tildes y boost, grupos, split que suma 100 y caso cero, etiquetas ml, redondeo igual a `previewNutrition`, tiles, plurales, y el roundtrip href → parse con rechazos.

**Verificar:** `pnpm test:unit` y `pnpm exec eslint` de los archivos nuevos.

### F2 · Shell
- **`app/alimentos/page.tsx`:**
  - `Responsive` local.
  - Con sesión: `Promise.all([listFoodsForUser, frecuentes])`. Frecuentes = `listFrequentItems({limit: 30})` filtrado a alimentos en el componente, dentro de try/catch que devuelve `[]`.
  - Sin sesión: `listFoodCatalogItems()` y `[]`.
  - Desktop sin el radial violeta (queda el gradiente lineal).
- **`app/globals.css`:** agregar `.alimentos-frame` a la regla `≤1023px` (líneas 546-553).
- **`app/components/shared/MobileHeader.tsx`:** agregar `pathname === "/alimentos"` y el comentario §13.
- **`scripts/validate-mobile.mjs`:** agregar `"/alimentos"` al final de `ROUTES`.
- **`app/lib/nutrition-style.ts`:** `mixed` pasa de violeta a slate (gradiente `#1e2433→#141828→#08090f`, acento `#cbd5e1`). Esto también recolorea `/admin/alimentos`, en línea con DESIGN §1.3.
- **Verificar:**
  - Captura desktop a 1280 **antes** de tocar nada.
  - A 390: sin header, con franja segura y sin overflow.

### F3 · Zonas (`app/components/alimentos/`, client)
| Archivo | Props / rol |
|---|---|
| `FoodsMobile.tsx` | `{ foods, frequent: FrequentItem[], canCreate }`. Estado: `foodList`, `query`, `chip`, `sort`, `visibleCount` (se resetea en handlers, no en effects), `selected {food, measure}`, `createName`. Refs: `returnFocusRef`, `listTopRef`. Derivados con `useMemo` y la lib |
| `FoodsHeader.tsx` | `{ meta, onCreate? }` |
| `FoodSearchBar.tsx` (+ `SortMenu`) | `{ query, onQueryChange, sort, onSortChange, resultCount }` |
| `FoodChips.tsx` | `{ options, value, onChange }` |
| `FrequentFoods.tsx` | `{ tiles, onSelect(food, el, measure) }` |
| `FoodList.tsx` (+ `FoodRow`) | `{ groups \| null, foods, resultCount, remaining, emphasis, onSelect(food, el), onShowMore }` |
| `MacroRing.tsx` | `{ macros, size? }`: SVG de 3 segmentos con `MACRO_COLORS` |
| `FoodsEmpty.tsx` | `{ kind: "search"\|"own", query, canCreate, onCreate(name?), onClear }` |

`app/components/ui/DropdownMenu.tsx` (hoy nadie lo importa): sumar `DropdownMenuRadioGroup`, `DropdownMenuRadioItem` (`ItemIndicator` + lucide `Check`, `min-h-11 pl-8`) y `DropdownMenuLabel`, estilo shadcn.

### F4 · Detalle, crear, FoodForm y deep link al registro
- **Nuevos:** `FoodDetailDrawer.tsx` (con `PortionPicker` y `MacroBreakdown`) y `FoodCreateDrawer.tsx`, según el diseño §7-8.
- **`app/components/shared/FoodForm.tsx`:**
  - Se saca la caja interna y se suman puntos de color en los macros.
  - Línea muted fija "≈ N kcal según los macros"; el aviso de discrepancia sigue igual.
  - La API no cambia. Revisar también su uso inline en el picker del registro.
- **`app/nutricion/registro/page.tsx`:** `searchParams` suma `alimento`, `medida` y `cantidad`.
  ```ts
  const initialItem = logDate === todayKey && comida === undefined ? parseRegistroFoodParams({ alimento, medida, cantidad }, foods) ?? undefined : undefined;
  ```
  Se pasa `initialItem` a `RegistroClient`. El `key={logDate}` no cambia.
- **`app/nutricion/registro/RegistroClient.tsx`:**
  - Prop nueva `initialItem?: Extract<MealItemInput, {kind:"food"}>`.
  - `draftItems` arranca con `[{...initialItem, localId: "deep-link"}]`. Se usa un id constante: `crypto.randomUUID` rompe la regla de pureza y en http LAN no existe.
  - `newMealOpen = Boolean(initialItem) || (Boolean(initialMealType) && !focusMealId)`.
  - Un `useEffect` hace `window.history.replaceState(null, "", "/nutricion/registro")` cuando hay deep link, para que recargar no duplique la comida.
- **`app/nutricion/registro/FoodPicker.tsx`:** re-export de los helpers movidos.

### F5 · Expand + retiro de imágenes
1. **Aplicar primero** por MCP `apply_migration` `20260916_nutrition_foods_image_default`, y guardar `supabase/migrations/20260916_nutrition_foods_image_default.sql` con cabecera en español:
   ```sql
   alter table public.foods alter column image_url set default '';
   ```
   Es compatible con el código viejo. Verificar `column_default = ''::text`.
2. **Código:**
   - `app/lib/nutrition-types.ts`: sacar `Food.imageUrl` (`Recipe.imageUrl` queda).
   - `app/lib/foods.ts`: sacar `image_url` de `FoodRow`, `FOOD_SELECT`, el insert (línea 142) y `mapFood`.
   - Sacar `imageUrl` de `app/alimentos/actions.ts:52` y de `app/admin/alimentos/actions.ts:54`.
   - `app/lib/nutrition-mock.ts`: borrar el bloque muerto `MOCK_FOODS_BASE` / `MOCK_FOODS` y el import de `Food`. Solo se usa `MOCK_PROFILE_DEFAULTS`, y los SVG no existen.
   - `NutritionCatalogClient.tsx` (desktop): sacar `next/image` y dejar siempre el ícono; `#b985ff` pasa a `--foreground-muted`.
3. **Scripts:**
   - `scripts/media-manifest.mjs`: sacar `FOOD_IMAGE_BUCKET`, `fetchFoods`, `foodToAsset` y la entrada de foods.
   - `scripts/upload-generated-images.mjs`: sacar la rama food.
   - `scripts/fetch-dataset-images.mjs`: queda solo para recetas (sacar los mapas y helpers de alimentos, verificados con `rg`, y actualizar la cabecera y `--kind`).
   - `scripts/render-generated-images.ps1` **no se toca**: `Draw-FoodImage` dibuja recetas y comidas.
4. **Borrar:**
   - `scripts/media/food-name-map.json` y `scripts/media/fetch-misses.json`.
   - `scripts/media/generated/foods/`: 203 PNG, 57 MB, recuperables desde el historial de git.
   - En `scripts/media/generated-image-manifest.json`, filtrar `kind !== "food"` (`JSON.stringify(m, null, 2) + "\n"`); el diff tiene que ser solo de borrados.
5. **Verificar:**
   - `rg "imageUrl|image_url|food-images|food-name-map" app scripts` solo encuentra ejercicios, recetas y rutinas.
   - `node --check` de los scripts.
   - Crear un alimento propio en local funciona.

### F6 · Verificación local (tree principal, dev en un puerto libre, p. ej. `pnpm dev -p 3005`)
- `pnpm test:unit` y `pnpm exec eslint` sobre nuestros paths. Lint y build completos van en F7, sobre un HEAD limpio.
- **Playwright a 375, 390 y 430 (cuenta admin por OTP, patrón de `validate-mobile.mjs`):**
  - Buscador y encabezados sticky a mitad de scroll, sin huecos ni solapes.
  - Chips y conteos; orden y su punto; "maiz" encuentra "Maíz".
  - "Mostrar más"; vacíos (búsqueda sin resultados; Tuyos vacío con una ruta temporal de fixtures que **no** se commitea y se borra).
  - Detalle: toggle de porción, % que suma 100, ml en bebidas.
  - Registrar → drawer abierto con el ítem y la URL limpia; recargar no duplica; guardar.
  - Frecuentes aparece después de registrar.
  - Crear desde "+" y desde "Crear «q»"; editar con cambio de vista; eliminar (uno ya usado da toast de error).
  - Escape devuelve el foco a la fila; hit areas de 44 px; teclado completo.
  - Reduced motion con `emulateMedia`; `body` limpio al navegar desde el drawer; 0 errores de consola.
- **Invitado:** sin "+", Tuyos, Frecuentes ni Registrar.
- **Deep link inválido:** id ajeno o inexistente, `unit` sin gramos por unidad, cantidad mala, `fecha` de ayer, `comida` + `alimento`. En todos los casos se ignora.
- **1280:** igual a la captura previa, salvo el violeta y la foto.
- **Payload:** `curl -H "RSC: 1"` sobre `/alimentos` como invitado; "Pechuga de pollo a la plancha" tiene que aparecer 1 vez. Si aparece 2, pasar a un único client root que renderice los dos árboles.
- `VALIDATE_BASE_URL=http://localhost:3005 pnpm validate:mobile`.
- **Limpieza:** borrar las comidas y los alimentos de prueba de la cuenta admin y la ruta temporal.

### F7 · Commits aislados, build de HEAD limpio, push, deploy, smoke en producción
**Commits** (en español, conventional, con la línea `Co-Authored-By` del sistema; cada uno compila solo):

| Commit | Contenido |
|---|---|
| C1 `feat(db): default vacío para foods.image_url (expand)` | Archivo de la migración expand |
| C2 `feat(alimentos): buscador mobile, detalle en sheet y registrar desde el catálogo` | lib + test, `components/alimentos/**`, `alimentos/page.tsx`, `DropdownMenu`, `MobileHeader`, `FoodForm`, `globals.css`, registro (`page`, `RegistroClient`, `FoodPicker`), `nutrition-style` (el cuerpo aclara que recolorea admin), `validate-mobile` |
| C3 `refactor(alimentos): sin imágenes de alimentos` | Código de F5, scripts, manifest y borrados |
| C4 `docs(alimentos): diseño mobile, rutas y estado de la base` | `DESIGN.md`, `REDESIGN_DIRECTION.md`, `docs/codex/*`, `DATABASE.md` (expand aplicada; foods y storage reescritos) |

**Técnica (sin tocar el índice ni el WIP de la otra sesión):**
1. `git fetch`; `BASE=$(git rev-parse HEAD)` (para C1, `BASE` tiene que ser igual a `origin/master`).
2. `GIT_INDEX_FILE=$SCR/idx git read-tree $BASE`.
3. `git add -A --pathspec-from-file=paths-cN` (incluye los borrados).
4. Solo en C4: `doc-edits.mjs --base $BASE`, `git hash-object -w --path=<file>` y `update-index --cacheinfo`.
5. Revisar que `git diff --cached --stat $BASE` muestre solo lo nuestro.
6. `write-tree`, `commit-tree -p $BASE`, y `update-ref refs/heads/master $NEW $BASE`. Es un CAS: falla si master se movió, y en ese caso se para y se pregunta.
7. `git reset -q --pathspec-from-file=<archivos del commit>`.
8. Comprobar que los renames staged de la otra sesión siguen iguales.
9. Si el trabajo propio aparece metido en un commit ajeno, parar y preguntar.

**Build de HEAD limpio:**
1. `git worktree add --detach $WT HEAD` y copiar `.env.local`.
2. `pnpm install --frozen-lockfile --offline` y después `pnpm check` y `pnpm test:unit`.
3. `next start -p 3006` y Playwright rápido a 390 y 1280, más `validate:mobile`.
4. `git worktree remove --force`.
5. Si la ruta larga rompe pnpm por MAX_PATH, usar un directorio corto, previa consulta.

**Push:**
1. `git fetch`; `git log origin/master..HEAD` tiene que mostrar solo C1–C4 (si no, se pregunta).
2. `git push origin HEAD:master`, sin force.
3. Seguir el deploy con `gh api repos/fedethoch/gymcontrol/deployments?sha=…&environment=Production` y los statuses (Monitor) hasta `success`.

**Smoke en producción** (https://gymcontrol-lake.vercel.app, a 390 y 1280):
- **Invitado:** meta con 505 alimentos, sin header ni acciones con sesión; búsqueda, orden y detalle funcionan.
- **Admin por OTP:**
  - Tuyos; Registrar lleva al drawer con la URL limpia.
  - **Crear, editar y borrar un alimento propio.** El insert sin columna es la prueba real del expand.
  - `/admin/alimentos` y `/recetas` cargan.
  - El create inline del picker del registro funciona.
- `VALIDATE_BASE_URL=<prod> pnpm validate:mobile`.
- Limpiar los datos de prueba.

### F8 · Contract + storage + docs (recién con C1–C4 en producción y el smoke OK)
1. **Migración contract** por MCP (`20260916_nutrition_foods_image_contract`), guardada en su archivo:
   - `alter table public.foods drop column image_url;`
   - `drop policy if exists` de las 4 `food_images_*` sobre `storage.objects`.
   - Cabecera con la precondición (deploy `<sha>`), "sin backup por decisión del usuario" y que el storage se borra por API.
2. **Script en scratchpad (no se commitea)**, cwd = repo, supabase-js vía `createRequire` y `.env.local` con el loader de `media-manifest.mjs`:
   - `--dry-run`: cuenta objetos y bytes.
   - Loop `list("", {limit:100})` → `remove(names)`, hasta que vuelva vacío (con tope). Aborta si aparece una carpeta (`id === null`).
   - `deleteBucket("food-images")`.
3. **Verificar por SQL** (no por HTTP 404, porque el CDN cachea un año):
   - La columna no existe.
   - `storage.objects` del bucket = 0, el bucket no existe y `pg_policies food_images_%` = 0.
4. **Smoke de nuevo** en `/alimentos` (crear y borrar un propio), registro, `/admin/alimentos` y `/recetas`.
5. **`docs/DATABASE.md`:**
   - Sección foods sin `image_url`; sección Storage `food-images` como "eliminado 2026-09-16 (por API)".
   - Bloque contract, al estilo de las líneas 474-479, y fila en la tabla de migraciones (808-811).
   - Notas: `private.foods_backup_20260915` conserva URLs muertas, y un rollback de Vercel a un deploy anterior rompe las pantallas de alimentos.
6. **C5 `chore(db): contract de imágenes de alimentos`** (migración + `DATABASE.md`) con la misma técnica; push y deploy OK.
7. **Cierre:**
   - `graphify update .` sin commitear (compartido con la otra sesión).
   - Memoria del proyecto actualizada.
   - Artifact del mock marcado como implementado.

## Reuso (no crear)
- **Búsqueda:** `searchByName` y `normalizeSearchText` (`app/lib/food-search.ts`).
- **Tipos y etiquetas:** `getAmountUnitLabel`, `FOOD_CATEGORIES` y `FOOD_CATEGORY_LABELS` (`nutrition-types.ts`).
- **Estilos de nutrición:** `CATEGORY_ICONS`, `MACRO_COLORS` y `MACRO_LABELS` (`nutrition-style.ts`).
- **Motion:** `AnimatedNumber` (`motion.tsx`); `MotionConfig reducedMotion="user"` ya es global.
- **Drawers:** `Drawer*` y las clases de header/footer de `RoutineSwitcher.tsx` y `TodayExercisesSheet.tsx`.
- **Componentes varios:** `HomeSectionHeader`, `LoadingDots`, `toast` de sonner y `.motion-empty-state`.
- **Alimentos propios:** `FoodForm` (`initialName`), `saveOwnFoodAction`, `deleteOwnFoodAction` y el markup de confirmación de `NutritionCatalogClient.tsx:394-433`.
- **Frecuentes:** `listFrequentItems` (`meal-logs.ts:633`).
- **Scripts:** el loader de `.env.local` de `scripts/media-manifest.mjs`.
- **Tabs y scroll:** el patrón `layoutId` de `DayTabs.tsx` y las clases sin scrollbar de `RoutineWeekView.tsx`.

## Riesgos
- **Rollback de Vercel posterior al contract:** rompe las pantallas de alimentos. Si Skew Protection está activo, las pestañas viejas o la PWA también. Mismo riesgo que en contracts anteriores; queda documentado.
- **Borrado irreversible y sin backup** (elección del usuario). Los PNG siguen solo en el historial de git.
- **La otra sesión puede commitear en medio.** El CAS de `update-ref` lo detecta: se para y se pregunta.
- **Caché:** `unstable_cache` (1 h) puede servir un rato alimentos con `imageUrl`. Es inocuo.
- **`FoodForm` compartido:** cambia apenas la vista del create inline del registro. Se verifica en F6.
