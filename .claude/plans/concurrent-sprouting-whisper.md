# Plan: rediseño mobile de `/nutricion/registro` (<1024 px)

## Contexto

Ruta 6 de `docs/REDESIGN_DIRECTION.md` §7. A 390 px la pantalla actual son cinco cards del mismo peso. Además:
- registrar una comida exige un formulario largo;
- quedan restos del violeta viejo;
- hay textos de 7–10 px;
- la frase motivacional provoca scroll horizontal.

El usuario aprobó el mock v3: https://claude.ai/artifact/HqtexQwHqppi4B25Ujw7LE. Arriba va el **presupuesto de la dirección B** (medidor semicircular + 3 anillos de macros); debajo, **las comidas de la dirección C** (pestañas por comida + panel deslizable + CTA en línea).

Decisiones cerradas:

| ID | Decisión |
|---|---|
| N-D1 | B arriba + C abajo |
| N-D2 | La comida se crea sola con el primer alimento |
| N-D3 | El "+" agrega al toque y se puede deshacer |
| N-D4 | Selector de día en un sheet |
| N-D5 | Sin `MobileHeader` |
| N-D6 | Fuera la frase motivacional y la card de constancia |
| N-D7 | Sin las imágenes `meals/*.png` |
| N-D8 | Se abre en la primera comida sin registrar, con la etiqueta "Sigue" |
| N-D9 | El desktop queda idéntico |

Regla vigente: **nada fijo abajo** (el 2026-09-16 se rechazaron los docks flotantes). El CTA siempre va en línea, y hay un solo emerald por pantalla.

Resultado buscado: registrar en uno o dos toques desde el celular, con la misma gramática que `/` y `/rutinas`, y sin tocar el desktop.

## Coordinación con otras sesiones (mismo worktree)

- **Sesión de los docks.** Tiene cambios sin commitear en `app/components/rutinas/*`, `app/components/workout/*`, `DESIGN.md`, `docs/REDESIGN_DIRECTION.md` y `graphify-out/`.
  - **No se tocan esos componentes.**
  - En los docs solo se agrega lo nuestro, en ediciones puntuales.
  - Nunca `git add` de archivos ajenos ni cambios de rama. Commit solo si el usuario lo pide, con `git commit -- <paths>`.
- **Plan `/alimentos`** (`.claude/plans/expressive-strolling-penguin.md`, sin implementar):
  - Va a borrar `Food.imageUrl`: el código nuevo no lo lee.
  - Va a sumar `?alimento=` a esta ruta: `resolveInitialDiary` queda preparado para recibirlo, pero no se implementa acá.
  - Edita las mismas líneas de `MobileHeader.tsx` y `globals.css`.
- **Sesión `/catalogo` (implementando en paralelo, acuerdo por mensaje).**
  - Esa sesión toma **§13** de `DESIGN.md`; esta usa **§14** (o el siguiente libre al momento de escribir).
  - Las dos editan las mismas líneas de `MobileHeader.tsx` (lista de rutas sin header), `globals.css` (selector de frames sin header), `DESIGN.md` §2.1/§6.1, `REDESIGN_DIRECTION.md` §7 (contador) y las filas de `docs/codex/`. Regla: releer justo antes de editar, editar con cadenas exactas y sumar al lado de lo que haya agregado la otra.
  - **Antes de `pnpm build`, `pnpm check` o `graphify update .`: avisar a esa sesión y esperar su OK**, porque dos builds sobre el mismo `.next` se rompen.
  - No se toca `FilterPanel.tsx` ni los clientes de `/alimentos`, `/recetas` o admin.

## Arquitectura

`RegistroClient` sigue siendo **el único dueño** de `meals` y `foodList`, y renderiza los dos árboles (mismo patrón que `DayWorkoutClient`):

```
<div h-full lg:hidden> <section page-frame registro-frame relative isolate auto-rows-max content-start bg-[var(--background)]>
   <div flex flex-col> .home-safe-top + <RegistroMobile …/> </div></section></div>
<div hidden lg:contents> <section page-frame content-start (degradé violeta actual)> …JSX desktop actual… </section></div>
```

