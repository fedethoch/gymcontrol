# DESIGN.md — GymControl Design System

Fuente de verdad visual. Toda decisión de UI (color, tipografía, spacing, motion, estados, PWA) se contrasta contra este archivo. Si una decisión cambia, **se actualiza acá primero**, después el código.

Ámbito: PWA operativa de entrenamiento + nutrición. **Dark-only**, **mobile-first real**, **app-native first**.

---

## 0. Principios

1. **App, no página web.** La PWA se instala y se trata como app nativa. Mobile es el diseño primario, no un desktop stackeado. Bottom nav protagonista, bottom sheets, feedback táctil.
2. **Airy con jerarquía.** El espacio comunica jerarquía antes que las líneas o las sombras. Respiración generosa; nada apretado.
3. **Un solo acento, usado con criterio.** Emerald es señal de marca/interacción/estado activo. No teñir todo de verde: el acento resalta porque es escaso.
4. **Feedback táctil sobre hover.** Mobile no tiene hover real. Priorizar `active`/`:active`/press states. Hover es mejora de desktop, no la base.
5. **Anti-slop.** Nada de gradientes decorativos random, glows gratuitos, glassmorphism barato, cards dentro de cards dentro de cards, sombras infladas ni ruido decorativo.
6. **A11y es piso, no feature.** WCAG 2.2 AA, targets ≥44px, foco visible, contraste real. La PWA instalada se usa como app nativa: la accesibilidad no es opcional.

---

## 1. Color

**Dark-only.** No hay light mode. Tokens viven en `app/globals.css` → `:root`, expuestos a Tailwind vía `@theme inline`.

### 1.1 Superficies (se mantienen)

| Token | Hex | Uso |
|---|---|---|
| `--background` | `#05070b` | Fondo raíz de la app / html-body |
| `--sidebar` | `#080b10` | Sidebar desktop |
| `--workspace` | `#0d1118` | Área de trabajo / main |
| `--card` | `#121824` | Superficie de card base |
| `--card-alt` | `#171d2a` | Card elevada / hover / nested sutil |
| `--border` | `#252b36` | Borde por defecto |
| `--border-strong` | `#323949` | Borde de énfasis / separadores activos |

Elevación = paso de superficie + borde, **no** sombra pesada. Escala de profundidad: `background → workspace → card → card-alt`.

### 1.2 Texto

| Token | Hex | Uso | Contraste vs `--card` |
|---|---|---|---|
| `--foreground` | `#f4f6fb` | Texto primario, títulos | AAA |
| `--foreground-muted` | `#98a2b7` | Texto secundario, labels | AA |
| `--foreground-subtle` | `#6b7488` | Texto terciario, hints, placeholders | usar solo ≥14px |

> `--foreground-subtle` es nuevo — agrega un tercer nivel para jerarquía airy. Nunca para texto crítico ni <14px.

### 1.3 Acento — Emerald (NUEVO, reemplaza violeta)

| Token | Hex → | Uso |
|---|---|---|
| `--accent` | `#10b981` | Acción primaria, selección, estado activo, brand |
| `--accent-strong` | `#34d399` | Hover/press del acento, énfasis |
| `--accent-bright` | `#6ee7b7` | Íconos/labels activos sobre dark, detalles brillantes |
| `--accent-foreground` | `#04150d` | Texto/ícono **sobre** relleno de acento (near-black verdoso) |

Migración: reemplaza `#7c3aed / #8f4df3 / #b995ff / #f7f5ff`. Actualizar también:
- `theme_color` de la PWA (`app/manifest.ts` + `viewport.themeColor` en `layout.tsx`) — **mantener `#05070b`** (el theme_color es el fondo, no el acento; no cambia).
- Gradientes de marca en `globals.css`: `.shell-sidebar`, `.thumb-fitness`, `.fitness-photo` usan violeta `rgba(124,58,237,…)` / `#2b1854` / `#22143f` → re-tonar a emerald (`rgba(16,185,129,…)`, verdes profundos) en Fase 1.
- Selección de texto `::selection` (usa `--accent`) queda automática.

**Regla del acento:** máximo ~10% de superficie visible. Un CTA primario por vista. El resto son neutros.

### 1.4 Semánticos de estado (hue distinto al brand)

