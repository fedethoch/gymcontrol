# Plan: corrección fidelidad visual Dashboard principal (PWA)

## Contexto

Referencia: `docs/design-references/dashboard-principal-redesign-v1.png`.
Implementación viva: **`app/page.tsx`** (la ruta `/`; `app/dashboard/page.tsx` solo redirige a `/`).

La implementación actual ya es el rediseño y se parece a la referencia, pero
tiene desajustes de **espaciado y tamaños** en 3 bloques. No es rediseño: son
correcciones quirúrgicas de CSS/Tailwind en un único archivo. Sin tocar lógica,
datos, rutas, auth, navbar ni otras pantallas.

Stack: React + Tailwind, todo server-rendered en `app/page.tsx` con subcomponentes
locales (`HeroStat`, `NutricionTodayCard`, `CargaMuscularCard`, `ComidasHoyCard`).

---

## 1. Diagnóstico (actual vs referencia)

### Hero
- Bloque hero usa `gap-3` (container) y `gap-1.5` (título/subtítulo). En la
  referencia el aire vertical es mayor: separación clara entre "HOY TOCA" → título
  del día → "Día n de tu rutina semanal" → fila de stats → botones.
- Resultado: hero se ve apretado vs referencia.

### Nutrición de hoy + Carga muscular (fila 2-col)
- `NutricionTodayCard`: outer `gap-3`, bloque ring `gap-2`, ring `size=110`. Card
  queda **más alta** que Carga muscular.
- `CargaMuscularCard`: figura en contenedor `height:140` + leyenda con `gap-1`
  intermedio → hay **espacio muerto entre el cuerpo muscular y la barra de
  leyenda** (gradiente Base/Intensidad/Elite). En la referencia barra y cuerpos
  están casi pegados y la card es más baja.
- Las dos cards no igualan altura como en la referencia.

### Comidas de hoy (estado vacío)
- Apartado "Sugerencia" (columna derecha, `w-24`) está comprimido: textos `text-[7px]`,
  ícono `size-9`, gaps mínimos. En la referencia ese bloque tiene más presencia /
  tamaño legible.

---

## 2. Plan de corrección por bloques

### Bloque A — Hero (más aire vertical)
Archivo: `app/page.tsx`, `div` interno del hero (~L266) y sus hijos.
- Container `justify-end gap-3` → `gap-4` (más separación entre grupos: subtítulo,
  stats, botones).
- Título/subtítulo wrapper `flex flex-col gap-1.5` (~L268) → `gap-2`.
- Subir `minHeight` del hero (L246) de `178` a `~196` para absorber el aire extra
  sin recortar la imagen.
- Mantener `pt-10`/`pb-4`; ajustar solo si la imagen queda tapada al validar.

### Bloque B — Carga muscular (quitar espacio barra↔cuerpos → card más baja)
Archivo: `app/page.tsx`, `CargaMuscularCard` (~L693–726).
- Reducir el hueco entre figura y leyenda: contenedor figura `height:140` →
  `~120`, y `-mb-8` → `-mb-10` (o quitar el `gap-1` del wrapper `flex flex-1
  flex-col gap-1` → `gap-0`) para que el cuerpo casi toque la barra de gradiente.
- Objetivo: que la barra Base/Intensidad/Elite quede pegada a los cuerpos y la
  card baje de altura.

### Bloque C — Nutrición de hoy (igualar altura a Carga muscular achicando el círculo)
Archivo: `app/page.tsx`, `NutricionTodayCard` (~L617–661).
- Tras fijar la altura de Carga muscular (Bloque B), reducir el ring para que
  Nutrición iguale esa altura: `AnimatedProgressRing size={110}` → `~88–92`
  (`strokeWidth` 8 → 7 para proporción).
- Ajustar gaps internos: outer `gap-3` → `gap-2`, bloque ring `gap-2` → `gap-1.5`.
- Texto interno del ring (`text-sm` kcal / `text-[8px]`) se mantiene; bajar a
  `text-[13px]` solo si no entra en el círculo más chico.
