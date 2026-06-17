# Plan: arreglos responsive mobile

## Context

Varios problemas de layout en **mobile** (solo mobile) en Home, día de entrenamiento,
dashboard, registro de nutrición y admin. Objetivo: que la información entre bien, sin
scrolls horizontales indeseados, con el componente de cuerpo más grande/detallado y
reordenamientos de cards confirmados con el usuario vía previews.

Nota de alcance: los cambios de **layout/tamaño** se guardan en breakpoints mobile (clases
base; restaurar desktop con `sm:`/`lg:` cuando aplique). Los cambios de **contenido**
(renombrar botones, quitar card, badge→punto, reordenar) son inherentemente globales — se
aplican en todos los viewports pero no rompen desktop.

Decisiones confirmadas (previews aprobadas):
- Cuerpo: frente+espalda lado a lado, escala simple Baja→Alta.
- Layout Home: hero → [Nutrición | Carga muscular] → Comidas hoy (full) → [Constancia | Calendario nutrición]. Sin Hidratación.
- Card de nutrición "desmarcado": celda de HOY del Calendario de nutrición vacía si no se cargó nada hoy.
- Calendarios en media card: reducir semanas (~5) para que entren sin scroll.
- Card principal a rediseñar = `dashboard/rutinas/dia` (DayWorkoutClient), NO catalogo/[id].
- Círculo del día = progreso `3/8` (completados/total).
- Dashboard: quitar card superior; punto verde arriba-izq sobre imagen si activa; sin badge "Activa".
- Registro: círculo más chico + 4 barras en un renglón c/u.
- Admin: Actividad reciente como lista compacta justo debajo del grid 2x2; botones "Ver todos"/"Ver todas".

---

## 1. Home — `app/page.tsx`

### 1a. Reordenar grid + quitar Hidratación (`app/page.tsx:166-210`)
Grid sigue `grid grid-cols-2 gap-2 lg:grid-cols-3`. Reordenar cells y spans (mobile):
- `NutricionCard` → `col-span-1`
- `CargaMuscularCard` → `col-span-1` (misma fila)
- `ComidasHoyCard` → **`col-span-2`** (full ancho)  *(restaurar `lg:col-span-1` para desktop)*
- `TrainingCalendarCard` (Constancia) → `col-span-1`
- `NutritionCalendarCard` → `col-span-1` (misma fila)
- **Eliminar** el bloque `HidratacionCard` (`app/page.tsx:196-199`).
- Eliminar el componente `HidratacionCard` (`app/page.tsx:380-397`) y su import `Droplets` si queda huérfano; eliminar el cómputo `waterLiters` (`app/page.tsx:110-114`) si ya no se usa.

### 1b. Comidas de hoy full ancho
La card ya toma el ancho del cell; con `col-span-2` en mobile ocupa todo. Ajustar layout
interno de `ComidasHoyCard` (`app/page.tsx:332-378`) para aprovechar el ancho (filas de
comida en una sola línea, kcal a la derecha) — sin tocar desktop.

## 2. Cuerpo más grande/detallado — `app/components/shared/BodyMuscleFigure.tsx`
Hoy es **una sola** figura de frente (SVG `viewBox 0 0 80 185`, `h-[88px]`).
- Renderizar **dos** figuras lado a lado: frente (la actual) + **espalda (SVG nuevo)**.
  Vista espalda: trapecios, **espalda/lats** (usar color del grupo `espalda` vía
  `c("espalda","back","dorsal")`), glúteos, isquios, gemelos. Reutilizar `match()`/`intensity()`/`COLOR`.
- Contenedor: `flex` con las dos figuras; cada `<svg>` un poco más alto que hoy
  (p. ej. `h-[104px]`) pero que entren ambas en la media card mobile.
- Mantener barra de escala simple Baja→Alta (`BodyMuscleFigure.tsx:99-108`) abajo, full ancho.

## 3. Calendarios sin scroll (media card) — `TrainingCalendarCard.tsx` + `NutritionCalendarCard.tsx`
Ambos usan strip horizontal de 10 semanas con `overflow-x-auto` → scroll.
- Añadir prop `weeks` (default actual) y pasar **5** en los usos de Home
  (`app/page.tsx` Constancia + Calendario nutrición). En `TrainingCalendarCard` `WEEKS`
  pasa a ser parámetro (`TrainingCalendarCard.tsx:9`); idem en `NutritionCalendarCard.tsx`.
- **Quitar** `overflow-x-auto` (`TrainingCalendarCard.tsx:46`, `NutritionCalendarCard.tsx:52`)
  → `overflow-hidden`. Con 5 semanas el grid entra completo sin scroll.

### 3b. Calendario de nutrición — celda HOY desmarcada si no se cargó nada
Verificar lógica en `NutritionCalendarCard.tsx:85-93`: hoy sin log debe quedar vacío/outline
(no morado). Hoy: `logged → morado`, `isToday → outline transparente`. Confirmar que un día
con 0 items no entra en `loggedDates` (revisar `getLoggedDatesForUser`). Si el origen marca
el día por existir registro vacío, excluirlo para que HOY aparezca desmarcado.