- **`page.tsx`**: se saca el `<section>` y se renderiza `<RegistroClient key={logDate}/>` directo. El parseo de `fecha`/`tipo`/`comida` no cambia.
- **Cambios en el desktop, solo por convivir con el árbol mobile:**
  - El drawer "Nueva comida" usa `open={isDesktop === true && newMealOpen}`. Hoy, con `?tipo=`, se abriría en mobile porque el portal ignora `lg:hidden`.
  - `scrollIntoView` solo corre si `isDesktop === true`.
  - Se quita `MobileHeaderBadgeSync`, que queda muerto.
  - Se borra el código muerto: `NutritionTipCard`, `getNutritionTip`, `SummaryStat`, `TargetBar`.
- **`useMediaQuery(query): boolean | null`** (nuevo, en `app/components/ui/use-media-query.ts`). Usa `useSyncExternalStore` y devuelve `null` en SSR e hidratación, así no aparece un sheet por un instante en desktop. Los sheets mobile se abren solo con `=== false` y el drawer desktop solo con `=== true`.
- **`RegistroMobile`** recibe:
  - datos: `meals`, `foods`, `recipes`, `frequentItems`, `target`, `loggedDates`, `logDate`, `todayKey`;
  - callbacks: `onMealsChange = setMeals`, `onFoodCreated`;
  - deep link: `{ mealId, mealType }`;
  - `sheetsEnabled` y `actions` (inyectables, para la ruta preview).
- **Mutaciones mobile en `useDiaryActions`:**
  - Una **cola serial** para todas las mutaciones. `afterMealId` se calcula al ejecutar la tarea desde `latestMealsRef`.
  - Un mapa `created` (destino → id de la comida creada) que sirve de candado contra comidas duplicadas.
  - Deshacer, más el manejo de errores.
  - Las acciones de desktop no se tocan.
- **Server action nueva `refreshMealLogAction({ logDate })`** en `actions.ts`. Es de solo lectura: valida `logDate` y devuelve el log. Se usa para recuperarse cuando llega un error de estado viejo ("Las comidas del día cambiaron…", "La comida ya no existe…").

## Fases

### F0 · Línea base (sin tocar código)
- Anotar `git status`.
- Correr `pnpm test:unit` y `pnpm lint` (hoy: 0 errores, 18 warnings).
- Capturas **desktop 1280×4000** con reduced-motion, más `main.outerHTML`, guardadas en el scratchpad. Casos:
  - hoy con comidas;
  - `?tipo=almuerzo` (drawer abierto);
  - `?comida=<id>`;
  - día pasado con datos;
  - día vacío.
- Captura del home a 390 (por `GoalSetupStep`).

### F1 · Lógica pura + tests (el desktop se comporta igual)
- **NUEVO `app/lib/meal-amounts.ts`.**
  - Se mudan desde `FoodPicker.tsx`: `PickerOption`, `getFoodGramsPerUnit`, `formatQuantity`, `parseQuantity`, `previewNutrition`, `describeOption`, `optionKcalLabel`.
  - Se muda desde `RegistroClient`: `formatItemAmount`.
  - Nuevas:
    - `resolveDefaultAmount(option, frequent)`: la misma regla que `FoodPicker.selectOption`.
    - `convertQuantity(q, to, gramsPerUnit)`.
    - `quantityStep(measure, unit)`: g 10 · ml 50 · u/porción 0.5.
    - `stepQuantity(q, dir, step)`: nunca baja de `step`.
    - `validateAmount`: mismos límites que el server (>0, ≤10 000, ≤50 000 g).
    - `previewItemNutrition(item, grams)`: escala el ítem congelado.
    - `amountToGrams`, `toMealItemInput`, `measureLabels`, `optionKey`.
  - Solo importa módulos sin imports (`nutrition-types`) y los tipos con `import type`.