- Criterio de cierre: ambas cards de la fila terminan a la **misma altura** (ya
  comparten `h-full` vía el grid padre L400).

### Bloque D — Comidas de hoy vacío (agrandar apartado Sugerencia)
Archivo: `app/page.tsx`, `ComidasHoyCard` estado vacío (~L770–808).
- Ensanchar columna sugerencia: `w-24` → `w-32` (más espacio).
- Subir tamaños dentro del bloque:
  - label "Sugerencia" `text-[8px]` → `text-[10px]`, ícono `Star size-2.5` → `size-3`.
  - texto sugerencia `text-[7px]` → `text-[9px]`, `leading-tight` → `leading-snug`.
  - dibujo `Utensils size-9` → `size-11`.
  - gaps `gap-1` → `gap-1.5`.
- Mantener divisor `w-px` y estructura columnar; solo crece/respira el bloque.

> Nota de fidelidad: el ancho exacto del bloque depende del viewport PWA. Se fija
> con `w-32` como aproximación y se afina en la ronda de validación Playwright
> contra la referencia.

---

## 3. Archivos / componentes a modificar

| Archivo | Componente / zona | Cambio |
| --- | --- | --- |
| `app/page.tsx` | hero `div` interno (~L246, L266, L268) | gaps + minHeight (Bloque A) |
| `app/page.tsx` | `CargaMuscularCard` (~L705–718) | height/-mb/gap figura↔leyenda (Bloque B) |
| `app/page.tsx` | `NutricionTodayCard` (~L617, L622, L624) | ring size/strokeWidth + gaps (Bloque C) |
| `app/page.tsx` | `ComidasHoyCard` vacío (~L795–806) | ancho + tamaños sugerencia (Bloque D) |

Sin cambios de lógica, props de datos, ni otros archivos. `AnimatedProgressRing`
ya acepta `size`/`strokeWidth` → solo se ajustan valores.

---

## 4. Riesgos / limitaciones

- **Fidelidad pixel-exacta**: la referencia es un mockup; medidas como `w-32`,
  ring `~90` y `minHeight 196` son aproximaciones que se afinan visualmente. No
  hay specs numéricos en el mockup, así que el cierre es por comparación visual.
- **Altura igualada Nutrición/Carga**: depende del contenido real (figura muscular
  escalada). Si la figura cambia de alto según rutina, se prioriza igualar el
  estado por defecto (rutina activa, como en la referencia).
- **Ring más chico**: si el texto interno (kcal) no entra, baja 1px de fuente; sin
  cambiar el dato.
- **PWA viewport**: validación en ancho mobile (no desktop) para coincidir con la
  referencia. No se toca el navbar inferior.

---

## 5. Validación con Playwright (MCP / playwright-cli)

1. Levantar app (`npm run dev`) y loguear con credenciales de `.env.local`
   (`EMAIL` / `EMAIL_PASSWORD`).
2. Abrir `/` en viewport mobile (~390×844, PWA) con Playwright.
3. **Antes**: screenshot del dashboard actual → guardar en scratchpad.
4. Comparar lado a lado contra `docs/design-references/dashboard-principal-redesign-v1.png`
   (hero spacing, alturas Nutrición/Carga, bloque Sugerencia).
5. Aplicar Bloques A–D.
6. **Después**: nuevo screenshot, recomparar contra la referencia.
7. **Ronda de corrección visual**: ajustar valores finos (gaps, ring size, ancho
   sugerencia, minHeight) hasta máxima coincidencia. Repetir screenshot hasta
   cierre.
8. Chequear overflow / responsive y que el navbar inferior no se vea afectado.

MCPs/skills previstos: Playwright (obligatorio, inspección visual), shadcn (solo si
hiciera falta primitiva, improbable), Context7 (solo si dudas de API Tailwind/Framer),
Magic UI (no necesario — no hay microinteracción nueva). Si algún MCP no está
disponible se avisa y se sigue con los demás.