## 4. Card principal del día — `app/dashboard/rutinas/dia/DayWorkoutClient.tsx:280-327`
Reestructurar la `<section>` (mobile):
- **Título** arriba (el `h1` "Dia X - Nombre" ya está en el header `:270-272`, queda encima de la card; OK).
- **Fila** debajo: a la **izquierda** el ring (`AnimatedProgressRing` `:308-318`) con centro
  mostrando `{completedCount}/{rows.length}` (en vez del `%`).
- A la **derecha**: dos datos — **Tiempo estimado** (`:301-306`) y **Ejercicios** totales (`:295-300`).
- **Quitar** el texto "Progreso del dia" (`:319-324`).
- Quitar/colapsar el metric "Rutina activa" (`:282-294`) ya que el nombre está en el header (confirmar al implementar que entra todo).
- Ajustar el grid interno (`:281`) a layout simple `flex`/2-col en mobile para que entre la info.

## 5. Dashboard
### 5a. Quitar card superior — `app/dashboard/page.tsx:115-132`
Eliminar el bloque de la rutina activa (punto verde + nombre + "Abrir"). Limpiar variables
`activeRoutine` huérfanas solo si dejan de usarse (se usa más abajo para metrics; verificar).

### 5b. Card de rutina: punto verde, sin "Activa" — `app/dashboard/DashboardRoutinesClient.tsx`
- **Quitar** `<Badge variant="accent">Activa</Badge>` (`:246`).
- Añadir **punto verde** posicionado `absolute` arriba-izquierda sobre la imagen
  (bloque imagen `:217-242`, que ya es `relative`) cuando `isActive`:
  `<span className="absolute left-2 top-2 z-10 size-2.5 rounded-full bg-[#22c55e] shadow" />`.

## 6. Registro nutrición — `app/nutricion/registro/RegistroClient.tsx`
- Achicar ring: `size={150}` → `~120`, `strokeWidth={14}` → `~11` (`:308-309`).
- Más aire entre barras: aumentar gap del contenedor (`:322`, `gap-1.5` → `gap-2.5`/`gap-3`)
  y en `TargetBar` (`:954-991`) asegurar que label+valor (`:974`) queden en un renglón
  (evitar wrap; `whitespace-nowrap`/`text-xs` ya presente). Objetivo: 4 barras, una línea c/u, sin tocarse.
- Constancia de esta página (`:417`, `TrainingCalendarCard ... bare`): pasar `weeks={5}`
  (mismo fix del punto 3) para que no tenga scroll.

## 7. Admin — `app/admin/page.tsx` + `app/admin/RecentActivityTable.tsx`
### 7a. Reubicar "Actividad reciente"
Mover el `<Card>` de Actividad reciente (`app/admin/page.tsx:241-261`) para que quede
**inmediatamente después** del grid 2x2 de stats (`:80-97`) y antes del resto.

### 7b. Lista compacta en vez de tabla
En `RecentActivityTable.tsx` reemplazar el `<Table>` (Acción/Detalle/Fecha) por una **lista
compacta**: cada ítem = ícono + nombre + tipo (ejercicio/rutina), `text-xs`, sin
`overflow-x-auto`, sin scroll. Reutilizar `ACTIVITY_ICONS` (`:24-30`) y `getRecentActivity`.
Mantener pocas filas (las que entren bien).

### 7c. Renombrar botones — `app/admin/page.tsx`
- `:186` "Ver todos los ejercicios" → **"Ver todos"**.
- `:235` "Ver todas las rutinas" → **"Ver todas"**.

---

## Verificación (Playwright, mobile)
Login con credenciales admin de `.env.local` (`EMAIL`/`EMAIL_PASSWORD`). Viewport mobile
(~390×844). Para cada página, screenshot + assert sin scroll horizontal y layout = preview:
1. `/` — orden de cards correcto, sin Hidratación, Comidas hoy full, cuerpo frente+espalda, calendarios sin scroll, celda hoy de nutrición desmarcada si no hay registro.
2. `/dashboard/rutinas/dia` — card con título, ring `3/8` izq, tiempo+ejercicios der, sin "Progreso del día".
3. `/dashboard` — sin card superior; punto verde arriba-izq en card activa; sin "Activa".
4. `/nutricion/registro` — círculo más chico, 4 barras en un renglón sin tocarse, constancia sin scroll.
5. `/admin` — Actividad reciente (lista compacta) justo bajo el grid 2x2, sin scroll; botones "Ver todos"/"Ver todas".

Iterar hasta que cada página coincida con su preview. Tras cambios de código correr
`graphify update .`.

## Riesgos
- BodyMuscleFigure: dibujar SVG de espalda es trabajo nuevo de diseño; puede requerir iteración para que se vea bien en media card.
- Reducir `weeks` a 5 afecta también desktop en esos cards (son media card en todos lados) — aceptable.
- Quitar "Rutina activa"/Hidratación puede dejar variables/imports huérfanos: limpiar solo lo que mis cambios dejen sin uso.
