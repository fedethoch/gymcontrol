# Plan: Imágenes para body-fat, alimentos y recetas (PWA)

## Context

Tres catálogos de la PWA muestran imágenes mal o no las muestran:

1. **Body-fat (`/configuracion`)** — `BodyFatFigure` apunta a `public/references/body-fat/{12,17,22,27,33}.png`, pero esos archivos **no existen** → imagen rota / placeholder. El componente recibe `gender` pero lo ignora (`void gender`).
2. **Alimentos (`/alimentos`)** — 204 foods en Supabase. La columna `foods.image_url` existe y el bucket `food-images` está provisionado, pero **0 imágenes** (seed inserta `''`). La UI ni siquiera renderiza `imageUrl`; usa gradiente + icono Lucide.
3. **Recetas (`/recetas`)** — 25 recetas con `image_url` poblado, **pero** las imágenes actuales (generadas por IA) **no representan el plato real**. Hay que reemplazarlas por fotos reales del plato.

Decisiones del usuario:
- Fuente de imágenes alimentos/recetas: **dataset abierto** (no IA, no scraping manual).
- Recetas: **reemplazar** las actuales por fotos reales de la comida.
- Body-fat: **por género** (10 imágenes: masc/fem × 5 niveles).
- Storage body-fat: **el que cargue más rápido** para el usuario.

**Tradeoff aceptado:** fotos reales de datasets mixtos no tendrán fondo/encuadre idénticos (el objetivo original "mismo fondo"). Se mitiga priorizando TheMealDB (thumbnails uniformes, fondo blanco) como fuente primaria.

---

## Fuentes de datos (verificadas)

| Catálogo | Fuente primaria | Fallback | Notas |
|---|---|---|---|
| Alimentos | **TheMealDB** ingredient thumbnails: `https://www.themealdb.com/images/ingredients/{name}.png` (fondo blanco uniforme, PNG estático sin API key) | **Open Food Facts** search: `https://world.openfoodfacts.org/cgi/search.pl?search_terms={q}&json=1&fields=product_name,image_url` | Nombres TheMealDB en inglés → requiere mapa es→en |
| Recetas | **TheMealDB** meal search: `https://www.themealdb.com/api/json/v1/1/search.php?s={name}` (campo `strMealThumb`, foto real del plato) | Open Food Facts no aplica (son platos) | Match difuso por nombre → mapa curado |
| Body-fat | Sin dataset abierto viable → **generar 10 figuras** (3D/silueta neutra, por género) | — | Ver sección body-fat |

Licencias: OFF imágenes = CC-BY-SA 3.0 (atribución requerida). TheMealDB = gratis en punto de acceso; el **fetch directo del .png/.jpg no usa la API key** (la key "1" solo limita endpoints JSON, que igualmente solo se usan para resolver URLs). Riesgo legal documentado en Riesgos.

---

## Decisión de storage (carga rápida)

- **Alimentos (204) y recetas (25):** Supabase bucket (`food-images`, `recipe-images`) — CDN público, `cacheControl` 1 año, ya es el patrón existente. 204 imágenes no deben ir al bundle.
- **Body-fat (10):** **`public/references/body-fat/`** local. En una PWA el service worker precachea assets de `public/` → carga instantánea y offline. 10 PNGs chicos. Cero infra nueva, el path ya apunta ahí. **Esta es la opción más rápida para el usuario.**

---

## Cambios

### 1. Body-fat (por género, en `public/`)

**`app/components/shared/BodyFatFigure.tsx`** — usar `gender` en el path:
- Quitar `void gender`.
- Mapear gender → carpeta: `male`→`male`, `female`→`female`, cualquier otro/null → `male` (default).
  (Verificar valores exactos del type `Gender` en `app/lib/nutrition-types.ts` antes de mapear.)
- `src={`/references/body-fat/${folder}/${value}.png`}`.

**Assets nuevos** (10): `public/references/body-fat/male/{12,17,22,27,33}.png` y `.../female/{...}.png`.
- Figuras genéricas (no persona real), 3D/silueta limpia, fondo neutro consistente, mismo encaje/proporción entre niveles.
- Generación: como no hay dataset abierto de figuras body-fat, se generan (IA o ilustración). **Assumption** a confirmar en ejecución: usar render 3D androginо-por-género estilo "fitness reference chart".

### 2. Pipeline de imágenes (reusar lo existente + extender)

El repo ya tiene: `scripts/media-manifest.mjs` (genera manifest con bucket/storagePath/prompt) y `scripts/upload-generated-images.mjs` (sube a bucket + escribe `image_url`). Reusar ese flujo.

**a) `scripts/media-manifest.mjs`** — agregar foods:
- `fetchFoods()` → `supabase.from("foods").select("id, name, image_url, category").order("name")`.
- `foodToAsset(food)` → `{ kind: "food", bucket: "food-images", storagePath: `${id}-${slug}.png`, localPath: `scripts/media/generated/foods/${id}-${slug}.png`, status: image_url ? "linked" : "needs-generation", name, category }`.
- Incluir `...foods.map(foodToAsset)` en `manifest.assets`.
- Reutilizar `slugify()` existente.

