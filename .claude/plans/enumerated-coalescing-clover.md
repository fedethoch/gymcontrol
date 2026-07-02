# Fase 5 — Micro-interacciones · Dashboard principal

> Fase 4 (a11y) ya implementada y verificada. Esta Fase 5 agrega hover/press/transition **con criterio** a la sección dashboard (`app/page.tsx` + cards compartidas). Criterio del usuario: **priorizar feedback táctil (active/press) sobre hover** — la PWA se usa en mobile, que no tiene hover real. Restrained/premium (DESIGN.md): microinteracciones que confirman, no que decoran.

## Context

El dashboard ya tiene una base de motion (`app/components/ui/motion.tsx`: `fadeUp`, `staggerContainer`, `tapFeedback`, `premiumEase`, `AnimatedMacroBar`, `AnimatedProgressRing`) y entrada escalonada. El problema no es falta de motion sino **motion mal ubicado**:

1. **Afordancia deshonesta (principal).** `whileTap={tapFeedback}` está en el `MotionDiv` que envuelve **toda la card** aun cuando la card no es el target táctil:
   - `NutricionTodayCard`, `CargaMuscularCard`, `ComidasHoyCard` (`page.tsx:401,411,421`): solo navega el CTA/chevron interno, pero la card entera se escala al presionar.
   - Cards de calendario "Constancia semanal" / "Registro nutricional" (`page.tsx:434,448`): **no navegan a nada** y aun así se escalan al presionar. Feedback falso.
   - Correcto hoy: `SummaryStatCard` (`page.tsx:349,363,377`) — la card entera **es** un `Link`, el `whileTap` corresponde.
2. **Sin press en los targets reales.** Los `Link` internos ("Agregar comida" `:669`, "Ver detalle muscular" `:736`, "Ver rutina" `:330`, chevron `:771`, CTA empty-state `:794`) tienen solo `transition-colors hover:*`, cero estado `:active`. En mobile el press es el único feedback y falta justo donde ocurre el tap.
3. **Reduced-motion no global para framer.** No hay `MotionConfig`; los `whileTap`/`whileInView`/variants no respetan `prefers-reduced-motion` (solo `ProgressRing` se auto-protege desde Fase 4). Foundation pendiente.
4. **Doble press en hero primary.** `page.tsx:312` envuelve el `Button` en `MotionDiv whileTap={tapFeedback}` **y** el `Button` ya trae `active:scale-[0.985]` → escala compuesta.
5. **Hover inconsistente.** Solo `SummaryStatCard` tiene `hover:border-white/[0.1]`.

**Outcome:** el press feedback vive en el target real que actúa (card-link o CTA interno), no en superficies inertes; los CTA internos responden al tap; hover queda como bonus desktop restrained; todo el motion respeta `reduce`. Sin tocar la bottom navbar (regla CLAUDE.md).

## Decisiones

| Tema | Elección | Nota |
|---|---|---|
| Prioridad | **Press/active > hover** | mobile no tiene hover; el usuario lo pidió explícito |
| Afordancia | **Press = target que navega** | quitar `whileTap` de cards no-clickeables; moverlo al CTA/link real |
| Utility de press | **`.pressable` en `globals.css @layer components`** | 1 clase reusable, guard `reduced-motion`; evita repetir `active:scale` en cada link |
| Reduced-motion | **`MotionConfig reducedMotion="user"` global** | foundation, coherente con Fase 4; auto-degrada todo framer |
| Bottom tab-bar | **NO tocar** | regla CLAUDE.md; sin cambios de tamaño/posición/comportamiento |
| Alcance visual | **Restrained** | sin lift agresivo, sin glows nuevos; escala ≤0.97, hover sutil |

## Parte A — Foundation (global, alta palanca)

### A1. `.pressable` utility — `app/globals.css` (`@layer components`)
Clase única para el press feedback táctil de links/CTA (los que no son `<Button>`):
```css
@layer components {
  .pressable {
    transition: transform 0.12s cubic-bezier(0.22, 1, 0.36, 1),
      background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }
  .pressable:active { transform: scale(0.97); }
}
@media (prefers-reduced-motion: reduce) {
  .pressable:active { transform: none; }
}
```
Reusa el bezier `premiumEase` (mismo valor que `motion.tsx:6`). Colocar el `@media reduce` fuera del `@layer` o dentro de `@layer base` para asegurar emisión en Tailwind v4 (mismo aprendizaje de Fase 4: reglas bare pueden caerse; envolver o ubicar junto al bloque `prefers-reduced-motion` existente ~`globals.css:420`).

### A2. `MotionConfig` global — nuevo `app/components/ui/MotionProvider.tsx` + `app/layout.tsx`
Client wrapper mínimo:
```tsx
"use client";
import { MotionConfig } from "framer-motion";
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```
Envolver `{children}` dentro de `<main className="shell-main">` en `layout.tsx:92` (o alrededor de `<AppShell>`). Con esto todos los `whileTap`/`whileInView`/`variants` existentes respetan `reduce` sin tocarlos uno por uno. `layout.tsx` es server → el provider client se importa como boundary (patrón estándar Next).

## Parte B — Reubicar press al target real (`app/page.tsx`)

