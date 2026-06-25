# Plan: corrección visual del dashboard principal (PWA) vs referencia

## Context

La pantalla principal del dashboard (`app/page.tsx`, ruta `/` — `app/dashboard/page.tsx` solo redirige a `/`) no replica con fidelidad el mockup `docs/design-references/dashboard-principal-redesign-v1.png`. El usuario pide **corrección dirigida**, no rediseño: acercar layout, jerarquía, tamaños y formas a la referencia. Todos los sub-componentes viven dentro de `app/page.tsx` (Hero, `SummaryStatCard`, `NutricionTodayCard`, `CargaMuscularCard`, `ComidasHoyCard`, las dos cards de calendario inline). Componentes base: `Button` (`app/components/ui/Button.tsx`), `AnimatedProgressRing` (`app/components/ui/ProgressRing.tsx`).

---

## 1. Diagnóstico — diferencias actuales vs referencia

### Hero
- Botón "Comenzar entrenamiento": hoy es violeta plano (`bg-[var(--accent)]` vía `Button`), sin gradient, sin icono play, texto sin play a la izquierda. Referencia: **gradient violeta**, **icono ▷ (play) a la izquierda**, texto centrado.
- "Ver rutina": alto `h-7` (28px). El botón primario es `size="sm"` → `h-9` (36px). **Distinta altura.** Referencia: ambos misma altura.
- Espaciado vertical comprimido: `gap-2` en el contenedor y `gap-0.5` título/subtítulo. Referencia tiene más aire entre "Hoy toca" → título, título → "Día N de tu rutina semanal", y subtítulo → fila de stats.

### 3 cards resumen (Entrenamiento / Nutrición / Constancia)
- Label usa `text-[9px]` + `truncate`. En la referencia los títulos entran completos sin puntos suspensivos. Hoy "Entrenamiento" puede truncarse. Falta achicar el título y/o reducir tracking para que entre.

### Nutrición de hoy + Carga muscular
- `NutricionTodayCard`: layout **horizontal** (ring 84px a la izquierda, barras de macros a la derecha). Referencia: **ring más grande, centrado**, con **barras debajo**.
- Dentro del ring hoy: `{totalKcal}` + "kcal" y debajo "/ {targetKcal}". Referencia: dentro del círculo **"X kcal de Y"** (actual / objetivo juntos).

### Comidas de hoy (estado vacío)
- Icono `UtensilsCrossed size-8` y bloque "Sugerencia" relativamente grandes. Referencia: **icono y bloque sugerencia más chicos**.
- El dibujo (`Utensils`) está **debajo** del texto de sugerencia y chico (`size-6`). Referencia: dibujo **a la derecha** del texto de sugerencia y **más grande**, igualando el ancho de "Sugerencia" + "Registrá tu primera comida…".

### Cards inferiores (Constancia semanal / Registro nutricional)
- Círculos del calendario semanal algo grandes → poco espacio entre ellos. Referencia: **círculos un poco más chicos, más separación**.
- "{n} de 7 días" con espaciado de palabras normal. Referencia: **más espacio entre palabras** (tracking) en "0 de 7 entrenamientos / días".

---

## 2. Plan de corrección por bloque visual

### Bloque A — Hero (CTAs + espaciado)
1. **Botón primario con gradient + play.** Reemplazar el `className` plano del `Button` por un gradient violeta y agregar `<Play>` (lucide `Play`) a la izquierda con `fill-current`. Mantener `asChild` + `Link`. Gradient sugerido: `bg-[linear-gradient(135deg,#8b5cf6_0%,#6d28d9_100%)]`, texto centrado (`justify-center`), sombra existente.
2. **Igualar alturas.** Subir "Ver rutina" de `h-7` a `h-9` para igualar el `size="sm"` del primario (ambos 36px). Ajustar padding vertical para centrar texto.
3. **Más aire vertical.** En el contenedor de contenido (`flex h-full flex-col justify-end gap-2 …`) subir el gap a `gap-3`; en el bloque título/subtítulo subir `gap-0.5` → `gap-1.5`; asegurar separación subtítulo → stats (la fila de stats ya es hermana con `gap-3` del contenedor).

### Bloque B — 3 cards resumen
4. En `SummaryStatCard` → `CardLabel`/label interno: reducir tamaño/tracking del título para que **"Entrenamiento" entre completo sin truncar**. Cambiar `text-[9px] … tracking-[0.06em]` a algo como `text-[8.5px] tracking-tight` o quitar `truncate` si el ancho lo permite. Validar con Playwright (es el caso más ajustado).