- **NUEVO `app/lib/meal-diary.ts`.**
  - `buildDiaryDay(meals)` → `{ tabs, nextKey, closed, panelKeys }`.
    - Usa `buildDayMealRows`.
    - Estados de pestaña: `logged`, `next`, `pending`, `empty`.
    - Pendiente = tipo por defecto sin ítems (slot vacío o comida con 0 ítems).
    - Día cerrado → antepone el panel `"resumen"`.
    - Nombres duplicados → sufijo " 2".
  - `sumDay(meals)`.
  - `resolveBudget(target, consumed)` → `no_profile | under | on_target | over`. `on_target` = restante entre 0 y 5 % del objetivo; los macros guardan restante y exceso.
  - `resolveAfterMealId(meals, type)`: misma regla que la ubicación de desktop.
  - `AddTarget` = `meal | slot | new`, con `targetKey`, `targetLabel` y `resolveTargetMeal(target, meals, created)`.
  - `resolveInitialDiary(meals, { mealId, mealType })` → `{ selectedKey, addTarget }`. Con `tipo=snack` y sin snack → destino `new` {Snack, snack}.
  - `resolvePanelSelection(panelKeys, previous, ctx)`: la selección sigue por clave; si se borra, cae en `empty-<tipo>` o en el índice más cercano.
  - `findCreatedMeal`, `findAddedItem`.
  - `resolveUndo(meals, record)`: borra la comida solo si la creó ese agregado y sigue teniendo ese único ítem; si no, borra el ítem.
  - `resolveTypeChange(meal, next)`: el nombre sigue al tipo si era el nombre por defecto.
  - Se mudan desde `RegistroClient`: `calculateStreak` y `withCurrentDay`.
  - `buildWeekStrip({ weekStart, todayKey, minKey, selectedKey, logged })`.
  - Formatos: `formatDayHeader`, `formatMealMeta`, `formatEmptyMeta` (tiempo pasado en días anteriores), `formatMealFoods`, `titleScale`. Usan arrays fijos de días y meses, no `Intl` (evita desfases de hidratación).
- **NUEVOS tests** `tests/unit/meal-amounts.test.mjs` y `tests/unit/meal-diary.test.mjs`, con el estilo de `meal-order.test.mjs`. Casos mínimos:
  - día vacío / en curso / cerrado / cerrado con snack vacío;
  - comida con 0 ítems;
  - orden manual `[cena]`;
  - borde del 5 %, exceso de macros;
  - la comida creada ocupa el índice de su slot;
  - deep links (`comida` inexistente, `tipo` con 2 comidas, snack);
  - selección tras borrar, reordenar o anteponer el resumen;
  - `resolveUndo` en sus 4 casos;
  - `formatItemAmount` idéntico al actual.
- **EDITAR `FoodPicker.tsx` y `RegistroClient.tsx`**: re-apuntar imports; `selectOption` pasa a usar `resolveDefaultAmount`.
- Gates: `pnpm test:unit`, `pnpm lint` (≤15 warnings), `pnpm exec tsc --noEmit`.

### F2 · Shell (al cerrar, el desktop tiene que coincidir con F0)
- **`app/globals.css`**
  - L81-88: `input:not([type="hidden"], [data-metric-input])`. Así los números Metric grandes no quedan en 16 px. Se documenta: un input con ese atributo siempre mide ≥16 px.
  - L546-553: sumar `.registro-frame`.
- **`app/components/shared/MobileHeader.tsx`** L111-119: sumar `pathname === "/nutricion/registro"`.
- **NUEVO** `app/components/ui/use-media-query.ts`.
- **`page.tsx` y `RegistroClient.tsx`**: los cambios de "Arquitectura".
- **NUEVO** `app/components/registro/RegistroMobile.tsx`, solo con el encabezado.

### F3 · Zonas
Componentes nuevos en `app/components/registro/`:
- **`DiaryHeader`**
  - Botón "Hoy ▾ · mié 16", con el estilo de `RoutineSwitcher`.
  - Pill de racha como en `HomeGreeting`, con texto "N días" y sr-only "días de racha de nutrición". Solo si la racha es > 0. En días pasados lo reemplaza "Volver a hoy".
  - Botón redondo ≡ de 44 px que abre "Tu día".
