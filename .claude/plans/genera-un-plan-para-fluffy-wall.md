# Plan — Fase 2: resolver los 9 defectos del dashboard principal

## Context

Auditoría Fase 1 (styleseed + DESIGN.md, pantalla real mobile 375px, logueado) sobre el
dashboard principal (`app/page.tsx`, servido en `/`; `/dashboard` solo redirige a `/`).
Score actual **82/100 (B)**: no es slop grosero, pero quedan tells de "AI-generated" y —lo
que más molesta al usuario— **mala distribución, espacio vacío en la banda de KPIs, y
demasiado scroll** (página medida en vivo: `shell-main` scrollHeight **1392px** para ~650px
de viewport útil ≈ 2.1 pantallas).

Causa raíz de las 3 quejas del usuario: el **KPI strip** (Nutrición / Entreno / Racha)
**no aporta ningún dato nuevo** — repite racha (header badge), entreno (hero) y kcal
(card Nutrición). Esa banda redundante + las cards empty a altura completa son el costo de
scroll y el espacio vacío.

Objetivo: subir a ~90 (A), recortar ~25% de scroll, sin tocar bottom nav ni app-shell.

## Decisiones tomadas (usuario)

- **KPI strip**: ocultar en mobile, mantener en desktop (`hidden lg:block`). Mobile pierde
  la banda redundante; desktop conserva el balance de la 3ra columna del hero row.
- **Alcance**: quirúrgico. Solo los 9 defectos. No rediseñar cards que ya funcionan
  (Carga muscular, Esta semana, Comidas) más allá del fix puntual de cada una.

## Hallazgos que condicionan el plan (Fase 1 + Explore)

- `KpiStrip` y `STRENGTH_LEGEND_GRADIENT` son **exclusivos de `app/page.tsx`** → refactor seguro.
- `Button` (`app/components/ui/Button.tsx`) tiene variants `default` (filled emerald),
  `secondary` (card-alt), `outline`, `ghost`; soporta `asChild`. Sirve para la jerarquía de CTAs.
- Header badge (`MobileHeaderBadgeSync` → `MobileHeader.tsx:158-172`) ya muestra la racha en
  mobile; el header es `lg:hidden` → por eso el KPI racha sí tiene sentido en desktop.
- `MACRO_COLORS` (`app/lib/nutrition-style.ts:10`) es compartido (config, registro, MacroBar)
  → **no tocar**. Los hues de macros (pink/amber/sky) quedan como están (data-encoding válido).
- Patrón `isEmpty` ya usado en `CargaMuscularCard` (`page.tsx:645/655`) y `ComidasHoyCard`
  (`page.tsx:730`) → reutilizar el mismo patrón en Nutrición. `isEmpty` ya está calculado en
  `NutricionTodayCard` (`page.tsx:551`) pero **sin usar**.
- No existe token de rampa de intensidad en `globals.css` (grep vacío); la rampa vive solo
  como literal en `page.tsx:53-54`.

## Cambios (todos en `app/page.tsx` salvo E)

### A. Disciplina de acento / CTAs (defectos 1 y 2)
- **`page.tsx:311`**: quitar `shadow-[0_6px_20px_rgba(16,185,129,0.32)]` del CTA hero
  ("Comenzar entrenamiento"). Glow en reposo viola DESIGN §3.3 (glow solo en focus-ring).
- **`page.tsx:744-750`**: bajar el "Agregar comida" del empty-state de Comidas de filled
  emerald → **secundario** (usar `Button` variant `secondary`, o el estilo `card-alt` que ya
  usa el ghost de Nutrición). Objetivo DESIGN §0.3: **un solo filled emerald por vista** = hero.
- Nutrición "Agregar comida" (`page.tsx:623-629`) ya es ghost → queda. Resultado: 1 primary.

### B. KPI strip: ocultar en mobile (defectos 7 y 9)
- **`page.tsx:336-345`**: agregar `hidden lg:block` al `MotionDiv` que envuelve `KpiStrip`.
  Mobile deja de renderizar la banda redundante (−~110px scroll, elimina triple-show de
  entreno/racha/kcal). Desktop la mantiene en `lg:col-span-1`.
- No se borra `KpiStrip` (sigue usándose en desktop).

### C. Nutrición: empty-state compacto (defecto 8)
- **`page.tsx:536-632` (`NutricionTodayCard`)**: cablear el `isEmpty` (ya calculado, `:551`).
  Cuando `totalKcal === 0`: render compacto = una fila (label + "0 / {target} kcal") + CTA;
  **omitir** ring 104px + 3 macro bars. Con datos → layout actual completo.
  Espejo del patrón `isEmpty` de Carga muscular y Comidas. Recupera ~1 pantalla de alto en vacío.

