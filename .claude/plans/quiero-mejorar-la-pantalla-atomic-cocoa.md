# Mejora Home mobile (app/page.tsx)

## Context

La Home mobile funciona pero se siente plana y muerta: hero poco protagonista con
texto de bajo contraste, cards todas iguales (`bg-[#0e131e]` sin jerarquía),
empty states que parecen rotos cuando hay 0 comidas/macros, card "Carga muscular"
poco legible, y un badge de "Racha" en el header que es **placeholder estático**
(siempre dice "Racha", nunca un número real). Objetivo: que la pantalla comunique
**estado + acción + progreso** manteniendo el estilo dark/neón actual. No es un
rediseño total: cambios quirúrgicos sobre estructura existente + microanimaciones
Framer Motion sutiles.

Decisiones del usuario:
- **Racha:** calcular racha real desde `completedTrainingDates`.
- **Hero:** SIN metadata secundaria (nivel/duración). Solo título + 2 botones.
- **Bottom nav:** NO tocar (ya está gateado por rol; queda fuera de scope).

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `app/page.tsx` | Hero, cards, empty states, carga muscular, cálculo de racha + render de `MobileHeaderBadgeSync` |
| `app/components/ui/motion.tsx` | Agregar variants/helpers reutilizables (hero stagger, glow pulse) si hace falta |
| (sin tocar) `MobileHeader.tsx` | Ya consume `badge` vía contexto; solo se le alimenta el dato |

Reutilizar lo existente: `MotionDiv`/`MotionSection`/`fadeUp`/`staggerContainer`/
`tapFeedback` (`motion.tsx`), `AnimatedProgressRing` (`ProgressRing.tsx`),
`MobileHeaderBadgeSync` (`MobileHeader.tsx:55`), `Button` (`Button.tsx`),
`BodyMuscleFigure`, tokens CSS de `globals.css` (`--accent`, `--accent-bright`, etc).

---

## 1. Hero "Hoy toca" más protagonista

Estado actual: `page.tsx:131-171`. Título OK pero botón solo "Comenzar" (w-1/3),
sin acción secundaria, scrim mejorable.

Cambios:
- Reforzar contraste: scrim inferior más opaco (`from-black/80`), mantener glow violeta.
- Subir jerarquía del título (ya `text-xl→3xl`), eyebrow "Hoy toca" un poco más marcado.
- **Dos botones**: primario `Comenzar` (accent, glow, press scale) + secundario
  `Ver rutina` (ghost/outline) → `href="/rutinas"`. Quitar `w-1/3`, usar fila `flex gap-2`.
- Envolver hero en `MotionDiv` con `fadeUp` (entrada). Botón primario con
  `whileTap={tapFeedback}` + glow breve.
- SIN metadata (nivel/duración) por decisión del usuario.

```
┌──────────────────────────────────────┐
│ [imagen rutina + scrim + glow violeta]│
│                                       │
│ Hoy toca                              │
│ Día 1 · Pecho y espalda A             │
│                                       │
│ [ Comenzar ▸ ]   [ Ver rutina ]       │
└──────────────────────────────────────┘
```

## 2. Profundidad / separación entre cards

Estado actual: todas `rounded-2xl bg-[#0e131e] p-3`, sin borde ni sombra → plano.

Cambios (consistentes en las 5 cards):
- Surface base: `bg-[#0e131e]` + `border border-white/[0.06]` + sombra sutil
  `shadow-[0_2px_12px_rgba(0,0,0,0.35)]`.
- Card principal de nutrición con leve realce (ring/glow violeta muy tenue).
- Aumentar `gap` del grid de `gap-2` → `gap-2.5/3` para respirar.
- `whileTap`/hover sutil en cards (mobile tap feedback) vía `MotionDiv`.

## 3. Empty states accionables

- **Comidas** (`page.tsx:392-393`): hoy "Sin comidas registradas hoy." plano.
  → Bloque con icono + "Todavía no registraste comidas" + CTA `Agregar comida`
  (`Link href="/nutricion/registro"`, botón sm). Aparición suave (`fadeUp`).
