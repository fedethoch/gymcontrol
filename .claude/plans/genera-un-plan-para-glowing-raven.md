# Plan — Nutrición, sidebar, configuración y recetas

## Context

Conjunto de mejoras sobre el área de nutrición y la navegación de GymControl:
conversión proporcional gramos↔unidades, edición de cantidades dentro de comidas
ya creadas, rediseño de `/nutricion/registro` según `desing-refs/nutricionregistro.html`,
reestructuración del sidebar en áreas (Entrenamiento / Nutrición / Gestión),
movida del logout a `/configuracion`, campo de nombre personalizado, nuevo módulo
`/recetas` con admin CRUD, tabla ordenable en `/admin/alimentos`, y rediseño de la
card de plan (círculo de progreso, sin botón "calcular", sin BMR card).

Decisiones confirmadas con el usuario:
- Recetas: ingredientes **vinculados a alimentos** (`recipe_items.food_id -> foods`), macros derivados.
- Constancia nutricional: datos **reales** desde `getLoggedDatesForUser`.
- Nombre de usuario: nueva columna **`display_name` en `profiles`**.
- Borrar cuenta: **borrado real** (service-role) con confirmación escrita.

Stack: Next.js App Router, React + Tailwind, shadcn/ui (`app/components/ui/`),
lucide-react, Supabase (MCP `supabase_gymcontrol`). Mobile-first.

Tokens de diseño del ref (acento `#7c3aed`, card `#121824`, donut con gradiente
`#9333ea→#b995ff`) ya existen como CSS vars del proyecto — usar las del proyecto,
no hardcodear.

---

## Trabajo por área

### 1. Conversión proporcional gramos ↔ unidades (registro)
**Archivo:** `app/nutricion/registro/RegistroClient.tsx` (`FoodPickerRow`, L436-519).

Hoy al cambiar `measure` g↔unit el campo cantidad no se reconvierte. Al togglear:
- g → unit: `nuevaQty = qtyGramos / (food.gramsPerUnit ?? food.servingG)`
- unit → g: `nuevaQty = qtyUnidades * (food.gramsPerUnit ?? food.servingG)`

Reusar `roundQuantity` (L535) y `previewItem` (L521). La conversión es solo UI del
draft; el server (`addMealLogItem`, `app/lib/meal-logs.ts:207`) ya recalcula grams.

### 2. Editar cantidades de items en comida creada
Hoy editar = borrar + re-agregar (no existe update de item).

- **DB/lib:** agregar `updateMealLogItem(itemId, { measure, quantity })` en
  `app/lib/meal-logs.ts`, espejando la conversión unit→grams de `addMealLogItem`
  (L228-238) y validando ownership vía `meal_logs` (RLS owner-only ya cubre).
- **Action:** `updateMealLogItemAction` en `app/nutricion/registro/actions.ts`
  (patrón de `addMealLogItemAction` L50 + `revalidatePath`).
- **UI:** en `MealCard` (RegistroClient L291), en modo edición, las filas de items
  (L401-427) pasan de solo-lectura a editable: input de cantidad + selector de
  unidad por fila, con guardar inline. Reusar `previewItem` para recalcular macros.

### 3. Rediseño `/nutricion/registro` (base: ref HTML)
**Archivos:** `RegistroClient.tsx` + `page.tsx`. Usar skill **frontend-design** /
**impeccable** para el shape visual; portar el layout del ref a shadcn/ui + Tailwind.

Estructura objetivo (del ref):
- Header: título "Registro diario de comidas" + navegador de fecha (‹ 📅 fecha ›).
- Grid 2 col `minmax(0,1.2fr) minmax(300px,1fr)`: izq **Nueva comida** (nombre,
  buscador con dropdown, unidad, cantidad, agregar, tabla de agregados, guardar);
  der **Resumen nutricional** con `DonutChart` (kcal vs objetivo) + `ProgressRow`
  por macro + mini-stats (días registrados / promedio / racha — reales, ver §8).
- Cards uniformes (mismo `border-radius`, padding, alturas), corregir espaciados
  disparejos actuales.
- "Comidas de hoy": grid `repeat(auto-fill,minmax(220px,1fr))` de `MealCard`.
- "Constancia nutricional": heatmap real (ver §8).

Adaptaciones: solo unidades `g`/`unit` (el ref muestra ml/Taza — omitir);
emojis del ref → iconos de categoría existentes (`app/lib/nutrition-style`);
macros/datos reales, no `FOOD_DB` mock.

### 4. `/nutricion` (catálogo): "1u (x g)" bajo el alimento
**Archivo:** `app/nutricion/NutritionCatalogClient.tsx` (`FoodRow` L137, `FoodDetailSheet`).
Donde muestra `{servingG} g · {calories} kcal`, agregar línea `1u (≈{gramsPerUnit} g)`
**solo si** `food.gramsPerUnit != null`. Reusar `MacroBar` ya presente.

