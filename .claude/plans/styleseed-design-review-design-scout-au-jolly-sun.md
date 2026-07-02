# Dashboard principal (`/`) — Audit + Redesign plan

## Context

El dashboard principal (ruta raíz `/`; `/dashboard` solo hace `redirect("/")`) fue construido **antes** de que se cerrara la dirección de `DESIGN.md`. El sistema de diseño es maduro y correcto (dark-only, mobile-first, acento emerald, Sora+Geist, spacing airy, tokens en `@theme`), pero el código de `app/page.tsx` y sus cards lo ignoran: usa hex hard-coded, texto de 7–9px, glow decorativo, motion infinito, multi-acento y una grilla monótona de cards iguales. **No falta dirección — hay drift.**

Este plan sale de un audit con lente StyleSeed sobre el código real + un benchmark visual real (design-scout: 21st.dev + Dribbble dark/mobile fitness). El objetivo: alinear el dashboard con `DESIGN.md` y con el patrón dominante de los dashboards fitness premium (**una métrica protagonista → sub-stats tabulares → secciones full-width con aire**), sin tocar la bottom nav (DESIGN.md §6.2, prohibido sin pedido).

### Benchmark (referencia real capturada)
- **21st.dev — Activity Card / Vo2Max radial / Workout Summary**: patrón hero-metric grande (número animado dentro de anillo) + sub-stats + lista de tareas del día.
- **Dribbble dark/mobile (RIFT, Abdullah Al Mamun, Keitoto, Goal Tracker 25k)**: acento verde/lime, hero-metric protagonista, sub-stats apiladas, secciones full-width con respiración. Ninguno usa grilla de cards micro iguales.

---

## Hallazgos del audit (evidencia con file:line)

| # | Problema | Evidencia | Regla DESIGN.md |
|---|---|---|---|
| 1 | Micro-texto <12px masivo | `page.tsx:540 (7.5px), 552, 564, 654 (7px), 724, 505` | §1.2 nada crítico <14px; mínimo 12px |
| 2 | Hex hard-coded en vez de tokens | `page.tsx:434,448,530,558,704,802` (`#0e131e`, `#1a2235`, `#7887a6`, `#4a5368`, `#404e66`, `#111722`) | §0 anti-slop; "Use What Exists" |
| 3 | Jerarquía plana / sin focal | todas las cards `rounded-2xl bg-[#0e131e] p-3 shadow-...` mismo gap-2 | §0.2 airy con jerarquía |
| 4 | Multi-acento compitiendo | `page.tsx:351,365,379` (`#10b981`+`#f59e0b`+`#a3e635` como color de card entera) | §1.3 un solo acento |
| 5 | Glow decorativo + motion infinito | `page.tsx:260, 226` (glow), `711` (`GlowPulseWrapper active` pulso infinito) | §3.3 prohíbe glow en reposo; §5 prohíbe motion infinito |
| 6 | Contraste roto | `page.tsx:564,704` (`#4a5368`/`#404e66` a 8px sobre `#0e131e`) | §1.5 piso 4.5:1 |
| 7 | Sombra en cada card | `shadow-[0_2px_12px_rgba(0,0,0,0.35)]` en todas | §3.3 elevación = superficie+borde, sombra sutil |
| 8 | Densidad anti-airy | `p-3` (12px) + `gap-2` (8px); mobile `grid-cols-2` de half-cards | §3.1 card 16px, gap 16–20px |

Nota estructural: `TrainingCalendarCard` y `NutritionCalendarCard` son **casi duplicados** (misma lógica de layout, difieren en sizing de dots y labels) — candidatos a unificar en Fase 2.

---

## Enfoque recomendado: 2 fases

Alineado con `DESIGN.md §9` (aplicación "sección por sección, Fase 1+") y con la regla de `CLAUDE.md` ("surgical unless explicitly asks for a redesign"). Fase 1 es segura y de alto valor; Fase 2 es opt-in.

### FASE 1 — De-slop (tokens · legibilidad · contraste · motion)
Sin cambiar el layout. Objetivo: matar los tells de "AI-generated" y volver el dashboard 100% token-based.

**Archivos:** `app/page.tsx` (sub-components locales `HeroStat`, `SummaryStatCard`, `NutricionTodayCard`, `CargaMuscularCard`, `ComidasHoyCard`, `CardLabel` + bloque render 225–461), `app/components/shared/TrainingCalendarCard.tsx`, `app/components/shared/NutritionCalendarCard.tsx`, `app/components/shared/MobileHeader.tsx`, `app/components/shared/PrimaryNavigation.tsx` (aún tienen violeta `#4b348d`/`#8f63ff`).

