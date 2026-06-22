# Plan — Rediseño mobile `/dashboard/rutinas` como dashboard semanal

## Context

La pantalla `/dashboard/rutinas` (el archivo real es `app/rutinas/page.tsx`; `app/dashboard/rutinas/page.tsx` es solo un `redirect`) hoy se siente como una lista de días, no como un centro de control. Problemas concretos:

- El resumen semanal solo muestra `0/6` y `0%` sin contexto ni acción.
- Las métricas rápidas tienen textos confusos (`En 6 días` apilado sobre `Próximo`).
- "Tiempo: 60 min" es dato falso hardcodeado (no hay duración real de sesión en DB).
- La lista de días domina toda la pantalla y el CTA genérico dice "Ver".
- Sin empty states motivadores cuando el progreso es 0.
- Las cards superiores no tienen animación (solo `WeekDaysList` usa Framer Motion).

Objetivo: que la pantalla responda rápido a **qué rutina tengo activa**, **cuánto avancé**, **qué me toca ahora** y **qué me falta**, con estado + acción + progreso. Mantener el estilo dark/neón actual; cambios surgicales, no rehacer todo.

**Decisiones del usuario:** card de rutina activa solo con chips (sin botones secundarios); **no** tocar la bottom nav; métrica de tiempo etiquetada como estimado (`~60 min`).

## Archivos a tocar

1. `app/rutinas/page.tsx` (server) — derivar datos nuevos, delegar render animado a un client component.
2. `app/rutinas/RutinasOverview.tsx` (**nuevo**, client) — rows 1–3 (rutina activa, resumen semanal + CTA, métricas) con Framer Motion.
3. `app/rutinas/WeekDaysList.tsx` (client) — timeline más compacta, glow en día próximo, CTA "Comenzar"/"Ver día", fix spacing `60 min`, tap feedback.

Reutilizar: `MiniCard` (mover a `RutinasOverview`), tipos `SavedRoutineDetail`/`RoutineDay` (`app/lib/saved-routines.ts`, `app/lib/routines.ts`), `WorkoutWeeklySummary` (`app/lib/workout-tracking.ts`), `cn` (`app/lib/utils.ts`), labels `ROUTINE_OBJECTIVE_LABELS`/`ROUTINE_DIFFICULTY_LABELS`. No crear primitivos nuevos.

## Datos derivados (en `page.tsx`, ya casi todos existen)

- `completedDayCount`, `totalDays`, `weeklyProgressPercent` — ya existen.
- `nextPendingDay` — ya existe; pasar `dayName` + `dayOrder` para "Próximo: Día N · {nombre}".
- `remaining = totalDays - completedDayCount` — nuevo, para métrica "Restantes".
- `currentStreak = weeklySummary?.currentStreak ?? 0` y `hasRealData`.
- `startHref = /rutinas/dia?savedRoutineId=${activeRoutine.id}&day=${nextPendingDay.dayOrder}` (reusa ruta existente). Si semana completa, sin CTA primario.

## Cambios visuales (preview ASCII)

```
┌───────────────────────────────────────────┐
│ ░░ imagen + overlay violeta ░░             │  Row 1 · Rutina activa
│ RUTINA ACTIVA                              │  (igual, solo chips)
│ Push Pull Legs                             │
│ [Hipertrofia] [Intermedio] [6 días/sem]    │
└───────────────────────────────────────────┘
┌───────────────────────────────────────────┐
│ RESUMEN SEMANAL          Semana actual     │  Row 2 · Resumen + CTA
│ 0 de 6 entrenamientos completados          │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░  0%   (barra anim.)  │
│ Todavía no completaste entrenamientos      │  ← texto contextual / empty
│ esta semana. Empezá con Día 1.             │
│ Próximo: Día 1 · Pecho y espalda A         │
│ ┌───────────────────────────────────────┐ │
│ │      ▶  Comenzar entrenamiento         │ │  ← CTA primario (glow/press)
│ └───────────────────────────────────────┘ │
└───────────────────────────────────────────┘
┌─────────────┬─────────────┬───────────────┐
│ 🔥 Racha    │ ⏱ Duración  │ 📅 Próximo    │  Row 3 · métricas
│ 0 días      │ ~60 min     │ Día 1         │
│ Completá tu │ por sesión  │               │  ← subtexto contextual racha
│ primer ...  │             │               │
└─────────────┴─────────────┴───────────────┘
 LA SEMANA                                      Row 4 · timeline compacta
 ● Día 1 · Pecho y espalda A   8 ej·~60m [Comenzar ▶]  ← glow violeta + pulso
 ○ Día 2 · Pierna             7 ej·~60m  ›
 ○ Día 3 · ...                            ›
 ✓ (completados en verde, "Completado")
```

