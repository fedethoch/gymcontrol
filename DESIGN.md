# DESIGN.md — GymControl Design System

Fuente de verdad visual. Toda decisión de UI (color, tipografía, spacing, motion, estados, PWA) se contrasta contra este archivo. Si una decisión cambia, **se actualiza acá primero**, después el código.

Ámbito: PWA operativa de entrenamiento + nutrición. **Dark-only**, **mobile-first real**, **app-native first**.

Para rediseñar una ruta, la dirección y el método (referencias con `/app-store-refs`, decisiones, estados) están en `docs/REDESIGN_DIRECTION.md`.

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

### 1.6 Rampa de fuerza (dato, no estado)

Escala ordinal para el rango de fuerza por grupo muscular (`MuscleStrengthRange`). Lógica **peor → mejor** tipo semáforo: el brillo sube con el nivel, así el orden se lee también en escala de grises y con daltonismo.

| Token | Hex | Rango |
|---|---|---|
| `--strength-0` | `#263347` | Sin datos (mismo gris que el cuerpo de `BodyMuscleFigure`) |
| `--strength-1` | `#f43f5e` | Base |
| `--strength-2` | `#fb923c` | Fuerte |
| `--strength-3` | `#fbbf24` | Avanzado |
| `--strength-4` | `#bef264` | Elite |

- Todos los rangos ≥ 5.4:1 contra `--background`. ΔE mínimo entre rangos contiguos: 31 (normal), 16 (deuteranopia), 15 (protanopia).
- Es un **dato**, no un estado: no reemplaza `--danger`/`--success` ni se usa para errores. El texto siempre nombra el rango ("Base", nunca "mal").
- Fuente única en código: `STRENGTH_RANGE_COLORS` (`app/lib/strength-colors.ts`) apunta a estos tokens.

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
| Metric XXL | 7rem / 0.85 | 800 | Sora | Número protagonista de un selector (días del catálogo, §16), tracking −0.06em. Uno por pantalla |
| Display XXL | 3.625rem / 0.88 | 800 | Sora | Título del hero del home (mayúsculas, tracking −0.05em). Uno por pantalla |
| Metric L | 3rem / 1 | 700 | Sora | Número principal de una sección (ej. kcal restantes) |
| Display XL | 2rem / 1.1 | 700 | Sora | Número hero de métrica |
| Metric M | 1.75rem / 1 | 700 | Sora | Stats en fila (entrenos, racha, comidas) |
| H1 | 1.5rem / 1.2 | 600 | Sora | Título de pantalla |
| H2 | 1.375rem / 1.25 | 700 | Sora | Título de sección (tracking −0.02em, sin kicker en mayúsculas) |
| H3 | 1.0625rem / 1.3 | 600 | Sora | Título de card |
| Body | 0.9375rem / 1.5 | 400 | Geist Sans | Texto base |
| Body-strong | 0.9375rem / 1.5 | 500 | Geist Sans | Énfasis inline |
| Label | 0.8125rem / 1.3 | 500 | Geist Sans | Labels de form, meta |
| Caption | 0.75rem / 1.3 | 500 | Geist Sans | Hints, timestamps |
| Micro label | 0.6875rem / 1.5 | 600 | Geist Sans | Nombre de un stat o de un paso ("Entrenos", "Tu objetivo"), en mayúsculas con tracking +0.08em. Nunca título de sección ni texto crítico |
| Tab label | 0.625rem / 1 | 700 | Sora | Labels de bottom nav (ya definido) |
| Mono | 0.875rem / 1.4 | 400–500 | Geist Mono | Números/datos |

- Inputs en mobile ≥ **16px** para evitar zoom de iOS (ya forzado en `globals.css` `@media (max-width:767px)`).
- **Excepción:** los números Metric editables (`NumberStepper` y `SetFocus`, atributo `data-metric-input`) quedan fuera de esa regla para conservar su tamaño. Nunca deben medir menos de 16px.
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
| hero | 28px | Hero con foto del home (única superficie con este radio) |
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
| Toast | `sonner`, `top-center`, `theme="dark"`, respetando safe-area (ya configurado) |
| Loading | Skeleton con superficie `--card-alt`, o `.motion-dot` pulse. Nunca spinner solo en pantalla completa |
| Select/control compacto | `.nutrition-compact-control` (h 2rem, radio md) |
| Filtros | `FilterPanel` compartido: bottom sheet (vaul) con chips de 40px con conteo (en 0 se apagan), orden como filas con check y pie blanco "Ver N …" (§16.3) |

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
- **Excepción del home (`/`), la semana activa (`/rutinas`), el registro (`/rutinas/dia`), alimentos (`/alimentos`), recetas (`/recetas`), el catálogo (`/catalogo`), el detalle de rutina (`/catalogo/rutinas/[id]`) y la configuración (`/configuracion`)**: `MobileHeader` no se renderiza en esas rutas; el home tiene su propio saludo (§10), `/rutinas` su switcher de rutina (§12), `/rutinas/dia` su barra de entreno (§11.1 Z1), `/alimentos` su título con buscador (§13), `/recetas` también (§18), `/catalogo` su barra con buscar y filtros (§16), el detalle de rutina su barra sobre la portada (§19) y `/configuracion` su fila de identidad (§15). Para que el scroll no pase por debajo de la barra de estado en standalone, todas fijan una franja `env(safe-area-inset-top)` con `--background` (`.home-safe-top`).

### 6.2 Bottom nav — **NO TOCAR sin pedido explícito**

`MobileTabBar` + clases `.mobile-tab-bar*` están calibradas (alturas, safe-area, variantes browser vs standalone, estados `aria-current`/`aria-expanded`). **No modificar tamaño, posición ni comportamiento** salvo pedido explícito del usuario.

Único cambio que aplica del redesign: el color de estado activo `#b995ff` (violeta) → `--accent-bright` `#6ee7b7` (emerald) en Fase 1. Nada más de la tab bar se toca.

Tabs por rol (pedido explícito del usuario, 2026-09-15): usuario = Inicio · Rutina · Nutrición · Catálogo · Más; admin = Inicio · Rutina · Nutrición · Admin · Más (el admin también entrena; las secciones de gestión siguen en "Más" y en `/admin`). Un tab queda activo en su ruta y en sus subrutas (`/admin/rutinas` activa "Admin").

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

---

## 10. Home mobile (`/`, <1024px)

Jerarquía de escala fuerte: un solo elemento Display XXL por pantalla, títulos de sección H2 sin kicker en mayúsculas, secciones separadas por espacio y líneas, **no por cards**. Desktop (≥1024) conserva su layout de cards.