1. **Hex → tokens.** Reemplazar todo literal por CSS var: `#0e131e`→`bg-[var(--card)]`, `#1a2235`→track sobre `--card-alt`, `#7887a6`/`#8a96ae`→`text-[var(--foreground-muted)]`, `#4a5368`/`#404e66`→`text-[var(--foreground-subtle)]` (y solo ≥14px). Purga violeta residual en `MobileHeader`/`PrimaryNavigation`/calendars → emerald tokens (DESIGN.md §9, migración pendiente).
2. **Texto ≥12px.** Subir todos los `text-[7px…10px]` al piso del sistema: labels/meta → `text-xs` (12px) mínimo, captions → 12px. Eliminar el `text-[7.5px]`/`text-[8px]`/`text-[9px]`. Esto obliga a relajar densidad (paso 4).
3. **Un solo acento.** SummaryStatCard: dejar de teñir la card entera con 3 accents. Valor en `--foreground`, ícono/label en neutro, barra de progreso en `--accent` (o el semántico correcto solo para el chip de estado, no para todo). Amber/lime vuelven a ser estado, no branding de card.
4. **Densidad airy.** `p-3`→`p-4` (16px), `gap-2`→`gap-4` (16px) entre cards/secciones. Radio de card `rounded-2xl`(16)→`rounded-[14px]` (token lg) consistente; CTAs `rounded-lg`.
5. **Sombra → superficie+borde.** Sacar `shadow-[0_2px_12px...]` de las cards; elevación por `--border` + `--card`. Sombra solo `raised`/`overlay` donde DESIGN.md §3.3 la permite.
6. **Motion/glow.** Quitar `GlowPulseWrapper active` infinito de la figura muscular (`page.tsx:711`); quitar glow radial decorativo del hero bg-right (`260`) y suavizar el glow de página (`226`) a algo sutil o retirarlo. Focus-glow solo en foco (§3.3).

**Resultado Fase 1:** mismo layout, token-based, legible, sin slop. Bajo riesgo.

### FASE 2 — Jerarquía hero-metric-led + mobile airy (opt-in)
Reestructura para que **una métrica protagonice** y el mobile respire, siguiendo el benchmark.

1. **Hero como focal real.** El hero ya tiene foto + título; reforzar con la métrica del día como número protagonista (Sora, escala Display, `tabular-nums`) en vez de la fila de HeroStats chica. Un solo CTA primario (ya está: "Comenzar entrenamiento").
2. **Romper `grid-cols-2` en mobile → full-width apilado.** Nutrición y Carga muscular como secciones full-width con aire (hoy `page.tsx:399` las mete en `grid-cols-2` apretado). Igual los 2 calendarios (`431`). Mantener 2-col recién en `sm:`/`lg:`.
3. **Anillo de nutrición como hero-metric secundario.** `AnimatedProgressRing` (ya existe, `ui/ProgressRing.tsx`) más grande, número kcal en Display, macros como sub-stats tabulares debajo — patrón Vo2Max/Activity del benchmark.
4. **Unificar los dos calendar cards** casi-duplicados en un componente `WeekStrip` compartido (props `title`/`icon`/`accent`/`dates`) para matar la duplicación.
5. **Ritmo espacial.** Zonas densas (sub-stats) vs abiertas (hero, meals) — no todo el mismo card/gap (DESIGN.md §0.2, §3.1).

**Resultado Fase 2:** dashboard con focal claro, mobile con aire, alineado a refs premium. Riesgo medio (cambio estructural).

---

## Reutilizar lo que ya existe (no hand-roll)
- `AnimatedProgressRing` — `app/components/ui/ProgressRing.tsx` (hero-metric anillo).
- `Button` (cva variants) — `app/components/ui/Button.tsx` para CTAs, no `<Link>` estilado a mano.
- Tokens `@theme` en `app/globals.css` (`--card`, `--card-alt`, `--border`, `--foreground-*`, `--accent*`) — fuente de color.
- Motion helpers ya presentes (`fadeUp`, `staggerContainer`, `tapFeedback`, `MotionDiv/Section`) — no crear nuevos.
- Componentes shared calendar → unificar, no duplicar más.

## No tocar
- `MobileTabBar` / bottom nav (DESIGN.md §6.2) — salvo el color de estado activo violeta→emerald si aparece.
- `app/dashboard/page.tsx` (solo redirect).
- Lógica de datos (`computeStreak`, `estimateDayMinutes`, fetch en `page.tsx:132-166`) — es puro cálculo, no UI.

---

## Verificación (end-to-end)
1. `pnpm dev` (o el comando de `docs/codex/COMMANDS.md`), login con credenciales de `.env.local` (`EMAIL`/`EMAIL_PASSWORD`).
2. `playwright-cli goto` a la app en mobile viewport (390×844) y desktop (1280) — screenshot de `/`. Verificar: sin texto <12px, sin glow en reposo, sin pulso infinito, contraste legible, aire entre secciones, un solo acento por vista.
3. Grep de regresión: no deben quedar `text-[7px]`…`text-[10px]` ni hex crudos (`bg-[#`, `text-[#`) en `app/page.tsx` ni en los shared cards tocados. Sin violeta `#4b348d`/`#8f63ff`/`#b995ff`.
4. Squint test (DESIGN.md §checks): jerarquía legible, nada salta.
5. `graphify update .` tras los cambios (mantener el grafo).
6. Correr typecheck/lint del proyecto antes de cerrar.

## Decisión pendiente del usuario (asumida)
Se preguntó alcance (surgical / redesign / faseado) y mobile layout (full-width airy / 2-col legible); sin respuesta a tiempo. **Asumido: faseado + mobile full-width airy en Fase 2.** Fase 1 se puede ejecutar sola y es la recomendación mínima. Confirmar o ajustar al ejecutar.