### D. Truncados en reposo (defecto 3)
- **`page.tsx:512`** (`KpiStrip` sub "días completad…"): el strip pasa a desktop-only (más
  ancho) → sacar `truncate` o acortar copy a "completados". Verificar que entra sin cortar.
- **`page.tsx:417` (`CardLabel`)** "CARGA MUSCUL…": acortar la label a "Carga" o bajar
  `tracking` y quitar `truncate` para que "Carga muscular" entre en 375px.

### E. Rampa de fuerza: tokenizar + sacar hue de marca (defecto 4) — `globals.css` + `page.tsx`
- La rampa `#22c55e→#eab308→#f97316→#ef4444` (`page.tsx:54`) usa `#22c55e`, el `--success`
  viejo que DESIGN §1.4 manda retirar (colisiona con brand emerald), y greens que compiten
  con el acento. Es una escala secuencial de intensidad (Base→Elite), no un status.
- Definir 4 tokens de rampa en `globals.css` (`:root`), p.ej. `--strength-1..4`, con una
  rampa **sin greens de marca**: gris-frío (Base) → `--warning` amber → naranja → `--danger`
  rose. Referenciarlos en `page.tsx:53-54` (const) y `:675` (barra legend).
- Alcance mínimo: solo la barra-legend; el `BodyMuscleFigure` colorea por su cuenta, no depende.

### F. Higiene de tokens (defecto 5)
- Reemplazar `text-white` → `text-[var(--foreground)]` **solo en texto sobre superficie de
  card**: `page.tsx:711` ("Comidas de hoy") y `:772` (nombre de comida).
  **Dejar `text-white`** en texto sobre la foto del hero (`:265, :438, :439, :784`) — ahí el
  blanco es correcto por contraste sobre imagen, no es violación.
- **`page.tsx:784`**: chip `bg-[rgba(255,255,255,0.05)]` → mover a `--card-alt` o token sutil.

### G. Micro-labels 10px uppercase (defecto 6)
- Reducir densidad de kickers all-caps 10px. Surgical: subir los 10px a **11px** y bajar
  `tracking` en `KpiStrip` (`:505`), `HeroStat`, y meal-type kicker (`:769`); no re-estructurar.
- Donde un título ya nombra la sección, no duplicar con kicker uppercase.

### H. Menores
- **`page.tsx:734`**: `strokeWidth={1.8}` → default (match resto de íconos).
- Gaps `gap-1.5` (6px) fuera de escala 4/8 → `gap-2` (8px) donde afecte alineación.

## Archivos a modificar

- `app/page.tsx` — grueso del trabajo (A, B, C, D, F, G, H y ref de E).
- `app/globals.css` — solo E: agregar tokens de rampa `--strength-1..4` en `:root`.

(No se tocan: `nutrition-style.ts`, `Button.tsx`, `MobileHeader.tsx`, `BodyMuscleFigure.tsx`,
`WeekCombinedCard.tsx`, bottom nav, app-shell.)

## Verificación (end-to-end)

1. **Relogin mobile** (bypass OTP service-role, ver `memory/admin_account.md`): abrir
   Playwright a 375×812, `POST /api/auth/verify-otp`, ir a `/`.
2. **Scroll**: `eval` sobre `.shell-main` → `scrollHeight`. Antes **1392px**; objetivo
   **≤ ~1050px** (−25%). Confirmar que en mobile ya no aparece el KPI strip.
3. **Screenshots** top + bottom (scroll de `.shell-main`, no `body`): confirmar
   (a) sin glow en el CTA hero, (b) un solo botón filled emerald por pantalla,
   (c) Nutrición compacta en estado vacío, (d) sin labels truncadas ("Carga muscular",
   "completados" enteros), (e) legend sin greens de marca.
4. **Desktop** (resize 1280): confirmar que el KPI strip sigue en la 3ra columna del hero
   y el hero row queda balanceado.
5. **Re-score styleseed** mental sobre el diff: apuntar a coherence/color/layout/motion
   arriba de 82 → ~90.
6. `pnpm lint` / typecheck del proyecto (no romper TS strict; `isEmpty` deja de ser unused).

## Riesgos

- Bajo. Todo es borrado/colapso/tokenización, sin lógica de datos nueva.
- Ojo con no romper el balance del hero desktop al ocultar el strip en mobile (grid
  `grid-cols-1 lg:grid-cols-3` se mantiene; `hidden lg:block` no altera desktop).
- Verificar contraste de la nueva rampa de fuerza (gris/amber/rose) ≥3:1 sobre `--card`.