### 5. Sidebar: reestructurar en áreas + mover logout
**Archivos:** `app/components/shared/navigation-config.ts`,
`app/components/shared/PrimaryNavigation.tsx`.

- En `shellNavigationGroups`, reemplazar los 2 grupos actuales por 3 áreas:
  - **Entrenamiento**: `/catalogo` (Catálogo), `/dashboard` (Mis rutinas), `/dashboard/rutinas` (Semana activa).
  - **Nutrición**: `/alimentos` (Alimentos — antes `/nutricion`), `/nutricion/registro` (Registro diario), `/recetas` (Recetas).
  - **Gestión** (admin): `/admin`, `/admin/ejercicios`, `/admin/rutinas`, `/admin/alimentos`, `/admin/recetas`.
- Orden Nutrición: Alimentos → Registro diario → **Recetas entre Nutrición y Registro** según pedido → ajustar a: Alimentos, Recetas, Registro diario. *(Confirmado: recetas debajo de nutrición/alimentos y arriba de registro.)*
- Actualizar `shellRouteMetas` y `resolveShellRouteMeta`.
- **Logout:** quitar el `<form action="/auth/signout">` del fondo del panel
  (`PrimaryNavigation.tsx` L211-246). En ese lugar va el link a **Configuración**
  (icon `Settings`). El logout se mueve a `/configuracion` (§7).

### 6. Renombrar ruta `/nutricion` → `/alimentos`
- Mover `app/nutricion/page.tsx` + `NutritionCatalogClient.tsx` a `app/alimentos/`.
  (El registro permanece como `/nutricion/registro`; ojo: deja de existir `/nutricion`
  índice — verificar que `registro` siga resolviendo. Alternativa: mantener carpeta
  `app/nutricion/registro` y crear `app/alimentos` nueva. **Recomendado:** crear
  `/alimentos` para el catálogo y dejar `/nutricion/registro` intacto.)
- Actualizar `revalidatePath("/nutricion")` → `/alimentos` en
  `app/admin/alimentos/actions.ts` y donde aplique.
- Actualizar label sidebar "Nutrición" → "Alimentos".

### 7. `/configuracion`: nombre, plan rediseñado, logout, borrar cuenta
**Archivos:** `app/configuracion/{page.tsx, ConfiguracionClient.tsx, actions.ts}`.

- **Campo nombre:** input `display_name`. Migración: `ALTER TABLE profiles ADD COLUMN
  display_name text`. Extender `AuthContext.profile` en `app/lib/auth.ts` (L11-21,
  `loadProfileRecord` L47-59) para incluir `displayName`. Action
  `saveProfileNameAction`. Usar el nombre en frases (saludos en dashboard/registro).
- **Plan siempre visible:** quitar botón "Calcular mi plan" (L167-170); el plan se
  computa/muestra siempre (ya hay fallback `MOCK_PROFILE_DEFAULTS`). Recalcular
  on-change de inputs o al guardar perfil.
- **Rediseño card de plan:** quitar `Stat` de BMR (L183). Objetivo de kcal como
  **círculo de progreso protagonista** (componente donut, reusar el del registro §3).
  Mantenimiento como dato secundario/acotado. Macros como anillos/barras.
- **Logout:** al fondo de `/configuracion`, botón "Cerrar sesión"
  (`<form action="/auth/signout" method="post">`, mismo handler `app/auth/signout/route.ts`).
- **Borrar cuenta:** debajo del logout, zona peligro. Dialog de confirmación que
  exige escribir el email/"BORRAR". Action `deleteAccountAction` con **service-role
  client** (`supabase.auth.admin.deleteUser(userId)`), cascada por FKs a `auth.users`;
  revisar FKs a `profiles.id` (DATABASE.md). Tras borrar → signOut + redirect a login.
  Requiere `SUPABASE_SERVICE_ROLE_KEY` (verificar en `ENV_INDEX`).

### 8. Constancia nutricional real (heatmap + racha + días)
**Datos:** `getLoggedDatesForUser({days})` ya existe (usado en registro page L13-18).
Calcular en server (`app/nutricion/registro/page.tsx`) racha actual y días registrados
del mes desde `loggedDates`; pasar a `RegistroClient`. Heatmap = grid de celdas por
fecha con nivel según si hubo registro. Reusar patrón visual del ref (`NutritionHeatmap`).

### 9. `/recetas` + admin CRUD
**DB (migración nueva vía MCP `apply_migration`):**
```
recipes(id uuid pk, name text, description text, image_url text null,
  category text, servings int default 1, created_by -> profiles(id),
  created_at, updated_at)
recipe_items(id uuid pk, recipe_id -> recipes on delete cascade,
  food_id -> foods on delete restrict, grams numeric(7,1) >0)
```
RLS: lectura pública, escritura admin-only (espejo de `foods`, DATABASE.md L617-632).
Seed 4-6 recetas de ejemplo. Actualizar `docs/DATABASE.md`.

