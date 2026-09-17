# Plan: rediseño mobile de /configuracion (A "Tu plan" + flujo de alta C)

## Context
`/configuracion` en mobile es una columna de 5 acordeones con el mismo peso:
- 2972px de scroll.
- Las kcal aparecen dos veces, una en un anillo siempre al 100%.
- Quedan restos violeta y labels de 10px.
- Sin perfil muestra `MOCK_PROFILE_DEFAULTS` como si fueran datos del usuario.

Es la ruta 9 de `docs/REDESIGN_DIRECTION.md` §7. El usuario aprobó el mock v2 (https://claude.ai/artifact/VX3CrPmQLQctJXyb3YohJr) con C-D1…C-D10 cerradas:
- **C-D1:** A "Tu plan" + C solo sin perfil.
- **C-D2:** un sheet por grupo.
- **C-D3:** stepper −/+.
- **C-D4:** carrusel de figuras de grasa.
- **C-D5:** hero con ecuación.
- **C-D6:** "Los fijo yo" dentro del sheet Objetivo.
- **C-D7:** sin MobileHeader.
- **C-D8:** borrar cuenta en bottom sheet (desktop sigue con dialog).
- **C-D9:** email en solo lectura.
- **C-D10:** desktop sin tocar.
- **Extra (hoy):** el flujo de alta tiene **6 pasos, con grasa**.

Resultado buscado:
- **Protagonista:** kcal objetivo en Display XXL, con la ecuación mantenimiento ± ajuste = objetivo y los macros.
- **Causas:** filas "Tu cuerpo / Actividad / Objetivo" que abren sheets (vaul).
- **Cuenta:** filas al pie.
- **Sin perfil:** hero "Calculá tu plan" y un flujo de 6 pasos.
- **Desktop:** idéntico al de hoy.

## Coordinación con otras sesiones (mismo árbol, en paralelo)
- **Dueños:**
  - `/catalogo` → mobile-routine-focus-redesign [1750d6], DESIGN §16.
  - `/nutricion/registro` → redesign-nutrition-mobile [f3581c], DESIGN §14.
  - `/alimentos` → DESIGN §13.
- **Mío:** DESIGN **§15**.
- **Archivos que toco varias sesiones** (MobileHeader.tsx, selector de padding-top en globals.css, línea de §6.1, contador "Progreso"): releer justo antes y sumar al lado con Edit exacto.
- **NumberStepper, SegmentedControl, use-media-query y `app/lib/number-input.ts`** son de [f3581c]. **Ya están en disco** (lint y tsc en verde, sin probar en pantalla). Los consumo y **no creo copias**. Si encuentro un bug, aviso a [f3581c] y lo arregla esa sesión.
  - `NumberStepper {value:number|null; onChange; step; min?; max?; unit?; label; size?: "m"|"l"; disabled?}`
  - `SegmentedControl {label; options; value; onChange; disabled?}`
- **No se toca** el WIP ajeno sin commitear de `app/components/rutinas/*` y `app/components/workout/*`. Por eso **no** extraigo nada de `SetFocus.tsx`.
- **Aviso previo** a los otros antes de `pnpm build`, `pnpm check` o `graphify update .`.
- **Dev de :3000:** es compartido y no es mío. No levanto otro.

## Enfoque
Un solo `ConfiguracionClient` sigue montando los dos árboles con estado compartido:
- **Mobile:** árbol nuevo `lg:hidden`.
- **Desktop:** `hidden lg:grid`, con el markup actual intacto.

La lógica sale a un hook y a un módulo puro, así ambos árboles usan las mismas reglas.

### F0 · Docs primero
- **`DESIGN.md` §15 "Configuración mobile (`/configuracion`, <1024px)":**
  - zonas Z1 Identidad · Z2 Plan · Z3 Cómo lo calculamos · Z4 Cuenta;
  - tabla de sheets S1–S6;
  - estados E1 sin perfil (flujo de 6 pasos), auto, E2 manual, E3 guardado/error/sin conexión;
  - reglas: emerald solo en el CTA de E1 y del flujo; el acento en selección y check de guardado.
- **Ubicación de §15:** insertarla después de §14 (si ya existe) y **antes** del bloque `---` + `## 16. Catálogo mobile`. El archivo es CRLF: respetar los finales de línea.
- **`DESIGN.md` §6.1:** sumar `/configuracion` a las rutas sin MobileHeader. La línea hoy dice "las cinco": releer y actualizar la cuenta.

### F1 · Lógica pura + hook (sin cambio visual)
- **`app/lib/profile-plan.ts`** (nuevo; importa tipos de `@/app/lib/nutrition-types`):
  - `ACTIVITY_COPY`, `GOAL_COPY`: copy corta de mobile aprobada en el mock ("Moderada · Ejercicio moderado 3–5 días", "Recomposición · Mismo peso, más músculo"). Desktop sigue con `ACTIVITY_LEVEL_INFO` / `GOAL_INFO`.
  - `formatAdjustment(adj)` → `"−20%"` (U+2212) / `"0%"` / `"+10%"`.
  - `bodySummary(input)`: usa `formatDecimal` de `app/lib/number-input.ts` ([f3581c]; no se duplica). → `"28 a · 178 cm · 78 kg · 22%"` o `"… · grasa sin dato"`.
  - `macroKcal(m)` y `macroSplit(m)` → porcentajes que suman 100 (resto mayor; todo 0 si el total es 0).
  - `parseManualTarget({kcal, proteinG, carbsG, fatG})`: se mueve tal cual desde `ConfiguracionClient.tsx:114-124`, mismos límites que el server (800–10000 kcal, 0–1500 g, coma decimal).
  - `checkManualTarget(t)` → `{ macroKcal, matches }`, con `matches = |macroKcal − kcal| ≤ 10%` (misma regla que `ConfiguracionClient.tsx:493`).
  - `activityLevelIndex(level)`.
- **`tests/unit/profile-plan.test.mjs`** (patrón de `recipe-nutrition.test.mjs`; corre con `pnpm test:unit` y alias vía `tests/helpers/register-alias.mjs`):
  - 2610 → −20% = 2088 con `calculateNutritionPlan`;
  - split 33/37/30;
  - suma manual 2195 coincide y 2645 no;
  - parse con coma y valores inválidos;
  - `formatAdjustment` en los tres signos.
- **`app/configuracion/useProfileForm.ts`** (nuevo). Mueve sin cambiar comportamiento:
  - el estado (`ConfiguracionClient.tsx:73-95`);
  - el autosave con debounce de 800 ms (L138-168);
  - `handleTargetModeChange`, `handleGenderChange` y el indicador de recálculo.

  Suma:
  - `autosavePaused` (true mientras el flujo de alta está abierto; desktop nunca lo activa);
  - `flush()`: guarda ya si hay cambios, se llama al cerrar cada sheet;
  - `retry()`;
  - `online` (evita guardar sin red y reintenta al volver, porque el efecto depende de `online`);
  - `completeSetup()`: guardado inmediato que devuelve una promesa;
  - `hasProfile = initialProfile !== null || setupDone`.

  Se mantiene el patrón actual del efecto, que hoy pasa `eslint` (verificado).
- **`app/components/configuracion/use-online-status.ts`:** `useSyncExternalStore` sobre los eventos `online`/`offline`, con snapshot de server = true. Sigue el patrón de `app/lib/workout-sync-queue.ts:65-78`.
- **`ConfiguracionClient.tsx`** pasa a usar el hook. Desktop sigue igual.
- **Verificación antes de F1:** captura base de desktop a 1280.
- **Verificación después de F1:** desktop idéntico y `pnpm test:unit` + `pnpm lint` en verde.

### F2 · Shell mobile
- **`app/configuracion/page.tsx`:**
  - la section pasa a `page-frame configuracion-frame content-start bg-[var(--background)] lg:bg-[radial-gradient(…actual…)]`;
  - el encabezado actual (kicker, H2 y copy) va dentro de `hidden lg:block`;
  - pasa `email={auth.user.email}` (existe en `AuthContext`, `app/lib/auth.ts:11-22`).
- **`app/globals.css:547-553`:** sumar `.configuracion-frame` al selector de padding-top (es CSS sin layer; `.home-safe-top` depende de ese padding).
- **`app/components/shared/MobileHeader.tsx:111-119`:** sumar `pathname === "/configuracion"`.
- **Árbol mobile en `ConfiguracionClient`:** `<div className="flex flex-col lg:hidden">` + `<div aria-hidden className="home-safe-top" />` + zonas.
  - Lo que hoy es solo mobile se borra: acordeón, mini card, fila de progreso y `bodyFatBodyCompact`.
  - Lo que hoy es compartido (card "Tu plan estimado", fila de cerrar sesión/borrar y Dialog) queda solo en desktop (`hidden lg:block`).
  - Se quitan los imports y derivados que quedan huérfanos: `Accordion*`, `Image`, `sectionStatus`, `completedCount`, `datosSuficientes`, `bodyFatSummary`, `dataSummary`, `bodyFatRef`.
  - `ToggleOption compact` se queda (desktop lo usa).

### F3 · Zonas y sheets (`app/components/configuracion/`)
**Reuso:**
- `Drawer*` (`app/components/ui/Drawer.tsx`) con la receta de `RoutineSwitcher.tsx:44-60`: `max-h-[85dvh]`, header a la izquierda, body `overflow-y-auto` y footer con `pb-[max(1.25rem,env(safe-area-inset-bottom))]`.
- `AnimatedNumber` / `tapFeedback` / `fadeScale` (`app/components/ui/motion.tsx`).
- Avatar de `HomeGreeting.tsx`.
- Título H2 de `HomeSectionHeader.tsx`.
- `MACRO_COLORS` / `MACRO_LABELS` (`app/lib/nutrition-style.ts`).
- `calculateNutritionPlan` (`app/lib/nutrition-calc.ts`).
- `BODY_FAT_REFERENCES` y las imágenes `/references/body-fat/{sexo}/{valor}.png`.
- `Input`, `Button`, y NumberStepper / SegmentedControl de [f3581c].
- Marcador con `layoutId` y flechas de teclado según `DayTabs.tsx`.

**Componentes:**
- **`ProfileSheet.tsx`:** shell común de sheet.
  - Drawer controlado, `DrawerTitle` a la izquierda y botón "Listo" (`DrawerClose`, ≥44px, `--accent-bright`).
  - `DrawerDescription` solo para lector de pantalla (`sr-only`).
  - Al cerrar llama `onClose` (→ `flush`).
- **`ProfileIdentity.tsx`** (Z1):
  - avatar 44px con inicial o ícono `User`;
  - nombre (H3) o la acción de texto "Agregá tu nombre" (→ S6);
  - email como caption;
  - `SaveIndicator`: `aria-live="polite"`; estados "Guardando…", "Guardado" (se va a los 2 s), "No se guardó · Reintentar" (botón → `retry`) y "Sin conexión" (`--warning`).
- **`PlanHero.tsx`** (Z2):
  - **Auto:** micro label "Tu objetivo diario", kcal en Display XXL (clase de `TodayHero.tsx:99`) + "kcal", ecuación de 3 celdas con separadores (`border-y`), macros en Metric M (`text-[1.75rem]`) con punto de color, barra de reparto de 6px con leyenda en mono y caption de "estimación".
  - **Manual (E2):** micro label "· fijado a mano", línea de suma (lime `--success` si coincide, ámbar si no) y "Calculado con tus datos daría N".
- **`PlanRows.tsx`** (Z3): filas de 72px.
  - **Tu cuerpo:** miniatura de la figura de grasa, o ícono si no hay dato, + `bodySummary`.
  - **Actividad:** medidor de 5 barras en tinta neutra + `ACTIVITY_COPY`.
  - **Objetivo:** `formatAdjustment`, o ícono lápiz en manual.
  - **En manual:** Objetivo primero y el resto con opacidad y "No cambia tu objetivo fijo".
- **`AccountRows.tsx`** (Z4):
  - Nombre (→ S6);
  - Email (solo lectura, si existe);
  - Cerrar sesión (`<form action="/auth/signout" method="post">`, única salida de la app);
  - Borrar cuenta (rose → S5).
- **`OptionList.tsx`:** `role="radiogroup"` con filas `role="radio"`, flechas ↑/↓, check emerald animado con `fadeScale`, y slots `lead` / `trailing`. Lo usan S3, S4 y los pasos 5–6 del flujo.
- **`ActivityMeter.tsx`:** 5 barras.
- **`BodyFatCarousel.tsx`:** `role="radiogroup"` horizontal con scroll-snap.
  - "No lo sé" + 5 figuras del sexo elegido, cajas de 120×150 con `next/image` (`sizes="120px"`, lazy).
  - Rango + nivel; la seleccionada con borde emerald.
  - Hace `scrollIntoView({inline:"center", block:"nearest"})` al abrir.
  - Descripción de la opción elegida + caption sobre la masa magra.
  - Items con `relative` (evita el overflow de `sr-only` visto en `/rutinas`).
- **S1 `BodySheet.tsx`:**
  - SegmentedControl Hombre/Mujer (→ `handleGenderChange`);
  - NumberStepper `size="m"`: edad 10–100 paso 1, altura 100–250 paso 1, peso 30–250 paso 0,5;
  - fila Grasa corporal → **vista interna** "Grasa corporal" en el mismo drawer (flecha atrás a "Tu cuerpo"), con `BodyFatCarousel`. Se usa una vista interna en vez de drawers anidados para evitar problemas de foco y scroll lock. Vuelve a "cuerpo" al cerrar;
  - línea "Tu objetivo: N kcal" en vivo.
- **S3 `ActivitySheet.tsx`:** `OptionList` con `ActivityMeter`.
- **S4 `GoalSheet.tsx`:**
  - `OptionList` con kcal por opción (`calculateNutritionPlan({...input, goal}).targetKcal`, en mono) + `formatAdjustment`;
  - SegmentedControl "Calculados / Los fijo yo" (→ `handleTargetModeChange`, que precarga con lo calculado);
  - en manual, `ManualTargetFields`: 4 `Input` con `inputMode="numeric"` (kcal a todo el ancho y 3 macros en fila) + nota inválida / coincide / no coincide (`parseManualTarget` / `checkManualTarget`).
- **S5 `DeleteAccountSheet.tsx`:**
  - el input "BORRAR" vive en el sheet;
  - `onConfirm` e `isDeleting` vienen de `ConfiguracionClient` (el mismo `handleDeleteAccount` que el Dialog de desktop);
  - botón rose `#be123c` deshabilitado hasta que coincida, más Cancelar.
- **S6 `NameSheet.tsx`:** `Input` con maxLength 40 y contador; guarda al cerrar o con Enter (`handleSaveName` actual).
- **Sin conexión:** los controles de los sheets reciben `disabled` + nota "Sin conexión: volvé a intentar cuando tengas red" (DESIGN §6.3).

### F4 · Estado sin perfil (E1) y flujo de alta
- **`SetupHero.tsx`:**
  - micro label "Tu objetivo diario", "Calculá tu plan" en Display XXL y "6 preguntas, un minuto. Con eso sacamos tus kcal y tus macros.";
  - CTA emerald "Empezar" de 56px en el flujo de la página;
  - sin Z3; Z4 visible.
- **`ProfileSetupFlow.tsx`:** reemplaza al árbol mientras está abierto; `autosavePaused=true`.
  - **Barra superior:** ✕ 44px (vuelve a E1 sin guardar), barra de 6 segmentos y `n/6` en mono.
  - **Pasos:**
    1. "Sobre vos": sexo + edad.
    2. "¿Cuánto medís?"
    3. "¿Cuánto pesás?"
    4. "Tu grasa corporal": `BodyFatCarousel` con "No lo sé" preseleccionado.
    5. "¿Cuánto te movés?": `OptionList`.
    6. "¿Qué buscás?": `OptionList` con kcal.
  - **Pregunta:** en Display XXL, con micro label "Paso n · …". NumberStepper `size="l"`.
  - **Navegación:** CTA emerald "Siguiente" (en el paso 6, "Calcular mi plan") **en el flujo, debajo del control** (sin dock fijo, como R-A/D-A) + "Atrás" en texto.
  - **Accesibilidad:** foco al título de cada paso (`tabIndex={-1}`).
  - **Al calcular:** `completeSetup()`. Si sale bien, `setupDone` = true, se cierra el flujo y aparece A con la cuenta de `AnimatedNumber`. Si falla, toast y queda en el paso 6. Sin red, el CTA queda deshabilitado con nota.

### F5 · Limpieza, docs de cierre y verificación
- **`scripts/validate-mobile.mjs:6`:** sumar `"/configuracion"` a `ROUTES` (lo recorre el loop de `ROUTES.slice(2)`).
- **`docs/REDESIGN_DIRECTION.md` §7:**
  - fila 9: ✅, mock, §15 y apps usadas;
  - checklist de la ruta 9 con decisiones y sub-ítems (sheets S1–S6, flujo de alta, borrar cuenta en sheet);
  - "Progreso": releer y +1.
- **`docs/codex/FILE_OWNERSHIP.md`:** fila "Configuración mobile".
- **`docs/codex/TEST_MATRIX.md`:** fila con `pnpm test:unit` + Playwright de estados.
- **`docs/codex/ROUTING_GRAPH.md:17`:** sumar los paths nuevos.
- **Cierre:** memoria del proyecto al día, `graphify update .` (avisando antes) y marcar la ruta.
- **Sin commit** salvo pedido explícito.

## Archivos
| Estado | Archivos |
|---|---|
| Nuevos | `app/lib/profile-plan.ts`, `tests/unit/profile-plan.test.mjs`, `app/configuracion/useProfileForm.ts`, `app/components/configuracion/*` (ProfileSheet, ProfileIdentity, PlanHero, PlanRows, AccountRows, OptionList, ActivityMeter, BodyFatCarousel, BodySheet, ActivitySheet, GoalSheet, DeleteAccountSheet, NameSheet, SetupHero, ProfileSetupFlow, use-online-status) |
| Modificados | `app/configuracion/page.tsx`, `app/configuracion/ConfiguracionClient.tsx`, `app/components/shared/MobileHeader.tsx`, `app/globals.css` (un selector), `scripts/validate-mobile.mjs`, `DESIGN.md`, `docs/REDESIGN_DIRECTION.md`, `docs/codex/{FILE_OWNERSHIP,TEST_MATRIX,ROUTING_GRAPH}.md` |
| Sin cambios | `actions.ts` (se usan las 3 actions tal cual), desktop, bottom nav, `SetFocus.tsx` |
| Temporal | `app/configuracion-preview-sin-perfil/page.tsx` (monta el cliente con `initialProfile=null` para E1). Se borra al final |

## Verificación
1. **Base:** captura de `/configuracion` a 1280 antes de F1, con Playwright y el login de la cuenta admin (bypass OTP con service role, ver memoria `admin_account`). Datos actuales del admin: hombre 28/178/78, grasa 22, moderada, recomposición, auto.
2. **Unit y lint:** `pnpm test:unit`, `pnpm lint`. Después `pnpm build` (o `pnpm check`), avisando antes a las otras sesiones.
3. **Playwright a 375, 390 y 430** (script propio en el scratchpad, dev :3000):
   - auto: jerarquía, sin overflow horizontal, nada debajo de la barra de estado;
   - cada sheet abre y cierra con "Listo", con Esc y tocando el overlay; el foco vuelve a la fila; stepper de peso ±0,5 → la kcal se recalcula y se guarda ("Guardando…" → "Guardado");
   - vista interna de grasa;
   - E2: pasar a "Los fijo yo", ver hero y suma, y **volver a Calculados** para restaurar;
   - E3 error: `page.route` que corta el POST de la server action → "No se guardó · Reintentar";
   - sin conexión: `context.setOffline(true)` → indicador y controles deshabilitados;
   - E1: ruta temporal → hero y los 6 pasos. El guardado final se prueba primero con la request cortada (camino de error) y después real con los **mismos valores del admin** (sexo/edad/altura/peso, grasa 22, moderada, recomposición), así el perfil queda igual. Se confirma con `execute_sql` de solo lectura en `supabase_gymcontrol`;
   - `reducedMotion: "reduce"`;
   - 0 errores de consola.
4. **Desktop a 1280:** comparar contra la base, tiene que ser idéntico.
5. **Mobile:** `VALIDATE_BASE_URL=http://localhost:3000 pnpm validate:mobile`.
6. **CSS global:** si el dev sirve `globals.css` viejo, verificar `.configuracion-frame` en un build de prod (`pnpm exec next start -p 3002`).
7. **Cierre:** borrar la ruta temporal, `git status` sin restos míos y `graphify update .` (avisando antes).

## Riesgos
- **Hook compartido con desktop:** una regresión rompe las dos vistas. F1 va sola y se valida contra la captura base.
- **Cambios en archivos compartidos por otras sesiones:** releer antes de cada Edit. Si llega un aviso de build o graphify, esperar.
- **NumberStepper y SegmentedControl de [f3581c] sin probar en pantalla:** si fallan, avisar a esa sesión y no parchearlos acá. El input del número (`data-metric-input`) queda fuera de la regla de 16px de globals.css; verificar en build si el dev sirve CSS viejo.
- **Cierre de sheet antes de 800 ms:** lo cubre `flush()` al cerrar.
- **Teclado de iOS sobre los inputs de S4 y S6:** verificar que vaul reposiciona. Si no, usar `repositionInputs` del Root.
- **Imágenes de referencia (~230 KB):** `sizes` + lazy en el carrusel.