Como el brand es verde, **success no puede ser el mismo verde**. Cada estado vive en su propia familia de hue para lectura inequívoca:

| Token | Hex | Uso |
|---|---|---|
| `--success` | `#a3e635` (lime) | Meta cumplida, positivo confirmado. Distinto del emerald por hue amarillo-verde |
| `--warning` | `#f59e0b` (amber) | Advertencia, atención requerida |
| `--danger` | `#f43f5e` (rose) | Destructivo, error, eliminar |
| `--info` | `#38bdf8` (sky) | Informativo, neutro-positivo |

> El `--success` actual (`#22c55e`) se retira: colisiona con el brand emerald. Migrar usos a `--success` lime o al acento según intención (marca vs status).

Texto sobre relleno de status: usar near-black `#0a0d12` para lime/amber/sky; blanco para rose.

### 1.5 Contraste (piso obligatorio)

- Texto normal ≥ **4.5:1**; texto grande (≥18.66px bold / ≥24px) ≥ **3:1**.
- Componentes/íconos no textuales y bordes de foco ≥ **3:1**.
- Nunca acento sobre acento para texto. Nunca `--foreground-subtle` sobre `--card-alt` para nada legible.

---

## 2. Tipografía

Tres roles cargados en `app/layout.tsx` vía `next/font/google`, expuestos como `--font-display`, `--font-body`, `--font-mono`.

| Rol | Fuente (target) | Token | Uso |
|---|---|---|---|
| Display | **Sora** (se mantiene) | `--font-display` | Headers, títulos de sección, números grandes de métrica, labels de tab bar |
| Body | **Geist Sans** (migra desde IBM Plex Sans) | `--font-body` | Todo el texto de UI, párrafos, inputs |
| Mono | **Geist Mono** (migra desde IBM Plex Mono) | `--font-mono` | Números tabulares, códigos, IDs, datos técnicos |

Migración (Fase 1, en `layout.tsx`): quitar `IBM_Plex_Sans` / `IBM_Plex_Mono`, cargar `Geist` / `Geist_Mono` desde `next/font/google`. Sora queda igual. Resultado: −0 fuentes de peso conceptual, sistema tipográfico coherente.

### 2.1 Escala (mobile-first, `rem`)

| Nombre | Size / line-height | Peso | Fuente | Uso |
|---|---|---|---|---|
| Display XL | 2rem / 1.1 | 700 | Sora | Número hero de métrica |
| H1 | 1.5rem / 1.2 | 600 | Sora | Título de pantalla |
| H2 | 1.25rem / 1.25 | 600 | Sora | Título de sección |
| H3 | 1.0625rem / 1.3 | 600 | Sora | Título de card |
| Body | 0.9375rem / 1.5 | 400 | Geist Sans | Texto base |
| Body-strong | 0.9375rem / 1.5 | 500 | Geist Sans | Énfasis inline |
| Label | 0.8125rem / 1.3 | 500 | Geist Sans | Labels de form, meta |
| Caption | 0.75rem / 1.3 | 500 | Geist Sans | Hints, timestamps |
| Tab label | 0.625rem / 1 | 700 | Sora | Labels de bottom nav (ya definido) |
| Mono | 0.875rem / 1.4 | 400–500 | Geist Mono | Números/datos |

- Inputs en mobile ≥ **16px** para evitar zoom de iOS (ya forzado en `globals.css` `@media (max-width:767px)`).
- Números que se comparan en columna → `font-mono` + `tabular-nums`.

---

## 3. Spacing, radio y layout

### 3.1 Escala de espaciado (base 4px — airy)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`

| Contexto | Valor |
|---|---|
| Padding de card (mobile) | 16px |
| Padding de card (desktop ≥1024) | 20–24px |
| Gap entre cards / secciones (mobile) | 16–20px (`--page-frame` gap `1.25rem`) |
| Gap entre secciones (desktop) | 24px (`1.5rem`) |
| Gap interno de grupo | 8–12px |
| Padding de pantalla | 16px mobile / 24px desktop (`.page-frame`) |

**Tap targets ≥ 44×44px** siempre. Si el visual es más chico, ampliar el área táctil con padding/`::before` invisible.

### 3.2 Radios