### Row 1 — Rutina activa
Sin cambios estructurales. Mantener imagen/overlay violeta y los 3 chips (objetivo, nivel, días/sem). Solo entra animada.

### Row 2 — Resumen semanal (rehecha)
- Eyebrow "RESUMEN SEMANAL" + etiqueta "Semana actual" a la derecha.
- Frase clara: "**0 de 6** entrenamientos completados" (en vez de `0/6` suelto).
- Barra de progreso (reusar la actual) animada de 0 → `weeklyProgressPercent`.
- Texto contextual:
  - 0% → "Todavía no completaste entrenamientos esta semana. Empezá con Día N."
  - parcial → "Vas {n} de {total}. Te faltan {remaining}."
  - 100% → "¡Semana completa! 💪".
- Línea "Próximo: Día N · {dayName}" (oculta si semana completa).
- **CTA primario** "Comenzar entrenamiento" → `startHref` (oculto si semana completa; si parcial puede decir "Continuar").

### Row 3 — Métricas (3 MiniCards, textos claros)
- **Racha**: `{currentStreak} días`; subtexto si 0 → "Completá tu primer entrenamiento para iniciarla".
- **Duración**: `~60 min` con sublabel "por sesión" (estimado, por decisión del usuario). Arreglar el wrap que produce `6 0 min` ajustando `whitespace-nowrap`/tamaño.
- **Próximo**: `Día N` (reemplaza el confuso "En 6 días"); usa `nextPendingDay.dayOrder`.

### Row 4 — `WeekDaysList` (timeline compacta)
- Reducir peso visual: filas más bajas, `DayMarker` más chico, tipografía día de `text-xl` → `text-base/lg`.
- Día próximo (`isCurrentDay`): borde + glow violeta y **pulso sutil**; CTA "Comenzar" (no "Ver").
- Días no próximos: CTA/affordance "Ver día" + chevron.
- Completados: igual (verde, check, "Completado").
- **Fix `6 0 min`**: envolver duración en `whitespace-nowrap` y separar de "ejercicios"; mostrar `{itemsCount} ej · ~60 min`.

## Animaciones (Framer Motion)

- **Entrada escalonada** de header → rutina activa → resumen → métricas → días. `RutinasOverview` define `containerVariants` con `staggerChildren`; `WeekDaysList` continúa el stagger (ya lo hace con `delay: index*0.05`, ajustar delay base).
- **Barra de progreso**: `motion.div` con `initial={{width:0}} animate={{width: pct%}}` `ease:easeOut`, ~0.7s.
- **Día próximo/activo**: `animate` con glow pulsante sutil (boxShadow loop o scale 1→1.01) `repeat: Infinity`, suave.
- **Cards tap feedback**: `whileTap={{ scale: 0.98 }}` en filas de días y MiniCards.
- **CTA primario**: `whileTap={{ scale: 0.97 }}` + glow breve en press.
- Respetar `prefers-reduced-motion` donde sea fácil (pulso desactivado).
- **Bottom nav: NO se toca** (decisión del usuario).

## Empty states
- Progreso 0 → mensaje motivador en Row 2 (arriba).
- Racha 0 → subtexto en MiniCard Racha (arriba).
- Sin rutina activa / sin días → mantener los empty states actuales (`page.tsx:26-59`, `:189-201`), sin cambios.

## Verificación
1. `npm run dev`, login con credenciales de `.env.local`, ir a `/dashboard/rutinas` (redirige a `/rutinas`).
2. Inspeccionar con `playwright-cli` en viewport mobile (375px) y desktop:
   - Jerarquía: rutina activa → resumen+CTA → métricas → timeline.
   - Barra anima de 0 al valor; entrada escalonada visible.
   - Día próximo con glow/pulso y CTA "Comenzar"; CTA primario navega a `/rutinas/dia?...`.
   - **No** aparece `6 0 min` (verificar texto exacto = `~60 min`).
   - Empty states (cuenta sin entrenamientos completados → mensajes motivadores; racha 0 → subtexto).
   - Bottom nav intacta (tamaño/posición/comportamiento sin cambios).
3. `npm run build` / typecheck sin errores nuevos.
4. `graphify update .` tras los cambios.

## Riesgos
- `page.tsx` es server component: mover render animado a `RutinasOverview` (client) sin romper el fetch server-side. Pasar solo datos serializables (strings/números), no funciones.
- Stagger entre `RutinasOverview` y `WeekDaysList` (dos árboles client distintos): coordinar con delays fijos, no un único `staggerChildren` global.
- "~60 min" sigue siendo estimado, no dato real (limitación de DB conocida).
