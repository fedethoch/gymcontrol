# Mejora mobile de `/configuracion` (perfil nutricional)

## Context

La pantalla mobile `/configuracion` se siente como un formulario largo: header genérico "Tu perfil", secciones colapsables sin resumen ni feedback de completitud, sección de grasa corporal que ocupa demasiado y un bloque de estimación que parece roto. El usuario no ve el impacto de sus datos en el plan sin scrollear hasta el fondo.

Objetivo: que la vista mobile se sienta como un **perfil nutricional inteligente** — datos guiados, headers con resumen + check, mini-resumen del plan arriba, desglose claro abajo, y feedback de guardado. Sin rehacer la UI ni tocar la lógica de cálculo. Estilo dark/neón actual se mantiene.

**Decisiones tomadas:**
- Alcance: **solo mobile** (bloque `Accordion lg:hidden` + card de plan). Desktop (`hidden lg:grid`) queda intacto.
- Guardado: **auto-save existente sin cambios**. Solo se *muestra* el `profileSaveStatus` que ya existe pero hoy no se renderiza (no cambia comportamiento).

## Archivo principal

`app/configuracion/ConfiguracionClient.tsx` — único archivo de UI a tocar. Toda la lógica vive acá.

Sin cambios en: `nutrition-calc.ts`, `nutrition-types.ts`, `actions.ts`, `nutrition-profile.ts`, `motion.tsx`, `ProgressRing.tsx`. Se **reusan** sus exports.

## Lógica nueva (computada, sin estado extra salvo lo indicado)

Dentro del componente, derivar con `useMemo`:

1. **Completitud por sección** (`sectionStatus`):
   - `cuenta`: `displayName.trim().length > 0`
   - `datos`: `age && heightCm && weightKg` (todos > 0)
   - `grasa`: `bodyFatPct !== null` (opcional — no bloquea "datos suficientes")
   - `actividad`: siempre seleccionada (tiene default) → completa
   - `objetivo`: siempre seleccionado → completo
   - Contador: `Perfil X/5`. `datosSuficientes = cuenta && datos` (los demás tienen default) → badge "Datos suficientes para calcular tu plan".

2. **Resúmenes de header** (string por sección), reusando `GOAL_INFO[goal].label`, `ACTIVITY_LEVEL_INFO[activityLevel].label`, `BODY_FAT_REFERENCES`:
   - cuenta: `displayName || "Sin nombre"`
   - datos: `${age}a · ${heightCm}cm · ${weightKg}kg`
   - grasa: ref activa `${label} ${range}` o `Estimado`
   - actividad: `ACTIVITY_LEVEL_INFO[activityLevel].label`
   - objetivo: `GOAL_INFO[goal].label`

3. **Desglose del plan** (reusa `plan` ya calculado + constantes):
   - `Mantenimiento estimado: ${plan.maintenanceKcal} kcal`
   - `Objetivo aplicado: ${signo}${plan.targetKcal - plan.maintenanceKcal} kcal` (0 → "Sin ajuste")
   - Etiqueta según `goal`: bulk→"Superávit moderado aplicado", cut→"Déficit aplicado", recomp→"Mantenimiento".

4. **"Recalculando…"**: pequeño estado `isRecalculating` (un `useState` + `useEffect` que lo prende al cambiar `profileSignature` y lo apaga ~500ms después con timeout). Solo visual.

## Cambios visuales (mobile, dentro del bloque `lg:hidden` y la card de plan)

### A. Header mobile (nuevo, encima del Accordion, `lg:hidden`)
- Título "Tu perfil nutricional".
- Subtítulo corto: "Completá tus datos para calcular calorías y macros personalizados."
- Fila de progreso: dots `●●●●○` + "Perfil X/5" + badge violeta "Datos suficientes" (con check) cuando aplica.

### B. Mini-card "Plan actual" (nueva, encima de las secciones, `lg:hidden`)
- Ring chico (size ~64) con `AnimatedNumber` de `plan.targetKcal` + label objetivo (`GOAL_INFO[goal].label`).
- Línea macros: `P {proteinG}g · C {carbsG}g · G {fatG}g` con `MACRO_COLORS`.
- Chip de guardado: lee `profileSaveStatus` → "Guardando…" / "Guardado ✓" / "Error". Fade con `AnimatePresence`/`fadeScale`.

