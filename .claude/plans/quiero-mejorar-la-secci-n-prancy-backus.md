# Mejora informe total de nutrición (mobile / PWA)

## Context

La pantalla `/nutricion/registro` (vista mobile/PWA) hoy se siente como un panel vacío
cuando el usuario todavía no registró comidas: el anillo de calorías muestra solo `0%`,
las cards de macros y comidas se ven "rotas/muertas", la racha en 0 no explica qué hacer,
y la frase motivadora habla de entrenamiento, no de nutrición. El objetivo es que la
sección comunique con claridad **qué consumí, qué me falta, cómo voy con macros y cuál es
la próxima acción**, manteniendo el estilo dark/neón actual. Cambios surgicales, no rediseño.

Toda la UI vive en un solo componente: `app/nutricion/registro/RegistroClient.tsx`.
Datos ya llegan por props desde `page.tsx` (`targetKcal`, `targetMacros`, `loggedDates`,
`initialMeals`). `totalKcal`/`totalMacros`/`streak` se computan client-side (líneas 105-115).

Decisiones confirmadas con el usuario:
- Botón de la card de calorías: **mantiene link a `/configuracion`**, solo se aclara intención.
- Frase motivadora: **rotar entre varias** frases de nutrición.
- Alcance: **mobile/PWA**, sin romper desktop (mismos cambios de copy/animación).

## Archivos a modificar

1. `app/nutricion/registro/RegistroClient.tsx` — todos los cambios de UI/copy/animación.
2. `app/lib/nutrition-style.ts` — `MACRO_LABELS.protein`: `"Proteína"` → `"Proteínas"`.
3. `app/components/ui/motion.tsx` — agregar componente `AnimatedNumber` (contador animado 0→valor),
   reutilizando el patrón `animate()` de framer que ya usa `ProgressRing.tsx`.

## Cambios por sección

### 0. Helper nuevo: `AnimatedNumber` (motion.tsx)
- Componente client que tween-ea de 0 (o valor previo) al valor actual con `animate()`
  de framer-motion, `duration ~0.6`, `ease easeOut` — mismo enfoque que `ProgressRing.tsx:28-39`.
- Props: `value: number`, opcional `className`. Redondea con `Math.round`.
- Se usa en kcal consumidas/restantes y números de macros.

### 1. Card de calorías (RegistroClient.tsx:358-394)
- Reescribir el grid de 3 columnas a una lectura explícita:
  - Columna izq: `<AnimatedNumber value={totalKcal}/>` + label **"kcal consumidas"** (en vacío: "0 kcal consumidas").
  - Centro: anillo. Cuando `totalKcal === 0`, el centro muestra **"0%"** chico + microcopy
    debajo del anillo "Sin registro aún" en lugar de solo `0%` aislado; cuando hay consumo,
    muestra el `%` animado (ya lo hace `AnimatedProgressRing`).
  - Columna der: `<AnimatedNumber value={Math.max(0, targetKcal-totalKcal)}/>` + **"kcal restantes"**.
- Agregar una línea/chip explícita **"Objetivo: {targetKcal} kcal"** (hoy "objetivo" es solo un
  label suelto bajo el número). Mantener jerarquía y tamaño actual.
- Botón: cambiar label a **"Editar objetivo"** (icono `Settings2`), sigue `Link href="/configuracion"`.

### 2. Macros (RegistroClient.tsx:396-434)
- Nombres unificados vía `MACRO_LABELS`: "Proteínas", "Carbohidratos", "Grasas"
  (solo cambia protein→plural en `nutrition-style.ts`).
- Estado vacío intencional: cuando `totalMacros` (los tres) === 0, mostrar microcopy
  **"Agregá una comida para ver tu distribución diaria de macros"** debajo de la fila de anillos,
  y dejar anillos/barras en estado neutro (no rotos). Mantener layout de 3 columnas.