- **`BudgetBlock`**
  - `ArcGauge` con `AnimatedNumber` (~46 px), la fila "Comiste · Objetivo" y 3 `AnimatedProgressRing` (`trackColor var(--card-alt)`, `MACRO_COLORS`).
  - Cada anillo muestra los gramos restantes, o "+Xg de más" en `--warning`.
  - Colores del estado: `on_target` en `--success` y `over` en `--warning`.
  - Resumen sr-only.
  - `no_profile` → `GoalSetupStep`.
- **`MealTabs`**
  - Mismo patrón que `DayTabs`: tablist, roving tabIndex, ←/→/Home/End, marcador con `layoutId` (duración 0 si hay reduced-motion).
  - El scroller lleva `layoutScroll`. Entran 4 pestañas a lo ancho; con más, se asoma la 5ª (ancho `/4.35`).
  - Línea de estado: check + kcal, "Sigue" o "—".
- **`useDiaryPager`**
  - Selección por clave (patrón de estado previo permitido por el lint del React Compiler), `goTo`/`follow`.
  - Scroll-snap como `RoutineWeekView`: guard `mounted`, `useLayoutEffect` de alineación, timer de 90 ms, `inert`/`aria-hidden`.
  - `ResizeObserver` para que el alto siga al panel activo, con `overflow-y-hidden`.
- **`MealPanel`**
  - Título XXL: `text-[clamp(2.25rem,10.5vw,2.75rem)] … uppercase [overflow-wrap:anywhere] line-clamp-3`, con escala `xl` para nombres largos. Botón "…" en toda comida real.
  - Meta ("780 kcal · P 52 · C 75 · G 22", o la meta de pendiente).
  - CTA: emerald (`h-14 rounded-2xl`) solo si la pestaña es `next`; si no, neutro con las clases de `DayAction`.
  - Filas de ítem (≥60 px, cantidad en mono) que abren el `ItemSheet`.
  - En pendientes: `FrequentRows` con "Buscar".
- **`FrequentRows`**: "+" de 44 px con `aria-label` "Agregar {cantidad} de {nombre}".
  - La lista es una copia de `frequentItems` tomada al montar, para que no se reordene bajo el dedo.
  - Recuerda la última cantidad usada en la sesión.
- **`DayClosedPanel`**: "Día cerrado" en XXL, meta, una fila por comida y "Otra comida" neutro.
- **`useDiaryActions`**: lo descrito en "Arquitectura", más:
  - `pending` para mostrar `LoadingDots`;
  - errores: sin conexión → "Sin conexión: no se guardó."; error de estado viejo → toast + `refreshMealLogAction`.

Otros cambios:
- **NUEVO `app/components/ui/ArcGauge.tsx`**: semicírculo con `motion.path` y `pathLength`. Con reduced-motion la duración se pone en 0 a mano, porque `MotionConfig` no cubre `pathLength`. Opacidad 0 cuando el valor es 0.
- **NUEVO `app/components/shared/GoalSetupStep.tsx`**: se muda tal cual el bloque sin perfil de `HomeNutrition` y `HomeNutrition` pasa a usarlo con el mismo texto. El home debe quedar igual.
- **`actions.ts`**: `refreshMealLogAction`.

### F4 · Sheets
Todos son controlados, montados con `open={sheetsEnabled && …}`. El contenido se conserva hasta `onAnimationEnd(false)`.
- **NUEVO `ui/SegmentedControl.tsx`**: radiogroup con el look de `MuscleAnatomy`, flechas y `layoutId`.
- **NUEVO `ui/NumberStepper.tsx`**: botones de 44 px como `SetFocus`. El input lleva `data-metric-input`, `inputMode="decimal"`, `text-[3rem]` y selecciona el texto al enfocar.
- **`registro/sheet-guards.ts`**: en `onPointerDownOutside`/`onInteractOutside`, si el toque cae en `[data-sonner-toaster]`, llama `preventDefault`. Así tocar un toast no cierra el sheet. Si hiciera falta, el Toaster suma `pointer-events:auto`.
- **`AmountEditor`**: segmentado g/ml ↔ u/porciones (solo si hay unidad; convierte el número), `NumberStepper`, preview y "Te quedarían N kcal" (tiempo pasado en días anteriores).
- **`AddFoodSheet`** (`h-[min(85dvh,44rem)]`). Pasos: `search` → `quantity` → `create`.
  - `search`:
    - input de 16 px con `enterKeyHint="search"` y `useDeferredValue`, sin autofocus;
    - segmentado Frecuentes / Recetas / Mis alimentos, cada uno con su estado vacío;
    - al escribir: `searchByName` con el boost de `FoodPicker` (límite 20).
  - Cada fila:
    - el "+" agrega al toque;
    - tocar el nombre lleva a `quantity`;
    - "Crear “q”" abre `FoodForm variant="inline"` y después lleva a `quantity`.
  - Footer `aria-live`: "N agregados · K kcal", "**Deshacer**" del último agregado y "Listo".
  - Adentro del sheet, deshacer vive en ese footer. Afuera, el "+" de los frecuentes del panel usa toast con acción "Deshacer" (6 s, se descarta al desmontar).
  - Header "Agregar a {comida}". El destino se mantiene: `slot`/`new` pasan a la comida creada vía el mapa `created`.