### 10.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Saludo | Avatar (link a `/configuracion`), "Hola, {nombre}" (o "Bienvenido a GymControl"), campana y chip de racha (solo si racha > 0). Racha = semanas seguidas cumpliendo los días del plan activo |
| Z2 Semana | 7 círculos de 38px L–D: emerald con check = entreno que cuenta (terminado o de un día anterior), borde claro = hoy |
| Z3 Hero "Hoy toca" | Foto grayscale, radio 28px, alto `clamp(380px, 52svh, 470px)`, título Display XXL (máx. 2 grupos musculares), meta en una línea, CTA 56px + botón de lista que abre un bottom sheet con los ejercicios |
| Z4 Nutrición | Metric L (kcal restantes), 3 barras de macros, filas Desayuno/Almuerzo/Merienda/Cena (Snack solo si hay) con "+" de 44px → `/nutricion/registro?tipo=…` |
| Z5 Esta semana | 3 stats Metric M (entrenos = días del plan hechos, racha en semanas "sem", comidas) de la semana calendario, separados por líneas |
| Z6 Tus músculos | `BodyMuscleFigure` sin card: switch Frente/Espalda, figura 150×300, etiquetas con líneas guía (nombre, kg de la mejor serie, color del rango por 1RM estimado; la seleccionada suma el rango) y una fila de escala. Datos del usuario en todas sus rutinas |

### 10.2 Estados del hero

| Estado | Condición | Hero | CTA emerald |
|---|---|---|---|
| `ready` | Día pendiente, sin entreno en curso | "Grupo & Grupo", meta min · ejercicios · series | "Empezar" en el hero |
| `in_progress` | Entreno sin terminar de hoy (cualquier día de la rutina; manda sobre el próximo pendiente) | "X de N ejercicios" + barra | "Continuar" en el hero |
| `done_today` | Entreno terminado hoy, queda día pendiente | Oscurecido, "Entreno hecho", próximo día | "Registrar comida" en Nutrición |
| `week_done` | Sin día pendiente | Oscurecido, "Semana cerrada" | "Registrar comida" en Nutrición |
| `no_routine` | Sin rutina activa (estado válido: se puede desactivar) | "Elegí tu rutina"; con guardadas: "Activá una de tus rutinas guardadas" | Con guardadas: "Mis rutinas" → `/rutinas`; sin guardadas: "Explorar rutinas" → `/catalogo` |

Reglas: **un solo CTA emerald por pantalla**. "Esta semana" y "Tus músculos" solo con rutina activa. Sin perfil nutricional, Nutrición muestra "Calculá tus kcal y macros" en lugar de números. Home y `/rutinas` usan la misma regla de rutina activa (`findActiveSavedRoutine`): sin marca no hay activa, nunca se toma la primera guardada.

### 10.3 Tus músculos sin datos

- **Vacío** (los 7 grupos sin peso): frente y espalda juntos a 104px, sin etiquetas ni switch, mensaje "Todavía sin datos de fuerza" + escala.
- **Parcial** (≥1 grupo con peso): layout normal + línea "X de 7 grupos con datos".

---

## 11. Registro de entrenamiento (`/rutinas/dia`)

Pantalla de una tarea: **hacer la serie que sigue**. Mobile (<1024) se rediseñó con la dirección "Foco" (2026-09-16): un ejercicio por pantalla, la serie actual como protagonista y el resto del día a un toque. Desktop (≥1024) conserva las cards colapsables con la tabla de series, sin cambios. Mock y decisiones D-D1…D-D6: https://claude.ai/artifact/A9wFreDnAKE6UJexN7Yd4H

### 11.1 Zonas mobile (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Barra | ✕ de 44px (sale del entreno; con series pendientes ofrece terminar), barra segmentada con un segmento por ejercicio relleno según sus series hechas, contador `hechas/plan` en mono y botón de lista de 44px con la cantidad de ejercicios (abre el sheet del día). Debajo, línea chica `Día N · Grupos` e indicador de guardado |
| Z2 Ejercicio | Ilustración del ejercicio **invertida a dark** que absorbe el alto libre (mín. 120px; 88px en pantallas bajas) (`invert(1) hue-rotate(180deg)`: figura clara sobre negro, músculos rojizos), chip `N de M` y chip "Técnica" → `ExerciseDetailModal`. Debajo, nombre en H1 y `series × objetivo · RIR · descanso` |
| Z3 Serie actual | Micro label `Serie N de M`, dos steppers −/+ con el valor en Metric L (kg y reps; en ejercicios de tiempo, una sola columna seg/min), "Anterior" en mono y la línea de sugerencia. El número se achica al ancho que queda entre los botones según sus dígitos (entre 16px y 3rem; a 375px, "22.5" va a ~24px) |
| Z3b Acción | Justo debajo de los steppers, en el flujo: CTA emerald "Serie N hecha" de 56px a todo el ancho. En descanso, el bloque steppers + CTA se reemplaza en el mismo lugar por la tarjeta de descanso; la confirmación de terminar parcial ocupa el mismo lugar |
| Z4 Series | Tira de alto fijo (56px) con una columna plana por serie, **sin cards** (patrón Ladder): segmento de 3px arriba como la barra de Z1 (`--accent-bright` hecha, `--foreground` actual, `--border-strong` pendiente), valor compacto en mono (`22.5×8`) y "Serie N" (✓ si está hecha). Tocar una columna la vuelve la actual. Entra con 2 a 5 series a 360px |