### Bloque C — Nutrición de hoy (reestructura interna)
5. Cambiar el bloque "ring izquierda + macros derecha" a **columna**: ring centrado arriba, barras de macros debajo a ancho completo.
   - Subir `AnimatedProgressRing size={84}` → `~108–116`, `strokeWidth` `7` → `8`.
   - Dentro del ring: una sola línea/stack **"{totalKcal} kcal"** grande + **"de {targetKcal}"** debajo (sustituye el "/ {targetKcal}" externo actual). Mantener `--accent-bright`.
   - Barras de macros (Prot./Carb./Gras.) pasan a fila inferior full-width (mantener `AnimatedMacroBar`, colores actuales).
   - Mantener el CTA "Agregar comida" abajo.

### Bloque D — Comidas de hoy (estado vacío)
6. **Achicar** icono izquierdo (`size-8` → `size-6`) y el bloque "Sugerencia" (labels y texto un punto más chicos).
7. **Mover el dibujo a la derecha del texto de sugerencia y agrandarlo**: reordenar la columna derecha para que `Utensils` quede al lado del párrafo (no debajo), `size-6` → `~size-10`, de modo que el ancho del dibujo + texto iguale el del título "Sugerencia". Reestructurar el contenedor `w-20` derecho (posible flex horizontal interno o ensanchar la columna).

### Bloque E — Cards inferiores (calendarios)
8. **Círculos más chicos + más separación.** Esto vive en `TrainingCalendarCard` / `NutritionCalendarCard` (`variant="weekly" bare`). Verificar el tamaño de los días dentro de esos componentes y reducir tamaño del círculo y/o aumentar gap. **Cambio acotado al render `weekly bare`** para no afectar otras vistas del calendario.
9. **Más espacio entre palabras** en el texto "{n} de 7 días": agregar `tracking-wide`/`tracking-wider` al `<p>` correspondiente en ambas cards inline.

---

## 3. Archivos / componentes a modificar

- `app/page.tsx` (núcleo de los cambios):
  - Hero CTAs + espaciado (Bloque A) — import nuevo `Play` de `lucide-react`.
  - `SummaryStatCard` (Bloque B).
  - `NutricionTodayCard` (Bloque C).
  - `ComidasHoyCard` estado vacío (Bloque D).
  - Cards de calendario inline: tracking del texto "de 7 días" (Bloque E.9).
- `app/components/shared/TrainingCalendarCard.tsx` y `app/components/shared/NutritionCalendarCard.tsx` (Bloque E.8) — **solo** si el tamaño/separación de los círculos se controla ahí; acotar al `variant="weekly" bare`.
- Sin tocar: `Button.tsx` (override por className), `ProgressRing.tsx` (solo se pasan props distintas).

No se modifica: lógica de datos, auth, rutas, fetching, navbar inferior, ni otras pantallas.

---

## 4. Riesgos / limitaciones

- **3 cards resumen sin truncar (B):** el ancho en mobile es chico; "Entrenamiento" es la palabra más larga. Si no entra ni reduciendo tamaño razonable, la aproximación más cercana es reducir tracking + 1px de fuente manteniendo legibilidad. Validar en viewport real.
- **Ring más grande (C):** la card es media columna; agrandar el ring puede empujar las barras. Acotar `size` para que ring + barras + CTA entren sin overflow.
- **Calendarios (E.8):** si los círculos vienen de componentes compartidos, achicarlos podría afectar otras vistas → restringir el cambio al modo `weekly bare`. Si no es parametrizable sin riesgo, dejar tamaño y solo aumentar el gap (aproximación más segura).
- **Fidelidad de fuentes/medidas:** el mockup es PNG; tamaños exactos en px se aproximan a ojo + medición con Playwright, no son 1:1 garantizado.

---

## 5. Validación con Playwright (MCP / playwright-cli)

1. Levantar la app (dev server) y loguear con las credenciales admin de `.env.local` (`EMAIL` / `EMAIL_PASSWORD`).
2. Navegar a `/` (dashboard principal).
3. Emular **viewport mobile/PWA** (p. ej. 390×844) — es PWA, mobile-first.
4. Screenshot **antes** del cambio → comparar lado a lado con `docs/design-references/dashboard-principal-redesign-v1.png`.
5. Implementar Bloques A–E.
6. Screenshot **después** → comparar contra la referencia bloque por bloque: gradient+play del botón, igualdad de alturas de CTAs, aire del hero, títulos de las 3 cards sin "…", ring grande con "X kcal de Y" + barras debajo, estado vacío de comidas (icono/sugerencia chicos + dibujo a la derecha grande), círculos de calendario más separados, tracking de "de 7 días".
7. **Ronda de corrección visual:** ajustar px/spacing/tamaños según diferencias detectadas y repetir screenshot hasta máxima fidelidad.
8. Confirmar que no hay overflow/scroll horizontal ni el navbar inferior se alteró.

> MCPs/skills previstos: **Playwright MCP** (inspección/screenshots, obligatorio), **shadcn MCP** (consultar Button/Progress si hace falta), **Context7** (docs Tailwind/Framer si surge duda), **Magic UI** solo si aporta microinteracción mínima. Si alguno no está disponible, se sigue con las herramientas presentes y se avisa.
