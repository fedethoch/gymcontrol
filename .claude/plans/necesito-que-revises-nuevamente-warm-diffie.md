# Plan: corrección visual dashboard principal (PWA) → fidelidad a referencia

## Context

La implementación actual del dashboard (`app/page.tsx`, render en `/`) ya tiene la
estructura correcta (hero + 3 cards resumen + Nutrición/Carga muscular + Comidas +
2 calendarios), pero difiere de `docs/design-references/dashboard-principal-redesign-v1.png`
en **espaciados, jerarquía interna y detalles de 3 cards**. El usuario NO quiere rediseño:
quiere acercar la implementación al mockup. Todos los cambios son de layout/estilo,
sin tocar lógica, datos, rutas, auth ni navbar.

**Archivo único a modificar: `app/page.tsx`** (todos los sub-componentes viven ahí).
Sin cambios en otros archivos.

---

## 1. Diagnóstico — diferencias actuales vs referencia

### Hero (`app/page.tsx:266-338`)
- Contenedor usa `gap-4` uniforme y el grupo título/subtítulo `gap-2` (línea 268).
- En la referencia hay más aire vertical: entre "HOY TOCA" y el título del día,
  entre título y "Día N de tu rutina semanal", entre subtítulo y la fila de stats
  (duración/ejercicios/completados), y entre stats y botones.

### Carga muscular (`app/page.tsx:705-725`)
- Figura en `div height:120` con `scale-[0.72]` y `-mb-10`, contenedor `gap-0`.
- La barra de leyenda (gradiente) queda **pegada al dibujo de los cuerpos**.
- Debe mantener el alto actual de la card pero separar la barra del dibujo.

### Nutrición de hoy — anillo (`app/page.tsx:630-637`)
- Hoy: 2 líneas → número en blanco (`text-white`) + "kcal de {target}" en violeta (`#b995ff`).
- Referencia: **3 líneas**, todas en un mismo blanco apagado (no full white):
  línea 1 = valor `0`, línea 2 = `kcal`, línea 3 = `de 2100`.

### Comidas de hoy — estado vacío (`app/page.tsx:768-808`)
- La columna "Sugerencia" (`w-32`) ocupa mucho ancho y el texto es grande.
- El ícono `Utensils` (`size-11`) está sólo a la altura del texto, no del bloque completo.
- Pedido: menos espacio a sugerencia, texto más chico, y el ícono debe ocupar de
  alto **tanto el label "Sugerencia" como el texto** (ícono a la izquierda, alto = bloque).

---

## 2. Plan de corrección por bloques visuales

### Bloque A — Hero: más aire vertical
En el contenedor de contenido (`app/page.tsx:266`):
- Subir el gap general del bloque: `gap-4` → `gap-5` (más separación subtítulo↔stats y stats↔botones).
- Aumentar el `pt-10` levemente (→ `pt-12`) para más aire entre el badge "HOY TOCA"
  (absoluto, top-3) y el título del día.
- En el grupo título/subtítulo (línea 268): `gap-2` → `gap-2.5` (título ↔ "Día N…").
- Si stats↔botones necesita más separación que el resto, envolver botones con `mt-1`
  o subir sólo ese gap; preferir el `gap-5` del contenedor primero y ajustar tras
  comparar con Playwright.

### Bloque B — Carga muscular: despegar barra del dibujo (mismo alto de card)
En `app/page.tsx:705-718`:
- Cambiar contenedor `flex flex-1 flex-col gap-0` → mantener `flex-1` pero reducir el
  solapamiento: el `-mb-10` (línea 708) es el que pega la barra al dibujo. Reducir a
  `-mb-6` / `-mb-5`, o quitar `-mb-*` y compensar con `gap` para separar barra y figura.
- Añadir un pequeño margen superior a la barra de leyenda (`mt-1.5`) sin crecer la card:
  el alto se preserva ajustando el solapamiento de la figura (la figura está escalada
  0.72 y recortada por `overflow-hidden` height:120, así que reducir `-mb` baja el dibujo
  pero el contenedor de 120px no cambia → card mantiene alto).
- Verificar con Playwright que la card no crezca respecto a Nutrición (deben quedar
  iguales por `h-full` en grid).

### Bloque C — Nutrición: texto del anillo en 3 líneas, blanco apagado
En `app/page.tsx:630-637`, reemplazar el contenido del ring por 3 spans:
- Línea 1: valor `{totalKcal}` — tamaño tipo `text-base font-bold`.
- Línea 2: `kcal` — chico (`text-[9px]`).
- Línea 3: `de {targetKcal}` — chico (`text-[9px]`).
- Color unificado **blanco apagado**: usar `text-white/85` (o `rgba(255,255,255,0.85)`)
  en las 3, en vez de `text-white` + `#b995ff`. Mantener `leading-none`/`leading-tight`
  y `items-center` para que las 3 líneas entren centradas en el ring de 90px.