Nada fijo abajo salvo la bottom nav: la acción vive en el contenido y nunca tapa texto (2026-09-16, reemplaza al dock sticky; mock https://claude.ai/artifact/V5k2qjXaUdU6uPJspScm37, opción D-A).

**Pantalla completa sin scroll** (2026-09-17, mock https://claude.ai/artifact/2jK4BdCAVQ8ibv5CwcdjDC): el panel ocupa el alto entre Z1 y la bottom nav; solo la ilustración de Z2 crece o se achica. Ritmo por grupos: Z2 (imagen + nombre) · Z3/Z3b · Z4, con 12px adentro y 20px entre grupos. Con alto ≤700px (variante `short:` en `globals.css`) bajan espacios, CTA y tira a 48px y la tarjeta de descanso se compacta.

El pager se desliza horizontalmente entre ejercicios (scroll-snap) y se navega con ←/→; al completar un ejercicio avanza solo al próximo pendiente.

### 11.2 Estados

| Estado | Condición | Protagonista | Acción (Z3b) |
|---|---|---|---|
| `ready` | Sin series cargadas | Serie 1 del primer ejercicio; kg vacío si no hay historial | "Serie 1 hecha" emerald |
| `active` | Hay series cargadas | Serie actual del ejercicio visible | "Serie N hecha" emerald |
| `resting` | Descanso corriendo | Las series del ejercicio (los steppers se ocultan) | Tarjeta con anillo, el tiempo en Metric L, `+15 s`, `Saltar` y la próxima serie, en el lugar de los steppers. Al llegar a 0 vibra y vuelven steppers y CTA |
| `all_done` | `hechas ≥ plan` | "Entreno completo" en Display XXL + stats series y ejercicios | "Terminar entrenamiento" emerald debajo de las stats |
| Terminar parcial | ✕ o sheet con series pendientes | — | Confirmación inline en el lugar de la acción ("Hiciste X de N. ¿Terminar igual?"), nunca dialog |
| `empty` | Día sin ejercicios | "Día vacío" en Display XXL | Botón neutro a `/rutinas`, sin barra ni pager |

Reglas: **un solo CTA emerald** por pantalla; "Terminar entrenamiento" vive neutro al pie del sheet de ejercicios y en ✕ mientras falten series, y solo pasa a emerald en `all_done`. El resumen muestra únicamente lo que la base registra (series y ejercicios). Sin conexión o error: aviso en Z1 (`--warning` / `--danger`) y en la confirmación; nunca descarte silencioso. Si el día ya se registró esta semana, línea "se guarda como otro entreno".

### 11.3 Piezas que no cambian

| Pieza | Regla |
|---|---|
| Sugerencia | Doble progresión contra el objetivo del plan; primera vez, "apuntá a {objetivo}" |
| Placeholder | Sugerencia de hoy o, si no hay, la serie anterior o el mínimo del objetivo. Marcar con campos vacíos completa con el placeholder |
| Anterior | Formato compacto en mono (`40×10`, `+10×8`, `45s`), etiqueta accesible completa |
| Descanso | Se cuenta contra una hora de fin: sigue siendo correcto con la pantalla bloqueada |
| Técnica e Historial | Un solo bottom sheet del ejercicio con pestañas (§11.4). El desktop conserva el sheet lateral de técnica y el bottom sheet de historial |
| Desktop | Card colapsable por ejercicio con la tabla `Serie · Anterior · kg · reps · ✓` (inputs de 44px y 16px, sin zoom iOS) |

### 11.4 Sheet del ejercicio (mobile)

`ExerciseDetailModal` en <1024: bottom sheet (vaul) de `92dvh` con alto fijo, así no salta al cambiar de pestaña. Lo usan `/rutinas/dia`, `/rutinas`, `/catalogo/rutinas/[id]` y admin. En ≥1024 sigue el sheet lateral de antes, sin cambios (T-D5). Mock y decisiones T-D1…T-D5: https://claude.ai/artifact/5A71A1ZcuZ9bPwmF4y8HpN

| Zona | Contenido |
|---|---|
| Cabecera | Nombre en H1 y `Grupo · Equipamiento` en muted. Debajo, segmentado de 48px `Técnica · Historial` (activo en `--card-alt` con borde, nunca emerald). Solo aparece si el ejercicio tiene historial (hoy, solo en `/rutinas/dia`); los chips "Técnica" e "Historial" del pager abren el sheet en su pestaña |
| Técnica | Ilustración invertida como en Z2 (216px) con selector `Imagen · Animación` (pill de 44px) si hay `gif_url`; la imagen es la vista por defecto (T-D2) y con reduced-motion el GIF no se ofrece. Sin imagen: `--card` con mancuerna en `--foreground-subtle`. Fila del plan con `border-y`: Series · Reps · RIR · Descanso en Metric M (envuelve si no entra). Sin plan (admin): "Rango ideal" del ejercicio. Descripción con título H3 "Cómo se hace". No se muestran `steps` ni `tips`: son texto genérico (T-D3) |
| Historial | "Última vez" con la fecha y una fila de tres números (series, reps o tiempo total, mejor serie) con la sesión anterior debajo en mono. Métrica del tipo en Metric L (1RM estimado · Máximo de reps · Mejor tiempo, T-D4) con la variación desde la primera sesión; cambia al tocar un punto. Gráfico de 150px con escala a la derecha, línea punteada en el mejor valor y puntos tocables de 44px (←/→ con teclado), en tinta neutra. Sesiones: fecha, objetivo y una fila por serie en mono; la mejor marca lleva "Mejor" |

Estados del historial: una sola sesión muestra la mejor serie en Metric L y sus series, sin gráfico ni comparación; sin sesiones no hay pestañas.

---

## 12. Semana activa mobile (`/rutinas`, <1024px)

Recorrer el plan entero sin salir de la pantalla: pestañas por día y un panel que se desliza. Mismo sistema que el home (§10): un protagonista Display XXL, secciones sin cajas, un CTA emerald. Desktop (≥1024) conserva su layout de cards sin cambios. Mock y decisiones: https://claude.ai/artifact/53cupB98h4cLZAxbBcLGrg (v3).

### 12.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Portada | Imagen de la plantilla (`routine_templates.image_url`) a sangre detrás de Z1–Z3: gris, caja al 137% anclada abajo (tapa el 27% superior, donde las portadas traen el título), degradé a `--background`. Sin imagen: la foto del hero del home (`/images/hero.png`) sin recorte. Sin radio ni card: no es el hero del home |
| Z1 Switcher | "Tu rutina · X de N esta semana" + nombre (H2) con chevron → bottom sheet "Mis rutinas" (activar, renombrar inline, desactivar, eliminar con confirmación). Pill de racha a la derecha solo si racha > 0 |
| Z2 Pestañas | Una por día, 64px, número + etiqueta corta: check emerald y día de semana si está hecho ("Hoy" si fue hoy), "En curso", "Hoy"/"Próximo" para el siguiente, grupo principal para el resto. Flechas ←/→ con teclado |
| Z3 Panel del día | Chip · grupos del día en Display XXL (máx. 2, `&` emerald) · figura `MuscleBodyView` frente/espalda de 40px con los grupos del día en `--foreground` (principales) y `--foreground-muted` (resto), sin acento ni rampa · stats en fila (duración, ejercicios, series) · acción del día (Z4) · filas de ejercicios 72px (orden, miniatura, nombre, `series × reps · RIR · descanso`) que abren `ExerciseDetailModal`. Sin "Anterior". El panel se desliza con scroll-snap horizontal |
| Z4 Acción | En el panel, debajo de las stats: botón de 56px a todo el ancho (nota arriba si la hay). Cuando sale de la pantalla al scrollear, aparece arriba una barra compacta sólida (fondo `--background`, borde inferior `--border`) con el día, el resumen y la misma acción en tamaño chico; se va al volver al hero. Nada fijo abajo salvo la bottom nav (2026-09-16, reemplaza al dock sticky; mock https://claude.ai/artifact/V5k2qjXaUdU6uPJspScm37, opción R-A) |

### 12.2 Estados

| Estado | Panel inicial | Acción (Z4) |
|---|---|---|
| `ready` | Próximo día pendiente | "Empezar" emerald en ese día; otros días "Empezar día N" neutro; días hechos "Ver entreno" neutro |
| `in_progress` | Día con entreno sin terminar: barra "X de N ejercicios · sigue …" en lugar de stats, filas hechas con check | "Continuar" emerald |
| `done_today` | Próximo día pendiente | "Empezar día N" neutro + línea "Hoy ya entrenaste" |
| `week_done` | Resumen: "Semana cerrada" XXL, stats (entrenos, racha, series del plan) y filas por día con fecha. Tocar una pestaña abre ese día | Sin acción en el resumen |
| Sin rutina activa | Sin portada: "Elegí tu rutina" XXL + rutinas guardadas con "Activar" + link al catálogo | — |
| Sin rutinas guardadas | Sin portada: "Elegí tu rutina" XXL | "Explorar catálogo" emerald |
| Rutina sin días | Portada + "Rutina vacía" + botón neutro al catálogo, sin pestañas | — |

Reglas: estados de `resolveHeroState` (§10.2). Nunca dos emerald. Lógica pura en `app/lib/routine-week.ts` (tests en `tests/unit/`). Motion: marco de pestaña activa con `layoutId`, crossfade corto al cambiar de día, `AnimatedNumber` en stats, parallax suave de la portada; todo neutralizado con reduced-motion.

---

## 13. Alimentos mobile (`/alimentos`, <1024px)

Buscar un alimento y leer sus macros de un vistazo. Mobile se rediseñó con la dirección "Buscador" (2026-09-16): título grande, buscador fijo arriba, chips de categoría y filas densas; el detalle vive en un bottom sheet. Desktop (≥1024) conserva su lista y el sheet lateral, sin foto ni violeta. Los alimentos no tienen imagen en ninguna vista (AL-D6: sin imágenes en el código, y se borran la columna `foods.image_url` y el bucket `food-images`). Mock y decisiones AL-D1…AL-D7: https://claude.ai/artifact/CVsfSwXJ3WBA9wmViRL2TN

### 13.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Encabezado | `h1` "Alimentos" (2rem Sora 700), meta en mono (`505 alimentos · 1 tuyo`) y "+" redondo neutro de 44px (solo con sesión) que abre "Nuevo alimento" |
| Z2 Buscador | `sticky` bajo la franja segura (64px, fondo `--background`): input de 48px y 16px con ✕ propio y botón ⇅ de 48px con el menú de orden (Relevancia · Más proteína · Menos calorías, cada 100 g). Punto emerald en ⇅ si el orden no es Relevancia. El conteo de resultados se anuncia con `aria-live` |
| Z3 Chips | Fila horizontal de radios: Todos, Tuyos (solo con sesión) y las 6 categorías con su total. Reemplazan al `FilterPanel` en mobile |
| Z4 Frecuentes | Solo con sesión, con registros en los últimos 60 días y en el estado Explorar: H2 + tiles de 136px (nombre, kcal de la última porción, `150 g · 12 veces`). Tocar abre el detalle con esa medida |
| Z5 Lista | En Explorar, agrupada por categoría con encabezado `sticky` (nombre + total); si no, plana con "N resultados". Filas de 64px: anillo de macros de 32px (% de kcal de P/C/G con `MACRO_COLORS`: dato, no acento), nombre + pill "Tuyo", `100 g · 1 u ≈ 50 g`, kcal en Sora 17 y `P · C · G` en mono 11. "Mostrar más" de a 60 |

### 13.2 Estados

| Estado | Condición | Qué cambia | Emerald |
|---|---|---|---|
| Explorar | Sin búsqueda, chip Todos, orden Relevancia | Frecuentes (si hay) + lista agrupada | Ninguno |
| Sin historial | Sin registros en 60 días | Sin Frecuentes | Ninguno |
| Buscando / filtrado / ordenado | Texto, chip ≠ Todos u orden ≠ Relevancia | Sin Frecuentes ni grupos; lista plana con conteo; con "Más proteína" se resalta la P | Ninguno |
| Sin resultados | Nada coincide | "No encontramos «…»" + "Limpiar búsqueda" | "Crear «…»" (con sesión, nombre precargado) |
| Tuyos vacío | Chip Tuyos sin alimentos propios | Paso "Cargá tu primer alimento" | "Crear alimento" |
| Invitado | Sin sesión | Sin "+", Tuyos, Frecuentes, Registrar ni Editar | Ninguno |

Reglas: la lista no tiene emerald; el emerald vive en los vacíos o dentro de un sheet. Nada fijo abajo salvo la bottom nav. Lógica pura en `app/lib/food-catalog.ts` (tests en `tests/unit/`). Motion: marcador de chip con `layoutId` y `AnimatedNumber` en las kcal; todo se neutraliza con reduced-motion.

### 13.3 Detalle y alta

| Pieza | Regla |
|---|---|
| Detalle | Bottom sheet (vaul): categoría + "Tuyo", nombre, porción (base `servingG` o `1 unidad · X g`), kcal en Metric L, barra apilada con el % de kcal y 3 columnas (gramos de la porción y % kcal) separadas por líneas, sin cajas |
| Registrar | Con sesión: CTA emerald "Registrar 1 unidad" / "Registrar 100 g" → `/nutricion/registro?alimento=<id>&medida=<g\|unit>&cantidad=<n>`. El registro (§14) abre el día de hoy con ese alimento cargado y limpia la URL para no duplicar al recargar; el parser es `parseRegistroFoodParams` |
| Propio | "Editar" (secondary) cambia el cuerpo del sheet al formulario, sin sheets apilados; "Eliminar" (ghost) pide confirmación inline. Si el alimento ya se usó en comidas, el servidor lo rechaza con un toast |
| Nuevo alimento | Bottom sheet con `FoodForm` (sin caja interna, kcal estimadas por macros). Al guardar se limpia la búsqueda y se abre el detalle del nuevo |

---

## 14. Registro de comidas mobile (`/nutricion/registro`, <1024px)

Registrar lo que se come en uno o dos toques. Mobile se rediseñó el 2026-09-16 combinando dos direcciones:
- de la B, el presupuesto (medidor y anillos);
- de la C, las comidas (pestañas por comida y un panel que se desliza).

Desktop (≥1024) conserva sus cards sin cambios. Mock y decisiones N-D1…N-D9: https://claude.ai/artifact/HqtexQwHqppi4B25Ujw7LE (v3).

### 14.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Encabezado | A la izquierda, el botón del día ("Hoy · mié 16", "Jueves · 20 nov 2025") con chevron: abre el sheet "Elegí el día". A la derecha, el pill de racha (`N días`, solo si es mayor que 0) o, en días pasados, "Hoy" para volver; después, ≡ de 44px que abre "Tu día" |
| Z2 Presupuesto | Medidor semicircular (`ArcGauge`) con las kcal restantes en 2.875rem (`AnimatedNumber`) y la línea "Comiste N · Objetivo N" en mono. Debajo, 3 anillos de 48px con los gramos restantes de cada macro, en `MACRO_COLORS` (dato, no acento); lo que se pasa dice "+Xg de más" en `--warning`. Sin objetivo: `GoalSetupStep`, la misma pieza que el home |
| Z3 Pestañas | Una por fila de `buildDayMealRows`, con el nombre y un estado: check y kcal si tiene alimentos, "Sigue" (`--accent-bright`) en la primera comida del día sin registrar, "—" en el resto. Entran 4; con más, la 5ª se asoma y la tira scrollea. Marco activo con `layoutId`; se navega con ←/→/Inicio/Fin |
| Z4 Panel | Scroll-snap horizontal; el alto sigue al panel visible. Contenido de arriba abajo: nombre de la comida en Display XXL (escala menor si el nombre es largo); la meta (`780 kcal · P 52 · C 75 · G 22` o "Sin registrar · llevás…") con "…" a la derecha; el CTA en línea "Agregar a {comida}"; filas de alimentos de 60px que abren su sheet; y "Tus frecuentes" ("+" de 44px y "Buscar") en comidas vacías o que ya recibieron un "+" en la sesión |

### 14.2 Estados

| Estado | Condición | Presupuesto | Panel inicial | Emerald |
|---|---|---|---|---|
| Día vacío | Hoy sin comidas | Medidor vacío con el objetivo | Desayuno: "Tu primera comida del día." | "Agregar a desayuno" |
| En curso | Restante > 5% | Blanco | La primera comida sin registrar | Su "Agregar" |
| En objetivo | Restante entre 0 y 5% del objetivo | Arco y número en `--success` | Igual | Igual |
| Por encima | Restante < 0 | Arco lleno; "+N" y "kcal por encima" en `--warning` | Igual | Igual |
| Día cerrado | Desayuno, almuerzo, merienda y cena con alimentos | Según corresponda | "Día cerrado" (XXL) antes de las pestañas: meta, una fila por comida y "Otra comida" neutro | Ninguno |
| Sin objetivo | Sin perfil nutricional | `GoalSetupStep` + "N kcal registradas hoy" | Igual | Su "Agregar" |
| Día pasado | `?fecha=` | Igual, con textos en pasado ("ese día sumaste…") | Igual; vacío: "Sin registros el lunes." | Su "Agregar" |

### 14.3 Sheets

| Sheet | Regla |
|---|---|
| Agregar | Título "Agregar a {comida}". Buscador de 16px (`searchByName`, con el mismo boost que `FoodPicker`) y segmentado Frecuentes · Recetas · Mis alimentos. El "+" agrega al toque con la última cantidad (N-D3). Tocar el nombre abre el paso de cantidad: segmentado g/ml ↔ unidades o porciones (convierte el número), `NumberStepper` (pasos de 10 g, 50 ml o 0,5 u), aporte kcal/P/C/G y "Te quedarían N kcal". El pie muestra "N agregados · K kcal", "Deshacer" del último y "Listo". "Crear “…”" abre `FoodForm` |
| Alimento | El mismo paso de cantidad, con la cantidad registrada. "Guardar" en blanco y "Quitar" con confirmación en línea; si es el único alimento, lo avisa y borra la comida |
| Comida ("…") | Nombre editable en línea (Enter guarda; Esc cancela sin cerrar el sheet). Tipo en chips: si el nombre era el del tipo, cambia con él. Botones Antes/Después y eliminar con confirmación en línea |
| Tu día | Una fila por comida (alimentos y kcal) que lleva a su pestaña, y "Otra comida": se elige nombre y tipo, y se abre Agregar para esa comida nueva |
| Elegí el día | Semana L–D (verde = con comidas, blanco = el elegido, borde = hoy), ‹ › para cambiar de semana y "Otra fecha" (`input type=date`, hasta 365 días atrás) |

Reglas:
- **Un solo CTA emerald** por pantalla: el de la comida que sigue. **Nada fijo abajo** salvo la bottom nav.
- **La comida se crea con su primer alimento** (N-D2), con su tipo, el nombre por defecto y el lugar que da `suggestAfterMealId`. Las acciones pasan por una cola, así dos "+" seguidos nunca crean dos comidas.
- **Deshacer.** Fuera del sheet es un toast de 6 s; dentro, está en el pie. Borra la comida solo si la creó ese agregado y todavía no tiene otros alimentos.
- **Enlaces** (solo hoy):
  - `?tipo=` y `?comida=` abren Agregar para esa comida.
  - `?alimento=&medida=&cantidad=` (desde §13) abre Agregar directo en el paso de cantidad, para la comida que sigue (con el día cerrado, un snack nuevo), y limpia la URL.
  - En desktop `?alimento` se ignora; `?tipo` y `?comida` funcionan como antes.
- **Fuera de esta pantalla**: el `MobileHeader` (§6.1), las ilustraciones de `meals/*.png`, la frase motivacional y la card de racha (N-D5…N-D7).
- **Código.** La lógica pura está en `app/lib/meal-diary.ts` y `app/lib/meal-amounts.ts` (tests en `tests/unit/`); los componentes, en `app/components/registro/`.
- **Motion.** Marco de pestaña y segmentado con `layoutId`, arco con `pathLength`, `AnimatedNumber` y anillos. Todo se neutraliza con reduced-motion.

---

## 15. Configuración mobile (`/configuracion`, <1024px)

Ver y ajustar el objetivo diario. Mobile se rediseñó con la dirección "Tu plan" (2026-09-16): el resultado es la pantalla (kcal en Display XXL con la cuenta que lo explica) y los datos que lo causan son filas que abren bottom sheets. Sin perfil, un flujo de 6 pasos arma el plan. Desktop (≥1024) conserva sus cards sin cambios. Mock y decisiones C-D1…C-D10: https://claude.ai/artifact/VX3CrPmQLQctJXyb3YohJr (v2).

### 15.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Identidad | Avatar de 44px (inicial o ícono), nombre en H3 (sin nombre: acción de texto "Agregá tu nombre") y email en caption. A la derecha, el indicador de guardado (`aria-live`) |
| Z2 Plan | Micro label "Tu objetivo diario", kcal en Display XXL, ecuación `mantenimiento − ajuste = objetivo` en 3 celdas entre líneas (`border-y`), macros en Metric M con el punto de `MACRO_COLORS` y barra de reparto de 6px con el % en mono (dato, no acento) |
| Z3 Cómo lo calculamos | H2 + filas de 72px que abren su sheet: Tu cuerpo (miniatura de la referencia de grasa y `28 a · 178 cm · 78 kg · 22%`), Actividad (medidor de 5 barras en tinta neutra) y Objetivo (ajuste `−20%` en mono). Caption "Estimación nutricional…" |
| Z4 Cuenta | H2 + filas de 52px: Nombre (sheet), Email (solo lectura), Cerrar sesión (POST `/auth/signout`) y Borrar cuenta (rose, sheet) |

### 15.2 Sheets

Bottom sheets (vaul) con título a la izquierda y "Listo" a la derecha. Guardan solos: debounce de 800 ms y guardado inmediato al cerrar.

| Sheet | Contenido |
|---|---|
| S1 Tu cuerpo | Sexo (`SegmentedControl`), edad, altura y peso con `NumberStepper` (−/+ y número tocable; peso de a 0,5), fila Grasa corporal y "Tu objetivo: N kcal" en vivo |
| S2 Grasa corporal | Vista dentro de S1 con flecha atrás (sin sheets apilados): carrusel `radiogroup` con "No lo sé" y las 5 figuras del sexo elegido, la descripción de la elegida y una nota sobre la masa magra |
| S3 Actividad | 5 opciones en filas con medidor y check |
| S4 Objetivo | 3 opciones con las kcal que daría cada una y su ajuste, y "Calculados / Los fijo yo". En manual: kcal + 3 macros (precargados con lo calculado) y la suma de los macros (lime si coincide ±10%, ámbar si no) |
| S5 Borrar cuenta | Escribir "BORRAR" habilita el botón rose; Cancelar neutro. Desktop sigue con dialog |
| S6 Nombre | Input de 40 caracteres con contador; guarda al cerrar o con Enter |

### 15.3 Estados

| Estado | Condición | Qué cambia | Emerald |
|---|---|---|---|
| Plan calculado | Perfil en modo auto | Z1–Z4 | Ninguno: el acento queda para la selección y el guardado |
| Fijado a mano | `targetMode = manual` | Z2: "· fijado a mano", la suma de macros reemplaza a la ecuación y "Calculado con tus datos daría N". Z3: Objetivo primero y el resto atenuado ("No cambia tu objetivo fijo") | Ninguno |
| Sin perfil | Sin fila en `nutrition_profiles` | Z2: "Calculá tu plan" en Display XXL; sin Z3. Nunca se muestran valores por defecto como si fueran del usuario | "Empezar" |
| Flujo de alta | "Empezar" | Reemplaza la pantalla: ✕, barra de 6 segmentos y `n/6`. Pasos: Sobre vos (sexo + edad) · Altura · Peso · Grasa ("No lo sé" preseleccionado) · Actividad · Objetivo. Pregunta en Display XXL con interlineado 1.02 (con 0.88 el "¿" y las tildes chocan entre líneas), `NumberStepper` grande y "Atrás" en texto. No guarda hasta el final | "Siguiente" / "Calcular mi plan", en el flujo debajo del control |
| Guardando / error | Autosave | Z1: "Guardando…" → "Guardado" (2 s) · "No se guardó · Reintentar" | — |
| Sin conexión | `navigator.onLine = false` | Z1: "Sin conexión" (`--warning`). Los controles de los sheets y el CTA del flujo se deshabilitan con nota; lo pendiente se guarda al volver la red | — |

Reglas: sin `MobileHeader` (§6.1) y nada fijo abajo salvo la bottom nav. Lógica pura en `app/lib/profile-plan.ts` (tests en `tests/unit/`); estado y autosave en `app/configuracion/useProfileForm.ts`, compartido con desktop. Motion: `AnimatedNumber` en kcal, ecuación y macros, check de opción con `fadeScale` e indicador del `SegmentedControl` con `layoutId`; todo se neutraliza con reduced-motion.

---

## 16. Catálogo mobile (`/catalogo`, <1024px)

Elegir una rutina según cuántos días por semana se puede entrenar. Mobile se rediseñó con la dirección "Planificador" (2026-09-16): una pregunta, el número como protagonista y resultados que se adaptan a la respuesta. Desktop (≥1024) conserva su grilla de cards con paginación, sin violeta. Mock y decisiones C-D1…C-D8 · B-D1…B-D5: https://claude.ai/artifact/CgEQL6GSTzxnM26BDBPYX2 (v3).

En el catálogo actual cada cantidad de días corresponde a un solo nivel (2–3 principiante, 4–5 intermedio, 6 avanzado). Por eso "una por nivel" solo aplica con Todas.

### 16.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Barra | "Catálogo" (13px, muted), Buscar y Filtros de 44px. Al buscar se vuelve campo `type=search` de 16px + Filtros + "Cancelar" |
| Z2 Pregunta | H1 "¿Cuántos días por semana podés entrenar?" + rueda horizontal `Todas · 2…6` (solo cantidades con rutinas bajo los filtros): el número centrado en Metric XXL, los vecinos chicos y tocables (≥3:1), marcador de 28×4 y "días por semana" / "Deslizá para elegir días" |
| Z3 Semana | Solo con un número: barra de 7 segmentos (N en `--foreground`, el resto en `--border`) + "N entrenos · 7−N descansos". Sin letras de días: la rutina no guarda días fijos |
| Z4 Resultados | Todas: H2 "Para cada nivel" + carrusel con una card por nivel (la más reciente de cada uno; se oculta con menos de 2 niveles) y "Las N rutinas" en filas. Con número: H2 "N rutinas de D días" + nivel a la derecha, una card grande (la primera del orden) y el resto en filas; con 3 o menos, "¿Pocas opciones? Probá con …" y las cantidades vecinas |
| Barra compacta | Aparece arriba al pasar la rueda, sólida (`--background`, borde inferior): "Catálogo", Buscar, Filtros y los días en fila (44px) para cambiar sin volver arriba |

### 16.2 Estados

| Estado | Condición | Qué cambia | Emerald |
|---|---|---|---|
| Todas | Al entrar | Carrusel por nivel + lista completa | CTA de la card visible |
| Número | Rueda en 2…6 | Barra semanal, card grande + filas, pista si hay 3 o menos | CTA de la card grande |
| Tu rutina | La card es tu rutina activa | Pill "Tu rutina activa" y CTA neutro | Ninguno |
| Buscando | Buscar abierto | Sin pregunta, rueda, barra ni carrusel. Busca todas las palabras (sin tildes) en nombre y descripción, con los filtros del sheet; resalta la coincidencia; el conteo se anuncia con `role=status` | Ninguno |
| Sin resultados | Búsqueda + filtros sin coincidencias | "Sin resultados", qué falla y cuántas hay sin filtros; "Quitar filtros" (neutro) y "Borrar búsqueda" | Ninguno |
| Invitado | Sin sesión | Sin marcas de activa ni guardada | Igual que con sesión |
| Catálogo vacío | Sin rutinas publicadas | "Pronto hay más" en Display XXL + "Ir a Rutina" neutro | Ninguno |

### 16.3 Piezas

| Pieza | Regla |
|---|---|
| Card grande | Radio 20, `--card`, portada de 170px con el recorte de §12.1 (gris, caja al 137% anclada abajo; sin portada, `/images/hero.png`), pill `[● Tu rutina activa ·] Nivel · N días`, nombre en H2, `Objetivo · N ejercicios · N series` y CTA de 56px a `/catalogo/rutinas/[id]` (toda la card es tocable) |
| Fila | 92px: miniatura de 64px con el mismo recorte, nombre ("dias" → "días"), `Nivel · Objetivo · N ejercicios`, estado ("Tu rutina activa" con punto emerald, "Guardada" con check neutro) y chevron |
| Rueda | `radiogroup` con scroll-snap. El scroll solo propone: confirma al asentarse si lo movió el usuario, con tap o con ←/→/Home/End. Escala y color siguen la posición sin re-render por frame |
| Filtros | `FilterPanel` compartido (§4): nivel y objetivo con conteos (en 0 se apagan) y orden (Más recientes · Nombre A–Z · Más ejercicios) en filas con check. Pie blanco "Ver N rutinas" |

Reglas: un solo emerald por pantalla; nada fijo abajo salvo la bottom nav. Lógica pura en `app/lib/routine-catalog.ts` (tests en `tests/unit/`). Motion: rueda ligada al scroll, marcador de la barra compacta con `layoutId` y fundido corto de resultados al cambiar de número; todo se neutraliza con reduced-motion. El filtro no se guarda en la URL: al volver del detalle arranca en Todas.

---

## 17. Acceso mobile (`/auth/login`, <1024px)

Entrar a la app. Mobile se rediseñó con la dirección "Pasos" (2026-09-16):
- La entrada es una portada con foto y dos acciones.
- El email y el código se piden de a uno, dentro de un bottom sheet casi a pantalla completa.
- Desktop (≥1024) conserva la card centrada. Solo cambian el copy, el logo blanco, la "G" de Google, la cuenta regresiva de reenvío y el aviso de error.
- Mock y decisiones L-D1…L-D12: https://claude.ai/artifact/BQqaKjgprCBmZxQfVLAMkS (v2).

La ruta no usa el app-shell: sin `MobileHeader`, sin bottom nav ni sidebar (§6).

### 17.1 Entrada

| Zona | Contenido |
|---|---|
| Z1 Portada | `hero.png` en gris (`grayscale`, brillo 0.62) a sangre, hasta 60dvh (máx. 520px), con fundido a `--background`. Arriba, el logo en blanco y "GymControl" en Sora 600. Abajo, el título en dos tonos "Tu semana, / bajo control." (Sora 600, 2.75rem/1.02, primera línea en `--foreground-muted`) y "Rutinas · Series · Comidas" en caption |
| Z2 Aviso | Solo si corresponde: una línea entre bordes (`border-y`) con ícono y dos textos (ver §17.3) |
| Z3 Acciones | "Continuar con Google" (blanco, con la "G" oficial) arriba y "Continuar con email" (emerald, el único CTA) abajo, de 56px y radio 14px. Debajo, "Sin contraseña. Te mandamos un código por mail." en caption `--foreground-muted`. Pegadas al pie con safe-area |

En horizontal (`max-height: 500px`) la foto pasa a una columna izquierda del 40% y las acciones quedan a la derecha.

### 17.2 Sheet de acceso

Bottom sheet (vaul) al 92dvh con dos pasos. Arriba, una barra con `1 / 2` (Geist Sans con `tabular-nums`), el progreso en 2 segmentos de 2px y ✕.
- Mientras hay un pedido en curso, el sheet no se cierra.
- Si se cierra con el código ya enviado, al reabrirlo vuelve al paso 2.
- Al cerrar, el foco vuelve al botón que lo abrió.

| Paso | Contenido |
|---|---|
| 1 Email | Título "¿Con qué email / entrás?" (Sora 600, 1.875rem, primera línea muted). Campo de 68px con etiqueta "Email" arriba del valor (16px, la regla de §2.1 para iOS) y foco emerald. Mientras falta el dominio, chips `@gmail.com` · `@hotmail.com` · `@outlook.com` (filtrados por lo que va después de la "@") que lo completan. "Enviar código" emerald al final del flujo, así queda sobre el teclado |
| 2 Código | ‹ vuelve al paso 1. Título "Revisá tu mail. / Escribí el código.". Fila entre bordes "Enviado a {email}" con "Cambiar". Seis dígitos en Sora 600 de 2.75rem con línea de 2px debajo y un hueco entre el tercero y el cuarto (`InputOtp variant="display"`). Al completar el sexto (o al pegar) se verifica solo. Debajo, el anillo de reenvío y "Abrir Gmail" (solo para `gmail.com`/`googlemail.com`, abre `mail.google.com`) |

Números sin Geist Mono en esta ruta: su 0 lleva barra (pedido del usuario). Van en Sora o en Geist Sans con `tabular-nums`.

### 17.3 Estados

| Estado | Condición | Qué cambia |
|---|---|---|
| Sesión requerida | `?reason=auth-required` | Aviso Z2 `--info`: "Iniciá sesión para seguir" / "Esa pantalla necesita tu cuenta." |
| Sesión cerrada | `?status=signed-out` | Toast "Cerraste sesión." (sonner) y se limpia el parámetro |
| Error de Google | `?error=google-*` | Aviso Z2 `--danger` con el motivo y "entrá con tu email" |
| Error de cuenta | `?error=missing-*` o la verificación lo devuelve | Aviso `--danger` "No pudimos abrir tu cuenta". En el sheet reemplaza al código, con "Volver a empezar" neutro |
| Email inválido | Al tocar "Enviar" | Borde `--danger` y el motivo debajo del campo ("Falta la “@”.", "Falta el final del email (por ejemplo, .com)."). El botón nunca se deshabilita por esto |
| Enviando / verificando | Pedido en curso | Botón con `LoadingDots` y "Enviando código" · dígitos atenuados y "Verificando…" |
| Espera de reenvío | 60 s después de cada envío, o con `otp-rate-limited` | Anillo de 22px que se vacía y "Reenviar en 0:42". Con `otp-rate-limited` en el paso 1: nota `--warning` y "Enviar código" deshabilitado hasta que termina la cuenta |
| Código enviado de nuevo | "Reenviar código" | Se vacía el código y aparece el toast "Te mandamos otro código." |
| Código incorrecto | `invalid-or-expired-otp` | Dígitos y líneas en `--danger`, un temblor corto y "El código no coincide o venció. Revisalo o pedí otro.". Al borrar, el código se vacía |
| Verificado | 200 | Título "Listo. / Entrando a tu semana.", dígitos en `--success` y "Código correcto". A los 550 ms, `location.assign` |
| Sin conexión | `navigator.onLine = false` | Nota `--warning` "Sin conexión. Conectate para recibir el código." y acciones deshabilitadas |

Reglas:
- Los errores van junto al dato. En mobile, el toast queda solo para confirmaciones.
- Un solo emerald por pantalla: "Continuar con email" y, en el sheet, "Enviar código". El foco y la línea activa de los dígitos son selección, no CTA.
- La "G" multicolor de Google es la única excepción a "solo lucide" (§4), porque la marca la exige.
- Código: la lógica pura está en `app/lib/auth-otp.ts` (textos, validación y dominios; tests en `tests/unit/`). El estado del flujo, compartido con desktop, está en `app/components/auth/useOtpFlow.ts`. Los componentes están en `app/components/auth/`.
- Motion:
  - Cambio de paso con `fadeUp`.
  - Temblor de error con framer-motion.
  - Anillo con transición lineal de 1 s.
  - Todo se neutraliza con reduced-motion.

---

## 18. Recetas mobile (`/recetas`, <1024px)

Encontrar una receta y registrarla. Mobile se rediseñó con la dirección "Buscador" (2026-09-16), la misma familia que alimentos (§13): título, buscador fijo, chips y filas densas; el detalle vive en un bottom sheet. Desktop (≥1024) conserva su grilla y el sheet lateral, sin imágenes ni violeta. Mock y decisiones RE-D1…RE-D10: https://claude.ai/artifact/LxJDDhEjaoWx6XCsQvqoz9 (v3).

**Las recetas no tienen imágenes** en ninguna vista (RE-D2). Se borraron del código, de los scripts, la columna `recipes.image_url` y el bucket `recipe-images`. Sin foto, una receta se reconoce por su anillo de macros y la línea de ingredientes.

### 18.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Encabezado | `h1` "Recetas" (2rem Sora 700), meta en mono (`25 recetas · 2 tuyas`; lo segundo solo si hay) y "+" redondo neutro de 44px (solo con sesión) que abre "Nueva receta" |
| Z2 Buscador | Igual que §13.1 Z2: `sticky` de 64px, input de 48px y 16px con ✕ propio y ⇅ con el menú de orden (Relevancia · Más proteína · Menos calorías, por porción). Busca sin tildes en el nombre y en los ingredientes; lo que coincide en el nombre va primero |
| Z3 Chips | Radios: Todas, Tuyas (solo con sesión) y las categorías con recetas (Desayuno · Comida · Snack) con su total. Reemplazan al `FilterPanel` en mobile |
| Z4 Lista | En Explorar, agrupada por categoría con encabezado `sticky`; si no, plana con "N recetas" o "N resultados". Filas de 72px: `MacroRing` de 32px (dato, no acento), nombre en hasta 2 líneas + pill "Tuya", ingredientes en una línea, kcal de la porción en Sora 17 y `P · C · G` en mono 11. Sin paginación |

### 18.2 Estados

| Estado | Condición | Qué cambia | Emerald |
|---|---|---|---|
| Explorar | Sin búsqueda, chip Todas, orden Relevancia | Lista agrupada | Ninguno |
| Buscando / filtrado / ordenado | Texto, chip ≠ Todas u orden ≠ Relevancia | Lista plana con conteo (`aria-live`); la coincidencia se subraya en emerald; con "Más proteína" se resalta la P; punto emerald en ⇅ | Ninguno |
| Sin resultados | Nada coincide | "No encontramos «…»" + "Limpiar búsqueda" | "Crear receta «…»" (con sesión, nombre precargado) |
| Tuyas vacía | Chip Tuyas sin recetas propias | Paso "Armá tu primera receta" | "Crear receta" |
| Invitado | Sin sesión | Sin "+", Tuyas ni Registrar | Ninguno |
| Catálogo vacío | Sin recetas publicadas | "Todavía no hay recetas" en Display, sin buscador ni chips | "Crear receta" (con sesión) |

### 18.3 Detalle y alta

| Pieza | Regla |
|---|---|
| Detalle | Bottom sheet (vaul): categoría + "Tuya" y ✕; nombre (1.625rem); ingredientes en una línea; kcal en Metric L con "N porciones · N g" y `MacroRing` de 88px al lado; 3 columnas de macros (gramos y % kcal) separadas por líneas |
| Porciones | `NumberStepper` (`size="m"`) de a 0,5 entre 0,5 y 20. Recalcula kcal, macros y los gramos de cada ingrediente |
| Comida | Fila "Comida · La que sigue" que se despliega en el lugar como radios: La que sigue · Desayuno · Almuerzo · Merienda · Cena · Snack |
| Registrar | Con sesión: CTA emerald "Registrar 1 porción" / "Registrar 1,5 porciones en cena" → `/nutricion/registro?receta=<id>&medida=unit&cantidad=<n>[&tipo=<comida>]`. El registro (§14) abre hoy el paso de cantidad con la receta cargada: en la comida elegida o, sin `tipo`, en la que sigue; limpia la URL. El parser es `parseRegistroRecipeParams`. Invitado: botón neutro "Ingresá para registrar" → `/auth/login` |
| Ingredientes | H2 + filas de 52px: nombre, gramos y kcal para las porciones elegidas (proporción `servingG / peso base`), con una barra de 4px en `--foreground-muted` del aporte de kcal |
| Propia | Recetas propias (o admin): "Editar" (secondary) cambia el cuerpo del sheet a `RecipeForm`, sin sheets apilados; "Eliminar" (ghost) pide confirmación en línea y archiva |
| Nueva receta | Bottom sheet con `RecipeForm` (nombre precargado desde "Crear receta «…»"). Al guardar se limpia la búsqueda y se abre el detalle de la nueva |

Reglas: la lista no tiene emerald; el emerald vive en los vacíos o en el sheet. Nada fijo abajo salvo la bottom nav. Sin `MobileHeader` (§6.1). Lógica pura en `app/lib/recipe-catalog.ts` (tests en `tests/unit/`); componentes en `app/components/recetas/`. Motion: marcador de chip con `layoutId`, fundido corto al cambiar chip u orden y `AnimatedNumber` en las kcal del detalle; todo se neutraliza con reduced-motion.

---

## 19. Detalle de rutina mobile (`/catalogo/rutinas/[id]`, <1024px)

Decidir si una rutina del catálogo sirve y empezar a usarla. Mobile se rediseñó el 2026-09-16 combinando dos direcciones del mock:
- de la C ("Balance"), la parte de arriba: portada, nombre, acción, stats y qué músculos trabaja;
- de la B ("Semana"), los días: pestañas y un panel que se desliza, como en `/rutinas` (§12).

Desktop (≥1024) conserva su layout, sin violeta. Mock y decisiones RD-D1…RD-D11: https://claude.ai/artifact/Bo9UqSiyKT1kz9p2uWbxFU (v2).

### 19.1 Zonas (arriba → abajo)

| Zona | Contenido |
|---|---|
| Z1 Barra | ← de 44px a `/catalogo?dias=N` (el catálogo abre en esa cantidad de días) y, a la derecha, bookmark "Guardar para después" (solo en Nueva y Guardada) y "…", que abre un bottom sheet con Ver en Mis rutinas, Compartir y Desactivar. Sin `MobileHeader` |
| Z2 Portada | `RoutineCover` de §12.1 (gris, recorte al 137%, parallax). Encima: pill de estado, nombre en **Display XXL** sin el sufijo "N días" cuando coincide con los días de la rutina (ya lo dice la pill) y la descripción |
| Z3 Acción | CTA de 56px según el estado (§19.2). Cuando sale de la pantalla aparece arriba una barra compacta sólida con el nombre, `N días · ~M min` y la misma acción en chico (patrón R-A) |
| Z4 Stats | `WeekStats`: Días · Por día (promedio de `estimateDayMinutes`, redondeado a 5) · Series por semana |
| Z5 Qué trabajás | H2 + `MuscleBodyView` frente y espalda de 56px y una barra de 6px por grupo con sus series por semana. Tinta neutra: 8 o más series en `--foreground`, menos en `--foreground-muted`, sin trabajo en el gris del cuerpo. Fila de escala. Dato, no acento |
| Z6 Los N días | H2 + `DayTabs` (grupo principal, sin estados de semana) y panel con scroll-snap: micro `Día N · nombre`, grupos en **H1** con el `&` emerald, meta en mono (`~35 min · 5 ejercicios · 16 series`) y filas de 72px (miniatura, `4×` en mono + nombre, `6–10 reps · RIR 1 · 2 min`) que abren `ExerciseDetailModal` (§11.4). El alto sigue al panel visible |
| Pie | Objetivo y equipamiento en mono |

### 19.2 Estados

| Estado | Condición | Pill | Acción (Z3) |
|---|---|---|---|
| Invitado | Sin sesión | `Nivel · N días` | "Entrá para usarla" emerald → `/auth/login?reason=auth-required`. Sin bookmark |
| Nueva | Con sesión, sin guardar | `Nivel · N días` | "Usar esta rutina" emerald (la guarda y la activa). El bookmark la guarda sin activar |
| Guardada | Guardada, no activa | Bookmark + `Guardada · Nivel · N días` | "Activar rutina" emerald + "Ver en Mis rutinas" en texto. Bookmark lleno, lleva a `/rutinas` |
| Activa | Es tu rutina activa | Punto emerald + `Tu rutina activa · N días` | "Ver mi semana" neutro. "Desactivar" vive en "…" |
| Archivada | Fuera del catálogo y sin guardar | `Ya no disponible` en `--warning` | Aviso + "Ver rutinas de N días" neutro, sin emerald ni barra compacta |
| Rutina sin días | La plantilla no tiene días | Según el estado | Sin Z4–Z6: "Esta rutina todavía no tiene días." |

Reglas: un solo emerald por pantalla (el `&` del día es texto, no acción). El nombre propio no se pide acá: se renombra en Mis rutinas. Las acciones son las server actions de siempre (redirigen con `?status=` y `StatusToast` avisa); el botón muestra "Guardando…" mientras tanto. Nada fijo abajo salvo la bottom nav. Lógica pura en `app/lib/routine-detail.ts` (tests en `tests/unit/`), componentes en `app/components/rutina-detalle/`. Motion: parallax de portada, `AnimatedNumber` en stats, barras que crecen al entrar, marco de pestaña con `layoutId`; todo se neutraliza con reduced-motion.