- **`ItemSheet`**: `AmountEditor` con la cantidad actual y preview con `previewItemNutrition`.
  - "Guardar" → `updateMealItemAction`.
  - "Quitar" pide confirmación en línea. Si es el único ítem, el texto avisa que se borra la comida y llama `deleteMealAction`. Después el foco vuelve a la pestaña.
- **`MealMenuSheet`**:
  - Renombrar en línea (patrón `MyRoutinesList`, `maxLength 60`, Enter guarda). Esc cancela sin cerrar el sheet: `onEscapeKeyDown` con `preventDefault` mientras se renombra.
  - Chips de tipo con `resolveTypeChange`.
  - ↑/↓ con `moveMealAction`, deshabilitados en los extremos.
  - Eliminar con confirmación en línea.
- **`DaySheet`** ("Tu día"):
  - Una fila por pestaña (nombre, alimentos, kcal) que lleva a esa pestaña.
  - "Otra comida" abre un paso con nombre (por defecto "Snack") y chips de tipo (por defecto snack). Al terminar de cerrarse, abre `AddFoodSheet` con destino `new`: nunca dos drawers a la vez.
- **`DayPickerSheet`**:
  - `buildWeekStrip` con 7 círculos de 38 px estilo `HomeWeekStrip`: emerald = registrado, blanco = seleccionado, deshabilitados los futuros y los anteriores a hoy−365.
  - ‹ › para cambiar de semana.
  - "Otra fecha": `input type=date` transparente con `showPicker`.
  - Navega con `startTransition(router.push)`; hoy va sin `?fecha`.

### F5 · Deep links, estados y pulido
- **Deep links** (`?tipo=`, `?comida=`, solo hoy): seleccionan su pestaña y abren `AddFoodSheet` solo en mobile.
- **Pase de accesibilidad**:
  - `DrawerTitle` en cada sheet;
  - foco al `h2` del panel cuando cambia su forma;
  - labels de stepper del tipo "Restar 10 g";
  - `aria-live` en el footer.
- **Pase de reduced-motion.**
- **Ruta TEMPORAL `app/registro-preview/`** (`page.tsx` con `notFound()` fuera de development, más `PreviewClient.tsx` con fixtures y `actions` falsas), manejada por `?estado=`. Estados:
  - `no_profile`, `under`, `on_target`, `over`;
  - vacío hoy, vacío pasado, día cerrado;
  - 7 pestañas con nombres repetidos, nombre de 60 caracteres, snack con 0 ítems;
  - bebida en ml, receta, sin frecuentes.
  - **Se borra antes del build final.**

### F6 · Verificación, limpieza y docs
Ver "Verificación". Después:
- **`DESIGN.md`**:
  - sección nueva §14, o la siguiente libre (zonas, estados, sheets, reglas: un emerald, nada fijo abajo, N-D1…N-D9, link al mock);
  - §6.1: sumar la ruta a las que no tienen header;
  - §2.1: excepción `data-metric-input`.