**b) Nuevo `scripts/fetch-dataset-images.mjs`** — resuelve y descarga imágenes reales (reemplaza el paso manual de IA):
- Lee el manifest. Para cada asset `kind: "food"` o `kind: "recipe"`:
  - **food:** buscar nombre en `scripts/media/food-name-map.json` (es→en curado) → fetch `themealdb.com/images/ingredients/{en}.png`. Si 404 → fallback OFF search por `name` → tomar `image_url`. Descargar bytes a `localPath`.
  - **recipe:** fetch TheMealDB `search.php?s={name-en}` → `strMealThumb`. Si no hay match → registrar en `misses.json` para revisión manual.
- Flag `--replace` para recetas: procesar aunque `status==="linked"` (sobrescribe las actuales no representativas).
- Loggear hits/misses compacto. Los misses se completan a mano (curar `food-name-map.json` / dejar imagen manual en `localPath`).

**c) `scripts/upload-generated-images.mjs`** — agregar branch food:
- En el `if (asset.kind === ...)`, añadir `else if (asset.kind === "food") { await updateTable("foods", asset.id, data.publicUrl); }`.
- Para recetas el branch ya existe; `upsert: true` ya reemplaza el objeto en el bucket.

### 3. UI alimentos — renderizar la imagen

Hoy `NutritionCatalogClient.tsx` no usa `imageUrl` (solo gradiente+icono). Mostrar la foto cuando exista, con fallback al gradiente actual:
- Fila de lista (`:127-133`) y header del sheet (`:182-190`): si `food.imageUrl` → `next/image` (`fill`, `object-cover`, mismo tile redondeado); si vacío → gradiente+icono actual (sin cambios).
- Patrón de referencia: `RecipeCatalogClient.tsx:127-139` ya hace exactamente esto.
- Agregar el host de Supabase a `next.config` `remotePatterns` si no está ya (recetas ya cargan de ese host → probablemente ya configurado; verificar).

---

## Archivos a tocar

| Acción | Archivo |
|---|---|
| Editar | `app/components/shared/BodyFatFigure.tsx` (path por género) |
| Crear | `public/references/body-fat/{male,female}/{12,17,22,27,33}.png` (10) |
| Editar | `scripts/media-manifest.mjs` (fetchFoods + foodToAsset) |
| Crear | `scripts/fetch-dataset-images.mjs` (resolver+descargar dataset) |
| Crear | `scripts/media/food-name-map.json` (es→en curado) |
| Editar | `scripts/upload-generated-images.mjs` (branch `food`) |
| Editar | `app/alimentos/NutritionCatalogClient.tsx` (render imageUrl c/fallback) |
| Verificar | `next.config.*` remotePatterns host Supabase |

No tocar: schema DB (columna+bucket ya existen), seeds, RLS.

---

## Verificación (end-to-end)

1. **Body-fat:** `npm run dev` → `/configuracion`, seleccionar cada nivel con género M y F → 10 imágenes cargan, sin broken. Cambiar gender → cambia el set.
2. **Manifest:** `node scripts/media-manifest.mjs --kind food` → confirma 204 assets food en el JSON.
3. **Fetch:** `node scripts/fetch-dataset-images.mjs --kind food` y `... --kind recipe --replace` → revisar `misses.json`, curar `food-name-map.json`, re-correr hasta cobertura aceptable.
4. **Upload:** `node scripts/upload-generated-images.mjs --kind food` y `... --kind recipe` → verificar vía MCP `execute_sql`: `select count(*) from foods where image_url <> ''` ≈ 204; recetas con URL nueva (bucket `recipe-images`, storagePath `{id}-{slug}.png` re-subido).
5. **UI alimentos:** `/alimentos` → fotos en lista y sheet; foods sin imagen muestran gradiente (fallback intacto).
6. **UI recetas:** `/recetas` → las nuevas fotos representan el plato real.
7. **PWA:** build prod, verificar que `public/references/body-fat/**` queda precacheado por el service worker (carga offline).

---

## Riesgos

- **Cobertura de nombres:** mapear 204 nombres ES → TheMealDB/OFF tendrá misses. Mitigación: `food-name-map.json` curado + `misses.json` + fallback OFF. Algunos quedarán con gradiente (aceptable, no rompe).
- **Consistencia de fondo:** recetas (fotos reales de platos) tendrán fondos variados — contradice el objetivo "mismo fondo", pero es consecuencia de elegir dataset. Foods vía TheMealDB sí son uniformes.
- **Licencia/atribución:** OFF = CC-BY-SA 3.0 (atribución). TheMealDB gratis en acceso; el fetch directo del archivo de imagen no consume API key. Confirmar términos antes de release público.
- **Body-fat sin dataset:** las 10 figuras no salen de un dataset abierto; se generan. Confirmar estilo antes de generar el set completo.