| Token | Valor | Uso |
|---|---|---|
| sm | 8px | Chips, tags, inputs compactos |
| md | 10px (`0.625rem`) | Controles, selects (ya en uso: `.nutrition-compact-control`) |
| lg | 14px | Cards |
| xl | 20px | Sheets, contenedores grandes, modales |
| pill | 999px | Badges, avatares, botones redondos |

Consistencia: un mismo tipo de elemento usa siempre el mismo radio.

### 3.3 Sombras / elevación

Dark UI → sombras sutiles, nunca protagonistas. Elevación real = superficie + borde.

| Nivel | Definición |
|---|---|
| flat | sin sombra, solo `--border` |
| raised | `0 1px 2px rgba(0,0,0,.4)` + `--border` |
| overlay | `0 8px 30px rgba(0,0,0,.5)` (sheets, popovers, dropdowns) |
| focus-glow | `0 0 0 3px rgba(16,185,129,.35)` — **solo** en foco/selección, único uso de "glow" permitido |

Prohibido: glow decorativo en reposo, doble sombra, sombras de colores fuera del focus-ring.

---

## 4. Componentes y patrones

Base: **shadcn/ui** + Tailwind. Íconos: **lucide-react** únicamente. Microinteracciones: **Framer Motion** (sutiles). No crear componentes custom si un primitive de shadcn/proyecto ya encaja.

| Patrón | Regla app-native |
|---|---|
| Modal / diálogo | En mobile → **bottom sheet** (drawer desde abajo, vaul). En desktop → dialog centrado. Ya hay animaciones `.motion-sheet-*` |
| Navegación primaria | Mobile → bottom tab bar. Desktop → sidebar. Ver §6 |
| Overflow de nav | Bottom sheet "más" (`.mobile-more-sheet`) — no tocar sin pedido |
| Lista / feed | Filas ≥44px, separador por `--border`, no card-por-item salvo que aporte |
| Empty state | Copy claro + acción. Animar entrada con `.motion-empty-state` |
| Toast | `sonner`, `top-center`, respetando safe-area (ya configurado) |
| Loading | Skeleton con superficie `--card-alt`, o `.motion-dot` pulse. Nunca spinner solo en pantalla completa |
| Select/control compacto | `.nutrition-compact-control` (h 2rem, radio md) |

Estados obligatorios por componente interactivo: **default · hover (desktop) · active/press · focus-visible · disabled · loading**.

---

## 5. Motion

Tokens ya presentes en `globals.css`. Consolidados:

| Rol | Duración | Easing |
|---|---|---|
| Micro (popover, dot) | 120–160ms | `cubic-bezier(0.22, 1, 0.36, 1)` (standard) |
| Entrada suave / empty | 180ms | standard |
| Sheet in | 360ms | `cubic-bezier(0.16, 1, 0.3, 1)` (emphasized) |
| Sheet out | 260ms | `cubic-bezier(0.4, 0, 0.2, 1)` (exit) |

Reglas:
- Priorizar `active`/press feedback (mobile) sobre hover.
- Transform + opacity únicamente (GPU). Nada de animar `width/height/top/left` salvo accordion controlado.
- **`prefers-reduced-motion: reduce` ya neutraliza todo** (`globals.css`). Toda animación nueva debe seguir degradándose ahí.
- Nada de motion infinito decorativo (excepto loaders como `.motion-dot`).

---

## 6. PWA

La app es **instalable y standalone**. El diseño asume que el usuario la abre como app nativa.

### 6.1 App-shell

- Estructura fija: `.app-shell` (`position:fixed; inset:0; flex column`, `row` en ≥1024) con `overflow:hidden`. El body no scrollea; scrollea `.shell-main` (`overflow-y:auto`, `-webkit-overflow-scrolling:touch`).
- Regiones: `PrimaryNavigation` (sidebar desktop) · `.shell-workspace` (`MobileHeader` + `main.shell-main`) · `MobileTabBar` (bottom nav).
- `viewport-fit: cover` + `env(safe-area-inset-*)` en todos los bordes (header top, tab bar bottom, toasts). Ver `.page-frame` padding-top/bottom con safe-area.
- `theme_color` y `background_color` = `#05070b`. `apple-mobile-web-app-status-bar-style: black-translucent`.

