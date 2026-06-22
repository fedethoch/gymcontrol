# Plan — Mejorar pantalla de ejecución del día (`/rutinas/dia`)

## Context

La pantalla `/rutinas/dia?savedRoutineId=…&day=…` es donde el usuario ejecuta y registra
el entrenamiento del día. Hoy se siente como "una lista con inputs": header poco accionable,
acordeones con inputs vacíos sin guía, tabla de series fría, sin timer de descanso y con
errores de acentuación ("Dia", "Completa", "Mas"). Objetivo: que se sienta como una
experiencia de entrenamiento en vivo, guiando serie por serie, **sin rehacer la UI** —
mantener el estilo dark/neón violeta actual.

### Decisiones del usuario (acotan el alcance — confirmadas)
- **Estado por serie:** mantener como ahora. No hay migración ni columna nueva. La completitud
  persistida sigue siendo **por ejercicio** (`is_completed`, autosave existente). Cualquier
  "x/4 series" es **derivado visual** (series con reps+peso cargados), sin estado nuevo persistido.
- **RIR real:** dejar como está. RIR sigue siendo solo **objetivo/referencia**, sin input nuevo
  ni columna.
- **Bottom nav:** dejar como está. No se oculta ni se reemplaza por barra contextual. Único
  ajuste permitido: **padding inferior** para que la nav no tape inputs/contenido (usabilidad).

Esto reduce el trabajo a: claridad visual, copys, guía de UX dentro del modelo de datos actual,
animaciones, timer de descanso client-only y padding. Todo concentrado en
`app/rutinas/dia/DayWorkoutClient.tsx`.

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `app/rutinas/dia/DayWorkoutClient.tsx` | Núcleo: copys, header/resumen accionable, cards con guía, tabla de series mejorada, timer de descanso, padding, animaciones |
| `app/components/shared/MobileTabBar.tsx` | Solo typo `"Mas"` → `"Más"` (label + aria-label). Sin cambios de tamaño/posición/comportamiento |
| `app/lib/utils.ts` (o helper local en el client) | Pequeño `parseRestSeconds(rest: string)` — reutilizar archivo de utils existente |

No se toca: `page.tsx`, `actions.ts`, `workout-tracking.ts`, DB, ni el montaje de la nav en `layout.tsx`.

## Reutilizar lo existente (no crear nuevo)
- `motion` + `AnimatePresence` de `framer-motion` (ya importados en el archivo).
- `AnimatedProgressRing` (`app/components/ui/ProgressRing.tsx`) — ya en uso para el anillo.
- Helpers `splitSeriesValues` / `joinSeriesValues` / `isAtOrAboveMaxReps` (ya en el archivo).
- `Badge`, `Button`, `Input`, `cn` (ya importados).
- Patrón de autosave (`scheduleAutosave`, `completedByItemId`) intacto — no cambia la lógica de guardado.

---

## 1) Copys (acentos)
En `DayWorkoutClient.tsx`:
- L271: `Dia ${dayOrder} - ${dayName}` → `Día ${dayOrder} · ${dayName}`
- L274: `Completa tu entrenamiento…` → `Completá tu entrenamiento de hoy y registrá tu rendimiento`
- L349: `Progreso del dia` → `Progreso del día`
- L458-459 tip: `Proba` → `Probá`, `proxima` → `próxima`
- L483-487 empty state: `Este dia`, `mostrara`, `permitira`, `sesion` → acentos correctos
En `MobileTabBar.tsx`: L109 `aria-label="Mas"` y L139 `Mas` → `Más` (solo texto).

## 2) Header + resumen superior (más útil y accionable)
- Mantener "Semana activa" + título del día.
- Reemplazar la métrica estática del resumen mobile por copy claro:
  - `{completedCount} de {rows.length} ejercicios completados`
  - `~{rows.length * 10} min` estimado + `{rows.length} ejercicios` (mantener el cálculo simple actual).
- **Texto contextual** derivado del estado (nuevo `useMemo`):
  - Sin progreso → `Empezá registrando tu primera serie`
  - En curso → `Próximo: {primer ejercicio incompleto}`
  - Todo completo → `¡Día completado! 💪`
- **CTA contextual** en el resumen (no toca la nav): botón que hace scroll/expande el próximo
  ejercicio incompleto. Label según estado: `Iniciar entrenamiento` / `Continuar` /
  `Finalizar entrenamiento`. Reusa `Button` con `whileTap` (press scale 0.98).

```
┌──────────────────────────────────────────┐
│ SEMANA ACTIVA                            │
│ Día 1 · Pecho y Tríceps                  │
│ Completá tu entrenamiento y registrá…    │
├──────────────────────────────────────────┤
│  ◜◝   2 de 6 ejercicios completados      │
│ ( 2/6 ) ~60 min · 6 ejercicios           │
│  ◟◞   Próximo: Press de banca plano      │
│                                          │
│  [ ▸ Continuar entrenamiento ]           │
└──────────────────────────────────────────┘
```

## 3) Lista de ejercicios (card cerrada con más contexto + activo destacado)
- Card cerrada muestra meta completa (ya existe): `{series} series · {reps} reps · RIR {rir} · {rest}`.
- **Progreso interno derivado** `x/{series} series` (cuenta series con reps cargados vía
  `splitSeriesValues(draft.performedReps)`) — mini barra/píldora, sin estado nuevo.
