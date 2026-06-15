# Plan: arreglar registro de nutrición + UX cards + centrado figura grasa + backfill porciones

## Context

Cuatro problemas en el área de nutrición/configuración:

1. **Bug real:** agregar un alimento a una comida falla siempre con toast genérico "No se pudo agregar el alimento." Causa raíz confirmada contra la DB remota: `meal_log_items.meal_log_id` es **NOT NULL**, pero `addMealLogItem` (`app/lib/meal-logs.ts:221`) hace el INSERT sin ese campo → viola NOT NULL → el error se traga en el `catch {}` del cliente (`RegistroClient.tsx:246`). (Las columnas `measure`/`quantity`/`grams_per_unit` SÍ existen en la DB — migraciones g22/g23/g24 aplicadas; el reporte de "columnas faltantes" era de archivos locales desactualizados, no de la DB.)

2. **UX de `/nutricion/registro`:** hoy la card "Nueva comida" solo crea el grupo (nombre); los alimentos se agregan dentro de cada card de "Comidas de hoy". El usuario quiere invertir: la card **"Nueva comida" debe ser un form con nombre + poder ir agregando varios alimentos ahí mismo**; "Comidas de hoy" pasa a ser **solo visualización con borrar/editar** las comidas creadas (editar = nombre + alimentos).

3. **`/configuracion`:** la figura de porcentaje graso (`BodyFatFigure`) no está centrada horizontalmente.

4. **Datos:** los 18 alimentos existentes tienen `grams_per_unit = NULL`, lo que oculta la opción de medir por unidad. Inventar valores realistas de porción/unidad para todos.

Resultado esperado: agregar alimentos funciona, el flujo de creación de comida vive en una sola card, la figura queda centrada, y todos los alimentos permiten medirse por unidad.

## Skills a usar (obligatorio)

- **`impeccable`** (frontend): rediseño de las cards de `/nutricion/registro` y ajuste de centrado en `/configuracion`. Respetar tokens existentes (`var(--card)`, `var(--accent-bright)`, etc.), shadcn/ui y lucide-react.
- **`playwright-cli`**: validar end-to-end (crear comida con varios alimentos, ver/borrar/editar en "Comidas de hoy", confirmar figura centrada).

---

## 1. Fix del bug de agregar alimento

**Archivo:** `app/lib/meal-logs.ts`

En `addMealLogItem` (líneas 198-240) incluir `meal_log_id` en el INSERT. Reusar el helper existente `ensureMealLogId({ userId, logDate })` (línea 126) que ya devuelve/crea el id del `meal_log` del día:

```ts
const mealLogId = await ensureMealLogId({ userId: args.userId, logDate: args.logDate });
// ...
.insert({
  meal_log_id: mealLogId,   // <- faltaba (NOT NULL)
  meal_id: args.mealId,
  food_id: args.foodId,
  grams,
  measure: args.measure,
  quantity: args.quantity,
})
```

**Mejora menor (opcional, recomendada):** en `RegistroClient.tsx:246` el `catch {}` traga el mensaje real. Propagar el mensaje del server (ej. `toast.error(error instanceof Error ? error.message : "No se pudo agregar el alimento.")`) para no volver a quedar ciegos ante errores de DB.

**Verificación:** crear comida → agregar alimento por gramos y por unidad → debe insertarse sin error y reflejarse en "Comidas de hoy" y en "Objetivo del día".

---

## 2. Rediseño de cards en `/nutricion/registro`

**Archivo principal:** `app/nutricion/registro/RegistroClient.tsx`. Acciones server ya existentes y reutilizables (`app/nutricion/registro/actions.ts`): `createMealAction({logDate,name})`, `addMealLogItemAction({logDate,mealId,foodId,measure,quantity})`, `deleteMealAction(mealId)`, `deleteMealLogItemAction(itemId)`.

### Card "Nueva comida" → constructor de comida
Convertir en un form que arma la comida completa antes de guardar:
- Input de **nombre**.
- Sub-sección "Alimentos de esta comida": selector de alimento + medida (g/unidad, según `canChooseUnit` actual, lógica en `RegistroClient.tsx:222-225`) + cantidad + botón "Agregar a la comida". Cada agregado va a una **lista local (draft, en memoria)**, permitiendo varios (incluido repetir el sub-form para sumar más).
- Lista editable del draft (quitar ítems antes de guardar).
- Botón "Guardar comida": ejecuta `createMealAction` (nombre) y luego, en secuencia, un `addMealLogItemAction` por cada ítem del draft usando el `mealId` devuelto. Al terminar, refresca `meals` con el último log y limpia el draft.
- Mantener cálculo de macros/preview reusando los campos de `Food` (`servingG`, `gramsPerUnit`, `calories`, etc.).