### 6.2 Bottom nav — **NO TOCAR sin pedido explícito**

`MobileTabBar` + clases `.mobile-tab-bar*` están calibradas (alturas, safe-area, variantes browser vs standalone, estados `aria-current`/`aria-expanded`). **No modificar tamaño, posición ni comportamiento** salvo pedido explícito del usuario.

Único cambio que aplica del redesign: el color de estado activo `#b995ff` (violeta) → `--accent-bright` `#6ee7b7` (emerald) en Fase 1. Nada más de la tab bar se toca.

Detalle: modo browser (`.pwa-browser` / `@media (display-mode: browser)`) usa barra alta con labels; standalone (`.pwa-standalone` / `@media (display-mode: standalone)`) usa barra fina pegada abajo. Respetar ambos.

### 6.3 Estados offline / instalación

- **Instalación**: prompt de instalación se maneja vía `PwaRuntime`. Cuando exista UI de "instalar app", debe ser no intrusiva (banner/sheet descartable), respetar safe-area, y no reaparecer si el usuario descartó. Ícono/copy con brand emerald.
- **Offline**: al perder conexión, mostrar indicador claro y no destructivo (banner sutil `--warning`, no modal bloqueante). Acciones que requieren red → estado disabled + mensaje, no fallo silencioso. Datos cacheados se muestran con marca de "última actualización".
- **Reconexión**: feedback breve (toast `--success` lime) al recuperar conexión.
- Ningún estado offline/instalación debe romper el app-shell ni empujar la bottom nav.

---

## 7. Accesibilidad (WCAG 2.2 AA — piso)

- **Foco visible** en todo elemento interactivo: focus-ring `focus-glow` (`0 0 0 3px rgba(16,185,129,.35)`) + `--accent`. Nunca `outline:none` sin reemplazo.
- **Targets táctiles ≥ 44×44px** (WCAG 2.5.8). Ampliar área si el visual es menor.
- **Contraste** según §1.5.
- **Semántica**: HTML correcto (`nav`, `main`, `button` vs `a`, headings jerárquicos). `aria-current="page"` en nav activa (ya en tab bar). Labels reales en inputs (no solo placeholder).
- **Teclado**: todo operable sin puntero; orden de foco lógico; escape cierra sheets/modales; foco atrapado dentro de modal abierto y devuelto al cerrar.
- **Reduced motion**: respetado globalmente (§5).
- **Idioma**: `html lang="es"`.
- Lo trata `a11y-architect` + `frontend-a11y` en Fase 4 por sección.

---

## 8. Anti-slop checklist (rechazar si aparece)

- [ ] Gradientes decorativos random / multicolor sin propósito
- [ ] Glows fuera del focus-ring
- [ ] Glassmorphism barato (blur + borde blanco genérico)
- [ ] Cards anidadas 3+ niveles
- [ ] Sombras infladas / dobles
- [ ] Acento sobre >10% de la pantalla / múltiples CTAs primarios compitiendo
- [ ] Spacing inconsistente entre secciones equivalentes
- [ ] Radios mezclados en el mismo tipo de elemento
- [ ] Desktop stackeado verticalmente como "mobile"
- [ ] Hover como único feedback (sin active/press)
- [ ] Íconos fuera de lucide-react
- [ ] Texto crítico en `--foreground-subtle` o <14px

---

## 9. Estado actual vs target

| Aspecto | Actual (código) | Target (este doc) | Fase de aplicación |
|---|---|---|---|
| Acento | violeta `#7c3aed` | emerald `#10b981` | Fase 1 (`globals.css`, gradientes, tab activo) |
| Body font | IBM Plex Sans | Geist Sans | Fase 1 (`layout.tsx`) |
| Mono font | IBM Plex Mono | Geist Mono | Fase 1 (`layout.tsx`) |
| Display font | Sora | Sora (sin cambio) | — |
| `--success` | `#22c55e` | `#a3e635` lime + semánticos warning/danger/info | Fase 1 |
| `--foreground-subtle` | no existe | agregar | Fase 1 |
| Superficies / spacing / motion / PWA shell | ya alineados | mantener | — |

> Fase 0 (este entregable) = solo documentación. La aplicación real de tokens es Fase 1+, sección por sección, según `plan/prompts.md`.