- Con datos: animar barras con `AnimatedMacroBar` (ya existe en motion.tsx:105-116) en cascada
  (delay incremental por macro), y números con `AnimatedNumber`. Reemplazar la barra CSS plana
  de `RegistroClient.tsx:423-424` por `AnimatedMacroBar`.

### 3. Comidas de hoy (RegistroClient.tsx:436-470)
- Empty state nuevo: **"Todavía no registraste comidas hoy. Agregá tu primera comida para
  empezar a sumar calorías y macros."** con fade-in y un icono `UtensilsCrossed` tenue.
- Botón: **"+ Nueva comida"** (label más específico). Sin checks ni estados de completado
  (una comida agregada ya cuenta como consumida).

### 4. Constancia (RegistroClient.tsx:472-495)
- Con `streak === 0`: agregar línea accionable **"Registrá una comida hoy para iniciar tu racha."**
- Resaltar el día actual en la fila semanal: el círculo del día de hoy lleva un ring/borde de
  acento (aunque no esté logged), para ubicarse. Calcular índice de hoy = `(getDay()+6)%7`.
- Cuando hoy queda logged (primera comida del día), feedback visual: glow/pulse suave en el
  círculo de hoy (usar `GlowPulseWrapper` de motion.tsx o un pulse de framer).

### 5. Frase motivadora (RegistroClient.tsx:497-503)
- Reemplazar la frase de entrenamiento por **rotación** entre un pool de nutrición, p. ej.:
  - "Cada comida registrada te acerca a tu objetivo."
  - "La constancia pesa más que la perfección."
  - "Lo que medís, lo mejorás."
- Selección estable por día (índice derivado de `logDate`) para que no parpadee en re-render.
  Mantener el fondo gradiente/glow actual.

### 6. Animaciones (Framer Motion)
- Entrada de cards con stagger: envolver las 5 rows en `MotionSection` + cada row en
  `MotionDiv variants={fadeUp}` (helpers ya existen en motion.tsx). Mobile-first.
- Anillo de calorías: ya anima 0→% vía `AnimatedProgressRing` (sin cambios).
- Contadores kcal consumidas/restantes y números de macros: `AnimatedNumber`.
- Barras de macros en cascada: `AnimatedMacroBar` con delay incremental.
- Empty states: fade-in; CTA con glow sutil (clase/box-shadow de acento existente).
- Racha: glow/pulse en el día de hoy cuando queda logged.
- Al agregar comida: el estado `meals` ya se actualiza (setMeals); las animaciones de
  contador/anillo/barras re-disparan solas al cambiar el valor → transición suave sin lógica extra.

## Notas
- `MACRO_LABELS` se usa en otras vistas de nutrición; cambiar protein a "Proteínas" es
  consistente y deseado (verificar que no rompa layouts ajustados — es +1 carácter).
- No tocar el bottom navbar PWA ni el `MealCard`/drawer de alta de comida salvo el label del botón.
- Código muerto detectado (`NutritionTipCard`, `SummaryStat`, `TargetBar` en RegistroClient) —
  NO se elimina en esta tarea (fuera de alcance), solo se menciona.

## Verificación
1. `npm run lint` (o el linter del repo) sin errores nuevos en los archivos tocados.
2. Levantar la app y abrir `/nutricion/registro` en viewport mobile (PWA):
   - Estado vacío: ver "0 kcal consumidas", "Objetivo: N kcal", "N kcal restantes",
     microcopy de macros, empty state de comidas, frase de nutrición, "Registrá una comida
     para iniciar tu racha", día de hoy resaltado.
   - Verificar stagger de entrada y contadores animando desde 0.
3. Agregar una comida real (drawer "+ Nueva comida") y confirmar: kcal/restantes/macros/barras
   y anillo transicionan suave; el día de hoy en la racha hace pulse.
4. Revisar desktop (sm+) para confirmar que no se rompió layout (macros 3 col, comidas grid).
5. Usar Playwright/`$playwright-cli` para snapshot mobile + desktop tras los cambios visuales.