**Lib (espejo del triad de alimentos):**
- `app/lib/recipes.ts`: `listRecipeCatalogItems`, `listAdminRecipes`, `getRecipeById`,
  `createRecipe`, `updateRecipe`, `deleteRecipe`, `mapRecipe` (macros = suma de
  `recipe_items` escalados por grams, misma fórmula que `mapMealLogItem` L334-356).
- `app/lib/recipes-form.ts` (`RecipeFormPayload`, `RecipeFormState`) y
  `app/lib/recipes-validation.ts` (`parseRecipePayload`).

**Catálogo usuario:** `app/recetas/{page.tsx, RecipeCatalogClient.tsx}` — grid de
cards con imagen/categoría/macros derivados (estilo `NutritionCatalogClient`).

**Admin:** `app/admin/recetas/{page.tsx, RecipeAdminClient.tsx, actions.ts}` —
patrón de `app/admin/alimentos/` (Table + Sheet form + Dialog delete). El form
incluye selector de ingredientes (buscar alimento + gramos, lista editable).
`saveRecipeAction`/`deleteRecipeAction` con `requireAdmin()` + `revalidatePath`.

### 10. Tabla ordenable en `/admin/alimentos`
**Archivo:** `app/admin/alimentos/FoodAdminClient.tsx`. Replicar el patrón sortable de
`app/admin/ejercicios/ExerciseAdminClient.tsx`:
- Tipos `SortColumn` (name|category|calories|proteinG|carbsG|fatG|createdAt) +
  `SortDirection`, estado (L90-104 del ref).
- Bloque `.sort()` dentro del `filtered` useMemo (L69-77): `localeCompare(...,"es")`
  para strings, resta numérica para kcal/macros, `getTime()` para fecha.
- Copiar componente `SortHeader` (ejercicios L515-545) y envolver los `<TableHead>`.
- `AdminFoodListItem` ya trae `createdAt`/`createdAtLabel` (foods.ts L6-9) pero el
  client tipa `Food[]` (L54) y los descarta — cambiar el tipo del prop para habilitar
  orden por fecha.

---

## Archivos clave (resumen)
- Nutrición registro: `app/nutricion/registro/{RegistroClient,page,actions}.tsx/.ts`, `app/lib/meal-logs.ts`
- Catálogo: `app/alimentos/*` (movido), `app/nutricion/NutritionCatalogClient.tsx`
- Sidebar: `app/components/shared/{navigation-config.ts, PrimaryNavigation.tsx}`
- Config/auth: `app/configuracion/*`, `app/lib/auth.ts`, `app/auth/signout/route.ts`
- Plan/cálculo: `app/lib/nutrition-calc.ts`, `app/lib/nutrition-profile.ts`
- Recetas (nuevo): `app/lib/recipes*.ts`, `app/recetas/*`, `app/admin/recetas/*`
- Admin alimentos sort: `app/admin/alimentos/FoodAdminClient.tsx` (ref `ExerciseAdminClient.tsx`)
- DB: migraciones vía MCP `supabase_gymcontrol` + `docs/DATABASE.md`

## Skills a usar
- **frontend-design** / **impeccable**: rediseño registro (§3) y card de plan (§7).
- **playwright-cli**: validación visual/funcional end-to-end de cada cambio.
- **shadcn-ui**: componentes base (Dialog confirm, Select, Table).

## Verificación (playwright-cli)
1. `/nutricion/registro`: togglear g↔unit reconvierte cantidad proporcional (50g/1u: 100g→2u). ✅
2. Editar comida creada: cambiar gramos de un item sin borrarlo; total se actualiza. ✅
3. Layout registro vs ref: cards uniformes, donut de kcal, resumen, heatmap real. ✅
4. `/alimentos`: cada alimento con `1u (≈x g)` cuando aplica. ✅
5. Sidebar: 3 áreas (Entrenamiento/Nutrición/Gestión), sin logout abajo, link Configuración presente. ✅
6. `/configuracion`: campo nombre persiste y aparece en saludos; plan sin botón, círculo de kcal, sin BMR card; logout funciona; borrar cuenta pide confirmación. ✅
7. `/recetas`: catálogo visible; admin crea/edita/borra receta con ingredientes; macros derivados correctos. ✅
8. `/admin/alimentos`: headers ordenables (asc/desc) por columna como ejercicios. ✅
9. Build/tipos: `pnpm build` o `pnpm lint` sin errores; `graphify update .` tras cambios.

## Riesgos
- **Borrar cuenta**: irreversible; requiere service-role key y revisar cascada FK (`profiles.id` vs `auth.users.id`).
- **Mover `/nutricion`→`/alimentos`**: romper enlaces internos / `revalidatePath`. Mitigar buscando refs antes.
- **Recetas**: nuevas tablas + RLS; validar que macros derivados coincidan con la fórmula de meal_logs.
- Conversión g↔unit: redondeo (`roundQuantity`, step 0.5) puede dar valores no enteros — aceptable.