### Bloque D — Comidas vacío: sugerencia más compacta + ícono a alto completo
En `app/page.tsx:793-807` (columna derecha de sugerencia):
- Reducir ancho: `w-32` → `w-28` (menos espacio a sugerencia).
- Reestructurar a fila: **ícono a la izquierda ocupando todo el alto del bloque**
  (label + texto), no sólo el texto. Layout `flex items-stretch gap-2`:
  - Ícono `Utensils` con `self-stretch`/`h-auto` y tamaño acorde (que abarque label+texto).
  - Columna derecha con label "Sugerencia" (mantener `Star` + texto uppercase) arriba
    y el texto descriptivo abajo, este último **más chico** (`text-[8px]` o `text-[9px]`
    con `leading-tight`) y más corto.
- Ajustar el divisor/gaps para que el bloque siga alineado con la columna central.

> Nota de fidelidad: el mockup muestra esta zona en baja resolución; replico estructura
> (ícono alto completo + sugerencia compacta) no el texto exacto. Si el alto del ícono
> a "todo el bloque" desbalancea la card en mobile angosto, la aproximación más cercana
> es fijar el alto del ícono al del bloque texto+label vía `self-stretch` y `min-h`.

---

## 3. Archivos / componentes a modificar

| Componente (en `app/page.tsx`) | Líneas aprox. | Cambio |
| --- | --- | --- |
| Hero content wrapper | 266-268, 311 | gaps y padding vertical |
| `CargaMuscularCard` | 705-718 | despegar barra del dibujo, preservar alto |
| `NutricionTodayCard` (ring children) | 630-637 | 3 líneas blanco apagado |
| `ComidasHoyCard` (empty state) | 793-807 | sugerencia compacta + ícono alto completo |

Sin cambios en: `ProgressRing.tsx`, `BodyMuscleFigure`, calendarios, navbar, libs de datos.
Reutilizo componentes existentes (`AnimatedProgressRing`, `CardLabel`, `BodyMuscleFigure`,
`Button`, íconos `lucide-react`) — no creo componentes nuevos.

---

## 4. Riesgos / limitaciones

- **Alto de cards en grid**: Carga muscular y Nutrición comparten fila con `h-full`.
  Tocar el `-mb` de la figura podría alterar percepción de alto; verificar paridad con
  Playwright (ambas deben quedar iguales).
- **3 líneas en ring de 90px**: poco espacio vertical; si se aprieta, reducir tamaños
  de fuente antes que agrandar el ring (agrandar rompería el layout de 2 columnas).
- **Ícono a alto completo en Comidas**: en pantallas muy angostas el `w-28` + ícono
  podría apretar el texto; aproximación = `self-stretch` con `min-h` controlado.
- El mockup es de baja resolución en las zonas de detalle → replico intención/estructura,
  no medidas exactas. Ajuste final guiado por comparación visual.
- Cambios sólo cosméticos: sin impacto en lógica, datos, auth ni rutas.

---

## 5. Validación con Playwright (MCP)

1. Levantar la app (`npm run dev`) y loguear con las credenciales admin de `.env.local`
   (`EMAIL` / `EMAIL_PASSWORD`) para llegar al dashboard en `/`.
2. **Antes**: abrir `/` con Playwright MCP, screenshot en viewport mobile (PWA, ~390×844)
   y comparar lado a lado con `docs/design-references/dashboard-principal-redesign-v1.png`.
3. Aplicar cambios de los bloques A–D.
4. **Después**: re-screenshot mismo viewport; comparar contra la referencia bloque por
   bloque (hero spacing, barra de carga muscular separada, ring de 3 líneas blanco
   apagado, sugerencia compacta con ícono alto completo).
5. **Ronda de corrección visual**: ajustar gaps/tamaños/`-mb` finos según diferencias
   detectadas; repetir screenshot hasta máxima fidelidad. Validar también que las cards
   en grid mantengan altos parejos y que no haya overflow.
6. Chequear que el navbar inferior (PWA) quede intacto.

Si algún MCP/skill no está disponible al implementar, se avisará y se seguirá con
herramientas disponibles. shadcn/Context7/Magic UI sólo se consultarán si hace falta
(no se prevé necesidad: el cambio reutiliza componentes existentes).