### C. Headers de Accordion con resumen + check
- Pasar children ricos a `AccordionTrigger`: título + `<span>` resumen tenue + icono check (lucide `Check`) cuando la sección está completa. `AccordionTrigger` ya renderiza chevron con rotación — no se toca.

### D. Sección grasa corporal — compactar
- Reemplazar lista de `ToggleOption` con descripciones largas por **chips compactos** (botón con solo `label · range`, sin description). Reusar/ajustar `ToggleOption` con prop `compact` (oculta description).
- Mostrar la **descripción completa solo de la opción activa** debajo de los chips (un `<p>` derivado).
- `BodyFatFigure` se mantiene pero más chico / al costado.
- Bloque estimación: mini-card terminada en vez de "?":
  - Si `bodyFatPct !== null`: "Grasa estimada: {bodyFatPct}% aprox. · {label}".
  - Si `null`: "Estimada con peso, altura, edad y sexo" (sin "?").

### E. Datos básicos
- Mantener edad/altura/peso.
- Relabelar "Género" → "Sexo (para estimación calórica)" con micro-ayuda.
- Feedback inline "Datos completos ✓" cuando `sectionStatus.datos`.

### F. Actividad — compactar
- `ToggleOption` en modo compacto: label corto (Sedentario/Ligera/Moderada/Alta/Muy alta) + 1 línea. Activo con borde/fondo violeta (ya existe) + glow breve.

### G. Objetivo — conectar con plan
- Bajo las opciones, línea derivada: "Superávit moderado aplicado" / "Déficit aplicado" / "Mantenimiento" según `goal`.

### H. Card "Tu plan estimado" (mobile) — desglose
- Encima de los macros, lista compacta: `kcal objetivo` (ya está) + `Mantenimiento estimado` + `Objetivo aplicado ±X`.
- `AnimatedNumber` en kcal objetivo y en gramos de cada macro.
- Macros con `AnimatedMacroBar` (reemplaza el `transition-[width]` plano actual, L381-386) para entrada en cascada (delay incremental).
- Texto final: "Este plan se actualiza cuando modificás tus datos."
- Mientras `isRecalculating`: chip "Recalculando plan…".

## Animaciones (Framer Motion, reusando `motion.tsx`)

| Interacción | Helper |
|---|---|
| Accordion expand + chevron | ya en `Accordion.tsx` (sin cambios) |
| Select de opción (borde/fondo + glow violeta breve) | `motion.button` con `whileTap={tapFeedback}` + transición de `boxShadow` |
| kcal / macros tween al nuevo valor | `AnimatedNumber` |
| Macros en cascada | `AnimatedMacroBar` con `delay` incremental |
| "Recalculando…" / chip guardado | `AnimatePresence` + `fadeScale` |

No tocar el bottom navbar PWA.

## Verificación

1. `npm run lint` y `npx tsc --noEmit` (o el check del repo) — sin errores nuevos.
2. Levantar app, login con credenciales de `.env.local`, ir a `/configuracion` en viewport mobile (375px) con Playwright/`$playwright-cli`:
   - Header "Tu perfil nutricional" + progreso visible sin scroll.
   - Mini-card "Plan actual" arriba con kcal + macros.
   - Cambiar peso → ver "Recalculando…", kcal/macros animan al nuevo valor, chip "Guardado ✓".
   - Headers de accordion muestran resumen + check; colapsar/expandir suave.
   - Grasa corporal compacta, sin "?" roto; descripción solo del activo.
   - Objetivo muestra "Superávit/Déficit aplicado".
3. Confirmar desktop (`lg`) **sin cambios** respecto a hoy.
4. `graphify update .` al terminar.

## Riesgos

- `AccordionTrigger` debe aceptar children ricos sin romper el chevron — verificar al implementar (probable que sí, ya renderiza `{children}` + chevron).
- Dots de progreso y "datos suficientes" dependen de defaults mock → confirmar que no marquen falso-completo engañoso (criterio: cuenta + datos reales).
- Diff acotado a un archivo; no introducir estado redundante (reusar `plan`, `profileSaveStatus` existentes).