- **Ejercicio activo (expandido)**: borde + glow violeta sutil
  (`border-[#7d4bff]` + `shadow-[0_0_0_1px_rgba(125,75,255,0.25),0_18px_50px_rgba(125,75,255,0.14)]`),
  vía clase condicional `isExpanded`. Card completada conserva borde verde actual.
- **CTA guía** dentro del acordeón en vez de inputs sueltos: botón principal
  `Completar ejercicio` (dispara el toggle existente `handleToggleCompleted`), y se mantiene
  `Ver detalle` como secundario.

```
ABIERTO (activo, glow violeta)        CERRADO
┌────────────────────────────┐  ┌────────────────────────────┐
│ (1) Press banca plano   ▲ │  │ (2) Aperturas        1/4 ▼ │
│     4 series·8 reps·RIR2  │  │     3 series·12 reps·RIR2  │
│  ┌──────────────────────┐ │  └────────────────────────────┘
│  │ # │ Reps │ Peso(kg) │ │
│  │ 1 │ [12] │ [ 40 ] ✓ │ │   ← serie con valores = check verde
│  │ 2 │ [10] │ [ 40 ] ✓ │ │
│  │ 3 │ [__] │ [ __ ] ○ │ │   ← pendiente (gris)
│  │ 4 │ [__] │ [ __ ] ○ │ │
│  └──────────────────────┘ │
│  ⏱ Descanso 02:00  [+15] [skip]
│  [ ✓ Completar ejercicio ] │
│  [ Ver detalle          → ]│
└────────────────────────────┘
```

## 4) Registro de series (más cálido, estado por serie derivado)
- Mantener grid reps/peso (`SeriesInputsGroup`).
- Agregar **3.ª columna de estado** por fila: check verde si reps+peso cargados, círculo gris
  si pendiente. **Derivado** de los drafts — no persiste estado nuevo, no cambia el autosave.
- Inputs con **focus state violeta** (`focus-visible:border-[#9d5cff] focus-visible:ring-2 ring-[#9d5cff]/30`).
- Filas con leve resalte cuando están "completas" (bg sutil), animación de check al completarse.

## 5) Timer de descanso (client-only, sin DB)
- Nuevo helper `parseRestSeconds(rest)`: extrae segundos de strings tipo `"90s"`, `"90"`,
  `"1:30"` (mm:ss). Fallback `null` si no parsea → no se muestra timer.
- Estado local `restTimer: { rowId, secondsLeft } | null` + `useEffect` con `setInterval`.
- **Disparo**: al completarse una serie (la fila pasa de incompleta→completa por reps+peso) o al
  tocar el check de la serie, si `rest` tiene segundos válidos. Aparece **mini-card compacta
  inline** dentro del ejercicio activo: `⏱ Descanso 02:00` con `+15s` y `Saltar`.
- Animación de entrada suave (`AnimatePresence`, fade + slide). Limpiar intervalos en unmount.

## 6) Espacio mobile / bottom nav
- Nav **sin cambios** (decisión del usuario). Único ajuste: aumentar padding inferior del
  contenedor `page-frame` en mobile (p. ej. `pb-28`) para que la tab bar fija no tape el último
  ejercicio ni los inputs. Verificar que el timer inline tampoco quede tapado.

## 7) Animaciones (Framer Motion — reusar patrones existentes)
- Entrada de pantalla: stagger suave de las cards (ya existe `initial/animate` con delay; pulir).
- Acordeón: expansión fluida de altura (existe) + rotación del chevron (existe) + glow del activo.
- Progreso: anillo ya animado; animar el contador `x/y` y la mini barra al completar serie/ejercicio.
- Inputs: focus state violeta.
- Botones: `whileTap={{ scale: 0.98 }}`.
- Completar serie: check con micro-pop; actualización animada del contador.
- Timer: aparición suave; tick sin saltos.

Respetar `motion-reduce` (patrón ya usado en el repo).

---

## Verificación (end-to-end)
1. `npm run dev` (o el comando del repo en `docs/codex/COMMANDS.md`).
2. Login admin (credenciales en `.env.local`), navegar a `/rutinas` → entrar a un día con ejercicios.
3. Con Playwright CLI (mobile viewport ~390px y desktop):
   - Header muestra "Día N · …", copys con acentos, CTA contextual correcto según progreso.
   - Expandir ejercicio: glow violeta, inputs con focus violeta, columna de estado por serie.
   - Cargar reps+peso de una serie → check verde + (si hay `rest`) aparece timer de descanso que
     cuenta hacia atrás; `+15s` y `Saltar` funcionan.
   - "Completar ejercicio" → anillo y contador se actualizan animados; badge "Completado" al terminar todos.
   - Scroll hasta el último ejercicio: la bottom nav **no** tapa inputs (padding ok).
   - Verificar "Más" en la tab bar.
4. Confirmar que el autosave sigue funcionando (sin errores en consola; valores persisten al recargar).
5. `npm run lint` / typecheck del repo.
6. `graphify update .` tras los cambios.

## Riesgos
- Timer client-only no persiste si se recarga (aceptable: es ayuda en vivo, no dato de entrenamiento).
- `parseRestSeconds` debe tolerar formatos libres del campo `rest`; ante duda, no mostrar timer.
- "Estado por serie" es derivado: si el usuario carga peso sin reps (o viceversa), definir
  "completa" = ambos cargados para evitar checks falsos.
- No alterar la firma del autosave ni la lógica de `complete`/`isAllCompleted` para no romper el guardado.