- **Nutrición / macros** (`page.tsx:298-317`): cuando target=0 o value=0 las barras
  se ven rotas. → track siempre visible e intencional (`bg-[#1a2235]` con leve
  inset), y si todo es 0 mostrar microcopy "Registrá tu primera comida" en vez de
  números crudos. Anillo kcal en 0 debe verse intencional (no vacío).

```
COMIDAS (vacío)
┌──────────────────────────┐
│  🍽️  Todavía no            │
│      registraste comidas  │
│   [ + Agregar comida ]    │
└──────────────────────────┘
```

## 4. Card "Carga muscular" más legible

Estado actual: `page.tsx:322-362`. Figura + leyenda gradiente, empty = "Sin rutina activa".

Cambios:
- Empty state elegante: icono `Zap` apagado + "Sin rutina activa" + microcopy
  "Activá una rutina para ver tu carga" (centrado, no texto pelado).
- Cuando hay músculos del día: pulso/glow violeta-verde sutil sobre la figura
  (animación `opacity/filter` loop suave vía Framer Motion, respeta `motion-reduce`).
- Mantener leyenda Base→Elite.

## 5. Racha real en header

Estado actual: `MobileHeader.tsx:119-123` default estático `{ label: "Racha" }`.
`MobileHeaderBadgeSync` (`MobileHeader.tsx:55`) ya permite a una página setear el badge.

Cambios (en `page.tsx`, server component):
- Helper `computeStreak(dates: Set<string>)`: cuenta días consecutivos hacia atrás
  desde hoy (o ayer si hoy aún no entrenó) usando `getLocalTrainingDate`.
- Render `<MobileHeaderBadgeSync badge={{ label: streak > 0 ? \`${streak} día${streak===1?'':'s'}\` : 'Sin racha', tone: streak>0 ? 'warm' : 'default', ariaLabel: ... }} />`.
- El pill ya muestra 🔥 (Flame) + label → quedará "🔥 2 días".

## 6. Animaciones (Framer Motion, sutiles)

- Entrada escalonada: hero (`fadeUp`) → grid de cards (`staggerContainer`, ya existe).
- Botón "Comenzar": `whileTap` scale + glow breve.
- kcal/macros: anillo ya anima (`AnimatedProgressRing`); barras de macro animar
  width desde 0 (motion `initial/animate` o `whileInView`).
- Cards: tap feedback mobile (`tapFeedback`).
- Carga muscular: pulso/glow loop en músculos activos.
- Empty states: aparición suave (`fadeUp`).
- Bottom nav: NO se toca.

Todas las animaciones respetan `prefers-reduced-motion` (patrón ya usado en repo).

---

## Verificación

1. `npm run dev` (o build) → sin errores TS/lint en `page.tsx` y `motion.tsx`.
2. Login con credenciales admin de `.env.local`; abrir `/` en viewport mobile
   (Playwright CLI / DevTools 390px).
3. Chequear:
   - Hero contrastado, 2 botones funcionan (`Comenzar` → `/rutinas/dia...`, `Ver rutina` → `/rutinas`).
   - Cards con profundidad/separación clara; tap feedback.
   - Empty states de Comidas y Nutrición (probar con día sin registros) muestran CTA, no texto roto.
   - Carga muscular: estado vacío elegante + glow cuando hay data.
   - Header muestra "🔥 N días" real (cross-check con `completedTrainingDates`).
4. Verificar `prefers-reduced-motion`: animaciones se desactivan.
5. `graphify update .` tras los cambios.

## Riesgos

- `computeStreak` con timezones: usar `getLocalTrainingDate` (ya maneja TZ local).
- `MobileHeaderBadgeSync` montado en una server page: es client component usado como
  hijo, patrón válido en Next App Router (confirmar que no rompe hidratación).
- Glow/pulse loops pueden costar batería en mobile: mantener sutiles y con `motion-reduce`.