### Card "Comidas de hoy" → solo ver / borrar / editar
- Quitar el sub-form de "agregar alimento" que hoy vive en `MealCard` (líneas 310-347).
- Mostrar cada comida con sus alimentos y totales (lo ya existente, líneas 266-308).
- **Borrar:** comida entera (`deleteMealAction`, ya existe) e ítem individual (`deleteMealLogItemAction`, ya existe).
- **Editar (nombre + alimentos):** modo edición por comida que permita:
  - renombrar la comida → **requiere nueva action** `updateMealAction(mealId, name)` + función `updateMeal({ mealId, name })` en `meal-logs.ts` (UPDATE simple sobre `meal_log_meals.name`).
  - agregar alimentos a la comida existente (reusar `addMealLogItemAction`) y quitar (reusar `deleteMealLogItemAction`).

> Nota de scope: el sub-form de agregar alimento se mueve del MealCard al constructor "Nueva comida" y se reusa en el modo edición. No duplicar lógica: extraer el sub-form de alimento (selector + medida + cantidad + validación de `RegistroClient.tsx:233-251`) a un componente reutilizable dentro del mismo archivo.

**Archivos a tocar:** `RegistroClient.tsx` (reestructura de ambas cards), `app/nutricion/registro/actions.ts` (+`updateMealAction`), `app/lib/meal-logs.ts` (+`updateMeal`).

---

## 3. Centrar figura de porcentaje graso en `/configuracion`

**Archivo:** `app/configuracion/ConfiguracionClient.tsx` (línea ~129, render de `<BodyFatFigure .../>` dentro de `CardContent` con grid `sm:grid-cols-[minmax(0,1fr)_10rem]`).

La figura ocupa la 2ª columna y por defecto estira en su track. Centrarla horizontalmente pasando `className="justify-self-center"` (o `mx-auto`) al `BodyFatFigure` (acepta `className`, se aplica vía `cn(...)` en `app/components/shared/BodyFatFigure.tsx`). No tocar el interior del componente (ya usa `place-items-center`).

**Verificación:** en desktop y mobile la imagen queda centrada en su columna/stack.

---

## 4. Backfill de porción/unidad (grams_per_unit) realista

**Migración nueva** vía `apply_migration` (DDL/data one-shot), nombre sugerido `g26_foods_grams_per_unit_backfill`. UPDATE por nombre con valores realistas. Valores propuestos (g por unidad/porción):

| Alimento | g/unidad | Alimento | g/unidad |
|---|---|---|---|
| Huevo entero | 50 | Banana | 120 |
| Pechuga de pollo | 150 | Pan integral | 30 (rebanada) |
| Carne vacuna magra | 150 | Papa hervida | 150 |
| Atún al natural | 80 (lata) | Arroz blanco cocido | 150 (porción) |
| Yogur griego descremado | 150 (pote) | Avena | 40 (porción) |
| Almendras | 14 (puñado) | Aceite de oliva | 10 (cda) |
| Manteca de maní | 16 (cda) | Palta | 150 |
| Brócoli | 80 | Espinaca | 30 |
| Mix de ensalada | 50 | (`test` ya tiene 49) | — |

Solo actualizar filas con `grams_per_unit IS NULL` para no pisar datos existentes. `measure` se deja en `'g'` (default); el selector de unidad aparece igual porque `canChooseUnit` depende de `gramsPerUnit != null`.

**Opcional (evitar nulls futuros):** en el form admin (`app/admin/alimentos/FoodAdminClient.tsx`) `gramsPerUnit` ya es opcional; no se cambia salvo que se quiera default. Fuera de scope salvo pedido.

**Actualizar fuente de verdad:** anotar la migración en `docs/DATABASE.md` (sección foods) tras aplicarla.

---

## Orden de ejecución

1. Migración backfill (#4) — desbloquea opción de unidad.
2. Fix bug `meal_log_id` (#1) — desbloquea agregar alimento.
3. Centrado figura (#3) — cambio chico aislado.
4. Rediseño cards registro (#2) — el más grande; depende de #1.
5. `graphify update .` al cerrar.

## Verificación end-to-end (playwright-cli)

1. `/configuracion`: figura grasa centrada (desktop + mobile).
2. `/nutricion/registro`:
   - "Nueva comida": nombre + agregar ≥2 alimentos (uno por gramos, uno por unidad) al draft → "Guardar comida" → aparece en "Comidas de hoy" con macros correctas.
   - "Comidas de hoy": borrar un alimento, borrar comida entera, editar nombre, agregar/quitar alimento en una comida existente.
   - "Objetivo del día" refleja totales.
3. Confirmar que no aparece el toast "No se pudo agregar el alimento."

## Riesgos

- Reestructura grande de `RegistroClient.tsx`: cuidar no duplicar el sub-form de alimento (extraer componente reusable) y mantener el estado `meals` sincronizado tras guardar/editar.
- "Guardar comida" hace N requests secuenciales (1 create + N add-items): si falla a mitad, la comida queda parcial. Mitigación simple: crear comida, agregar ítems, y refrescar desde el último log devuelto; informar error por toast si algún add falla.
- Migración: filtrar `grams_per_unit IS NULL` para idempotencia y no pisar `test` (49) ni datos manuales.
