# Plan: arreglos visuales PWA

## Context
Pulido visual de la PWA. Seis defectos de layout/UX reportados en: modal de detalle de ejercicio, página de rutina `catalogo/rutinas/[id]`, home, configuración, y los sheets de detalle en `/alimentos` y `/recetas`. Objetivo: layout más limpio/minimalista y guardado automático del nombre.

---

## 1. Modal detalle ejercicio — `app/components/shared/ExerciseDetailModal.tsx`

Tres cambios:

### 1a. Botón "ver gif" se solapa con la X de cerrar
Botón Play está en `right-3 top-3` (línea 110), mismo lugar que la X del `SheetContent`. Mover a abajo-derecha de la imagen.
- Cambiar clase del `motion.button` (línea 110): `absolute right-3 top-3` → `absolute bottom-3 right-3`.
- El bloque de título/badges está en `bottom-0` alineado a la izquierda (línea 147), así que abajo-derecha queda libre.

### 1b. "Grupo muscular" ocupa 2 renglones
En `SpecChip` (líneas 228-237), el label `GRUPO MUSCULAR` se parte por el `tracking` ancho dentro del chip de media columna.
- Label span (línea 231): añadir `whitespace-nowrap` y reducir tracking `tracking-[0.15em]` → `tracking-[0.08em]` para que entre en un renglón.

### 1c. Badges "pecho"/"barra" se ven encerrados
Badges sobre el hero (líneas 151-163) tienen `border` + fondo de variante → look "encajonado".
- Quitar `border` del badge de músculo (línea 155) y usar un estilo más libre: pill sin borde, fondo translúcido sutil (ej. `bg-white/10 text-white backdrop-blur-sm` o variante minimal sin borde).
- `Badge variant="neutral"` de equipamiento (línea 162): cambiar a la misma variante sin borde / minimal.
- Preview:
```
ANTES                          DESPUES
[▢ Pecho] [▢ Barra]   →    Pecho · Barra   (pills suaves, sin caja)
```

---

## 2. Rutina día — `app/catalogo/rutinas/[id]/RoutineDetailClient.tsx`

Conteo "N ejercicios" queda pegado al nombre y desalineado entre días. Moverlo a la derecha, pegado a la flechita.
- `AccordionTrigger` children (líneas 48-57): el `<div className="flex items-center gap-3">` agrupa icono+nombre+conteo. Separar el conteo:
  - Hacer el div hijo `flex flex-1 items-center gap-3`.
  - Mover el `<span>{day.items.length} ejercicios</span>` fuera del grupo izquierdo, como último hijo con `ml-auto` (o envolver en `flex-1 justify-between`), para que quede pegado a la izquierda del chevron.
- El chevron lo añade `Accordion.tsx` (no tocar ese archivo).
- Preview:
```
ANTES:  📅 Lunes  3 ejercicios ───────────────── ⌄
DESPUES: 📅 Lunes ──────────────── 3 ejercicios   ⌄
```

---

## 3. Home hero recortado — `app/page.tsx`

Wrapper (línea 132) `relative overflow-hidden` sin altura → la `<Image fill>` se recorta a la altura del contenido.
- Añadir una altura explícita al wrapper: `aspect-[16/9]` (o `min-h-[170px]`) en la línea 132, manteniendo el contenido alineado abajo.
- Verificar que el contenido (`p-4 pb-5`) siga anclado correctamente; si hace falta, anclar el bloque de contenido con `justify-end` dentro de un flex de altura completa.

---

## 4. Configuración — guardado automático — `app/configuracion/ConfiguracionClient.tsx`

Quitar botón "Guardar nombre"; guardar automático.
- Eliminar el `<Button>` (líneas 164-167) del `accountBody`.
- Añadir `onBlur={handleSaveName}` al `<Input>` (líneas 157-162), con guard de "no guardar si no cambió" (comparar contra un ref del último valor guardado, patrón ya usado para el perfil de nutrición en líneas 88-127).
- `handleSaveName` (líneas 129-141): mantener pero quitar el `toast.success` ruidoso (opcional) o dejar feedback discreto; quitar `isSavingName`/`LoadingDots` si quedan sin uso.
- Layout `accountBody` (línea 154): simplificar grid `sm:grid-cols-[1fr_auto]` → una sola columna ya que no hay botón.

---

## 5. Línea violeta en sheets de alimentos y recetas

Barra de acento `h-0.5` con gradiente violeta arriba del panel.
- `app/alimentos/NutritionCatalogClient.tsx` línea 182: eliminar el `<div className="h-0.5 ... bg-[linear-gradient(...)]" />`.
- `app/recetas/RecipeCatalogClient.tsx` línea 196: eliminar el mismo `<div>`.

---

## Archivos a modificar
1. `app/components/shared/ExerciseDetailModal.tsx`
2. `app/catalogo/rutinas/[id]/RoutineDetailClient.tsx`
3. `app/page.tsx`
4. `app/configuracion/ConfiguracionClient.tsx`
5. `app/alimentos/NutritionCatalogClient.tsx`
6. `app/recetas/RecipeCatalogClient.tsx`

(No tocar `Accordion.tsx`, `Sheet.tsx`, `Badge.tsx` salvo que la variante minimal del badge requiera una nueva variante; preferir clases inline.)

## Verificación
- `npm run build` / typecheck sin errores.
- Visual con Playwright (sesión admin de `.env.local`) en viewport móvil:
  1. Abrir un ejercicio (ej. press banca plano): Play abajo-derecha, X arriba sin solape; "Grupo muscular" en un renglón; pills sin caja.
  2. `/catalogo/rutinas/[id]`: conteo pegado a la izquierda del chevron, alineado entre días.
  3. Home: hero con altura completa, sin recorte.
  4. `/configuracion`: editar nombre, blur → se guarda sin botón.
  5. `/alimentos` y `/recetas`: abrir un item → sin línea violeta arriba.
- `graphify update .` tras los cambios.