- **B1. Quitar `whileTap` de cards NO clickeables** (mantener `variants={fadeUp}` para la entrada):
  - `NutricionTodayCard` wrapper (`:401`), `CargaMuscularCard` wrapper (`:411`), `ComidasHoyCard` wrapper (`:421`).
  - Ambas cards de calendario (`:434`, `:448`).
- **B2. Mantener `whileTap`** en `SummaryStatCard` (`:349,:363,:377`) — la card entera es `Link`, el press es honesto.
- **B3. Quitar el `MotionDiv whileTap` del hero primary** (`:312`): el `Button` ya trae `active:scale-[0.985]` + `motion-reduce:active:scale-100`. Dejar el `Button` directo (sin wrapper de tap) para un único origen de press.

## Parte C — Press en CTA internos (`app/page.tsx`)

Agregar `pressable` (Parte A1) a cada `Link` que hoy es hover-only. Ya traen `transition-colors`; `pressable` añade el `:active` scale (y su propia transición combinada — quitar el `transition-colors` redundante o dejarlo, el último gana sin conflicto):
- "Ver rutina" hero secondary (`:330`)
- "Agregar comida" Nutrición CTA (`:669`)
- "Ver detalle muscular" Carga CTA (`:736`)
- Chevron "Ver registro de nutrición" (`:771`)
- CTA empty-state "Agregar comida" (`:794`)

## Parte D — Hover restrained (desktop, bonus)

Solo sobre superficies genuinamente clickeables; en touch no dispara (sin costo mobile):
- **D1. Card-links:** `SummaryStatCard` ya tiene `hover:border-white/[0.1]` — mantener. Sumar lift sutil reusando `listItemHover` (`motion.tsx:34`, `y:-2`) como `whileHover` en sus 3 `MotionDiv` (`:349,:363,:377`). Transform-only, respeta `reduce` vía MotionConfig.
- **D2. Chevron nudge:** en el `Link` chevron (`:771`) agregar `group` y al ícono `ChevronRight` (`:776`) `transition-transform group-hover:translate-x-0.5`. Micro-guiño de dirección, restrained.
- No agregar hover a cards inertes (calendarios, Nutrición/Carga/Comidas a nivel card) — no son clickeables.

## Reusar (no reinventar)
- `premiumEase` / bezier `cubic-bezier(0.22,1,0.36,1)` (ya en `motion.tsx:6`) para `.pressable`.
- `listItemHover` (`motion.tsx:34`) — ya definido, hoy sin usar; se estrena en D1.
- `tapFeedback` — se mantiene solo donde el press es honesto (SummaryStatCard).
- Bloque `@media (prefers-reduced-motion: reduce)` ya presente en `globals.css` (~`:420`) — ubicar ahí el guard de `.pressable`.
- `Button` `active:scale` existente — no duplicar con wrappers.

## No se toca
- **Bottom tab-bar** (`MobileTabBar`): sin cambios (regla CLAUDE.md).
- `motion.tsx` API pública: no se rompe; a lo sumo se **usa** `listItemHover` (ya exportado).
- Entrada escalonada (`fadeUp`/`staggerContainer`): se conserva tal cual.

## Verificación (end-to-end)
1. `pnpm dev`. Login admin (`.env.local`) → `/`.
2. **Press (mobile 390×844, Playwright):** tap sobre SummaryStatCard → escala; tap sobre CTA internos ("Agregar comida", "Ver detalle muscular", chevron, "Ver rutina") → `:active` scale visible; tap sobre card de calendario / cuerpo de Nutrición-Carga-Comidas → **sin** escala (afordancia honesta).
3. **Hero primary:** un solo press (no doble escala).
4. **Hover (desktop 1280):** SummaryStatCard lift -2px + border; chevron nudge; resto sin hover parásito.
5. **Reduced-motion:** con `prefers-reduced-motion: reduce`, `whileTap`/`whileHover`/entrada no animan y `.pressable:active` no escala (transform:none). Verificar en Playwright con `emulateMedia({ reducedMotion: "reduce" })`.
6. `npx tsc --noEmit` + `pnpm lint` (baseline Fase 4: 3 warnings preexistentes `kcalRemaining`/`isEmpty`/`subtitle`; no sumar nuevos).
7. **Regresión visual:** screenshot mobile + desktop — layout emerald, densidad y targets ≥44px (Fase 4) intactos.

## Riesgos
- **`MotionConfig` global.** Cambia comportamiento de motion en toda la app bajo `reduce`; es la intención (foundation). Verificar que no rompa animaciones deseadas en otras vistas (bajo riesgo, solo afecta con `reduce` activo).
- **`.pressable` en Tailwind v4.** Reglas `@layer`/bare pueden no emitir (aprendizaje Fase 4). Verificar emisión vía inspección CSSOM del `:active`.
- **Quitar `whileTap` de cards.** Cambio de sensación (menos "todo reacciona"); es deliberado por honestidad de afordancia. Reversible si el usuario prefiere lo anterior.
- **`listItemHover` lift.** Transform en card dentro de grid — sin reflow (GPU). Verificar que no recorte sombra/overflow del contenedor.