- **`docs/REDESIGN_DIRECTION.md` §7**: fila 6 ✅, progreso actualizado, checklist de la ruta 6 con decisiones y sub-ítems.
- **`docs/codex/FILE_OWNERSHIP.md`**: fila nueva "Registro de comidas mobile".
- **`docs/codex/TEST_MATRIX.md`**: fila nueva con los flujos mobile.
- **`docs/codex/ROUTING_GRAPH.md`** L16: sumar `?comida=`, `app/components/registro/` y las dos libs.
- Memoria del proyecto y `graphify update .`
- Sin commit salvo pedido explícito.

## Casos borde (resumen)

- **Día pasado:**
  - los deep links se ignoran;
  - los textos van en pasado;
  - la tira semanal solo marca los últimos 70 días (límite de `getLoggedDatesForUser`).
- **Varias comidas del mismo tipo:** una pestaña cada una; `?tipo=` elige la última.
- **Comida con 0 ítems:** layout de pendiente, con "…".
- **Snack o nombre propio vacío:** muestra "—" y no recibe "Sigue".
- **Receta archivada:** al agregar muestra el error del server y se oculta en la sesión; editar un ítem existente sigue funcionando (usa el snapshot).
- **Rotación que cruza 1024 px:** los sheets mobile se cierran.
- **Racha:** misma regla que hoy (0 hasta registrar algo hoy).
- **Día cerrado:** sin emerald (aprobado en el mock).
- **Sin swipe sobre el presupuesto** para cambiar de día: N-D4 aprobó solo el sheet.

## Fuera de alcance (se reporta al cierre)

- **Bug verificado en `/rutinas/dia`.** Los números de `SetFocus` se ven en 16 px en vez de 48 px por la misma regla de 16 px. Sumarles `data-metric-input` no alcanza: a 375 px "22.5 kg" no entra entre los botones. Necesita su propio ajuste, en archivos de la otra sesión.
- **Toaster sin `theme="dark"`** (se ve con el tema claro por defecto de sonner): preexistente.

## Verificación

1. **Gates:** `pnpm test:unit`, `pnpm lint` (0 errores), `pnpm exec tsc --noEmit`, `pnpm build` (con la ruta preview ya borrada y **después de coordinar con la sesión `/catalogo`**).
2. **Paridad desktop.** Repetir las capturas de F0 a 1280×4000 y comparar píxeles (script en el scratchpad con `playwright` + `sharp`) y `outerHTML`: solo puede cambiar el wrapper. Con `?tipo=` el drawer desktop abre igual que antes y no hay sheet mobile en el DOM.
3. **Mobile en la ruta preview** a 375×667, 375×812, 390×844 y 430×932: todos los estados de F5, más el home a 390 sin cambios.
4. **E2E real con la cuenta admin** (OTP como en `validate-mobile.mjs`). Los flujos destructivos corren en `?fecha=<hoy−300>`; en hoy, solo deep links y un agregado seguido de Deshacer. Flujos:
   - "+" frecuente → comida creada en su lugar → Deshacer (toast);
   - sheet: buscar → unidades → stepper → agregar → Deshacer en el footer → Listo;
   - "Crear “x”";
   - editar y quitar ítem (el último borra la comida);
   - renombrar con Enter / Esc;
   - cambiar tipo, ↑/↓, eliminar;
   - Tu día → pestaña; Otra comida;
   - selector de día (semana y otra fecha);
   - día cerrado;
   - `?tipo=cena` y `?comida=` a 390 (abre el sheet) y a 1280 (no abre nada);
   - offline (`context.setOffline`);
   - reduced-motion.
   - Limpieza de los datos de prueba por la UI.
5. **Consola y desborde:** 0 errores de consola (incluida la hidratación) y `scrollWidth ≤ innerWidth` en todos los anchos.
6. **Script móvil:** `VALIDATE_BASE_URL=http://localhost:3000 pnpm validate:mobile`.
7. **CSS en build de producción:** `pnpm exec next start -p 3002` (el dev puede servir CSS viejo). `[data-metric-input]` debe medir 48 px y el resto de los inputs 16 px a 390.
8. **Reporte final:** qué quedó para probar en un iPhone real (teclado en sheets, date picker, safe areas), más los hallazgos fuera de alcance.
