# Plan: Rediseño responsive mobile de toda la app

## Context

En mobile (<1024px) toda la app colapsa a una sola columna sin criterio: las cards se
apilan una abajo de otra, sin jerarquía, sin densidad, sin adaptar el layout al contenido.
El resultado se ve plano y poco cuidado. La causa raíz: el único breakpoint de quiebre es
`lg` (1024px) — debajo de eso casi todo cae a `grid` de una columna o `flex-col`, y no hay
patrones mobile propios (tabs, accordions, bottom sheets, grids de 2 col, bottom nav).

Objetivo: dar a cada vista un layout mobile pensado (jerarquía, espaciado, densidad,
componentes que se adaptan), manteniendo el desktop **intacto**. Decisiones tomadas con el
usuario:

- **Rango "mobile" = sub-`lg` (<1024px)**. El rediseño aplica a phones y tablets; desktop
  se restaura en `lg:`.
- **Bottom tab bar** (zona del pulgar) para destinos principales + el Sheet actual queda
  como menú "Más". Solo mobile (`lg:hidden`), desktop sin cambios.
- **Agregar primitivas shadcn**: `Tabs`, `Accordion`, `Drawer` (dep `vaul`) para bottom
  sheets.

Stack: Next.js App Router, React, Tailwind **v4** (config CSS en `app/globals.css`, sin
`tailwind.config`), shadcn/ui (carpeta `app/components/ui/`, alias `@/app/components/ui`),
lucide-react. Tema dark único, acento púrpura `#7c3aed`.

## Principio rector (no romper desktop)

Todo cambio es **mobile-first**: clase base = mobile, y se restaura el comportamiento
desktop con prefijos `sm:`/`lg:`. Regla práctica: **no tocar ninguna clase que ya tenga
prefijo `lg:`** salvo para añadir; los valores desktop viven en `lg:` y deben quedar igual.
Verificar desktop con screenshot a 1440px antes/después de cada página.

## Fase 0 — Fundaciones (hacer primero, una sola vez)

1. **Instalar primitivas** (respetando estilo new-york, carpeta `app/components/ui/`):
   - `Tabs.tsx`, `Accordion.tsx`, `Drawer.tsx` (vía `npx shadcn@latest add tabs accordion drawer`).
   - `drawer` agrega la dep `vaul` — confirmar que queda en `package.json`.
   - Ajustar imports/tokens al tema dark existente (colores `var(--card)`, `var(--border)`,
     `var(--accent)`), igual que los componentes ya instalados.

2. **Bottom tab bar** — nuevo `app/components/shared/MobileTabBar.tsx`:
   - `fixed bottom-0 inset-x-0 z-40 lg:hidden`, fondo `--sidebar` con borde superior.
   - 4-5 destinos desde `navigation-config.ts` (reusar `shellNavigationGroups`/
     `resolveShellRouteMeta` ya existentes — **no** duplicar la fuente de nav). Filtrado por
     rol igual que `PrimaryNavigation` (admin vs user vs público).
   - Ítem activo con acento púrpura; íconos lucide existentes del config.
   - 5º ítem = "Más" que abre el `Sheet` actual (reusar el `Sheet`/`NavigationPanel` de
     `PrimaryNavigation.tsx`).
   - Montar en `app/layout.tsx` junto a `PrimaryNavigation`; ocultar en `/auth/*` (misma
     guard que ya usa el nav).
   - Padding inferior global para que el contenido no quede tapado: agregar
     `pb-[env(safe-area-inset-bottom)]` + `pb-20 lg:pb-0` al contenedor scrollable
     (`.shell-main` o un wrapper), en `globals.css` o en el layout.

3. **Token de spacing mobile** (opcional, en `globals.css`): reducir padding del
   `.page-frame` en base (`padding: 1rem` ya está; bajar a `0.875rem` solo si hace falta) —
   el bloque `@media (min-width:1024px)` ya fija el padding desktop, no tocarlo.

## Fase 1 — Patrones reutilizables por tipo de página

Cada página cae en uno de estos arquetipos. Definir el patrón una vez y aplicarlo.

### A. Dashboard / pantallas de resumen (`app/dashboard/page.tsx`)
Hoy: hero card + grid de 4 métricas + lista de rutinas, todo apilado.
- **Hero** activo: reducir min-height en mobile (`min-h-[13rem] sm:min-h-[17.55rem]`),
  título `text-2xl sm:text-3xl`, chips de meta en fila con wrap (ya wrappean — solo achicar
  padding y gap en base).
- **Métricas**: pasar de columna a **grid 2×2** en mobile (`grid-cols-2`), restaurando el
  `sm:grid-cols-2` desktop. Achicar cada card (icono + valor + label compactos).
- **Lista de rutinas** (`DashboardRoutinesClient`): cards con jerarquía (nombre + badges +
  acción), no filas planas.

### B. Formularios largos de configuración (`app/configuracion/ConfiguracionClient.tsx`)
Hoy: 5 cards apiladas (cuenta, datos, grasa, actividad, objetivo) + plan + acciones.
- **Agrupar en `Tabs`** mobile-only: p. ej. "Perfil" (datos básicos + grasa + actividad +
  objetivo) y "Plan" (resultado) — o usar **`Accordion`** para colapsar cada bloque y que la
  página no sea un scroll interminable. En `lg:` renderizar el stack actual completo
  (Tabs/Accordion solo `<lg`).
- **Barra de guardado sticky** en mobile: el botón "Guardar perfil" fijo abajo
  (`sticky bottom-16` por encima del tab bar) en vez de perdido al final del scroll.
- Toggles de género/objetivo: ya usan grids; revisar que sean `grid-cols-2`/`grid-cols-1`
  con buen tap target (min 44px alto).

### C. Captura de datos densa (`app/nutricion/registro/RegistroClient.tsx`)
Hoy: form "Nueva comida" + resumen lado a lado (colapsa), lista de comidas, constancia.
- **"Nueva comida" → `Drawer` (bottom sheet)**: en mobile, reemplazar el card inline por un
  botón flotante/CTA "Nueva comida" que abre un Drawer con el form (`FoodPickerRow` +
  borrador). Desktop mantiene el card inline (`hidden lg:flex` para el card, Drawer
  `lg:hidden`).
- **Resumen nutricional**: el `AnimatedProgressRing` + `TargetBar`s ya pasan a columna;
  achicar ring en mobile (`size={160}`) y dejar las 4 barras full-width. Stats de abajo:
  grid 3 col ya está, ok.
- **Comidas de hoy**: cada `MealCard` envuelto en **`Accordion`** en mobile (header =
  nombre + kcal + macros colapsado; abrir = ítems + acciones). Evita el muro de cards
  abiertas. Desktop mantiene `sm:grid-cols-2` de cards expandidas.
- **`FoodPickerRow`**: el dropdown de resultados y los selects deben ser usables en mobile
  (full-width, `grid-cols-1` base que ya tiene). Verificar que el popover de resultados no
  se corte dentro del Drawer.

### D. Tablas de admin (`app/admin/ejercicios`, `/rutinas`, `/alimentos`, `/recetas`)
Hoy: usan el componente `Table` → scroll horizontal / se rompe en mobile.
- **Patrón tabla→cards**: en mobile (`lg:hidden`) renderizar cada fila como una **card
  apilada** (label: valor) con las acciones (editar/borrar) en un menú o fila de iconos.
  En `lg:` mostrar la `Table` actual (`hidden lg:block`).
- Filtros/búsqueda de cada admin: colapsar en una fila sticky arriba o dentro de un Drawer
  "Filtros" si son varios.
- Botón "Crear/Nuevo": como acción primaria sticky o en el header mobile.
- Aplicar el mismo patrón a los 4 clients admin: `ExerciseAdminClient`, `FoodAdminClient`,
  y los clients de `rutinas`/`recetas` (verificar nombres reales al implementar).

### E. Grids de catálogo público (`app/catalogo`, `/catalogo/rutinas`, `/alimentos`, `/recetas`)
Hoy: grids que colapsan a 1 columna.
- **Grid 2 columnas** en mobile donde el contenido lo permita (cards de rutina/alimento/
  receta compactas: imagen + título + 1-2 metadatos), `grid-cols-2 sm:grid-cols-2/3
  lg:grid-cols-...`. Para cards con mucho texto, mantener 1 columna pero con mejor jerarquía.
- Header de cada catálogo: título + buscador sticky arriba en mobile.

### F. Detalle de rutina semanal (`app/catalogo/rutinas/[id]`)
Estructura semanal (días + ejercicios).
- **`Tabs` por día** en mobile (Día 1 / Día 2 …) en vez de apilar todos los días. Cada tab
  muestra los ejercicios de ese día como lista compacta. Desktop mantiene su layout actual.

### G. Vista de día / logging (`app/dashboard/rutinas/dia/DayWorkoutClient.tsx`)
Registro de series/reps/peso por ejercicio.
- Cada ejercicio como **card de logging** apilada con inputs grandes (reps/peso) en grid 2
  col, target visible, botón completar con buen tap target. Header sticky con nombre del día
  + progreso. Mantener desktop.

### H. Home / landing (`app/page.tsx`) y Login (`app/auth/login/page.tsx`)
- **Login ya es responsive** (oculta panel de marca en `<lg`, form centrado). Solo revisar
  spacing/tap targets. Cambio mínimo.
- **Home**: aplicar jerarquía de hero mobile (título escalado, CTA full-width, secciones con
  buen ritmo vertical). Revisar al implementar según su contenido real.

## Archivos a tocar (representativos)

- **Nuevos**: `app/components/ui/Tabs.tsx`, `Accordion.tsx`, `Drawer.tsx`;
  `app/components/shared/MobileTabBar.tsx`.
- **Shell**: `app/layout.tsx` (montar tab bar), `app/globals.css` (padding inferior mobile,
  safe-area).
- **Páginas/clients** (uno por arquetipo, mismo patrón): `app/dashboard/page.tsx` +
  `DashboardRoutinesClient`, `app/configuracion/ConfiguracionClient.tsx`,
  `app/nutricion/registro/RegistroClient.tsx`, los 4 clients de `app/admin/*`,
  `app/catalogo/**`, `app/catalogo/rutinas/[id]/page.tsx`,
  `app/dashboard/rutinas/dia/DayWorkoutClient.tsx`, `app/page.tsx`.
- **Reusar** (no duplicar): `navigation-config.ts` (`shellNavigationGroups`,
  `resolveShellRouteMeta`), `Sheet`/`NavigationPanel` de `PrimaryNavigation.tsx`, tokens de
  `globals.css`, `Card`/`Button`/`Badge`/`Select` existentes.

## Orden de ejecución

1. Fase 0 (primitivas + bottom tab bar + padding shell) → verificar nav y que nada tape el
   contenido.
2. Dashboard (arquetipo A) como piloto → validar patrón con Playwright antes de seguir.
3. Resto por arquetipo: nutrición (C), configuración (B), admin (D), catálogos (E/F),
   día (G), home/login (H).
4. Pasada final de consistencia (spacing, tap targets ≥44px, focus visible, safe-area).

## Verificación (Playwright)

Usar la skill `webapp-testing` / Playwright contra `pnpm dev` (localhost:3000). Credenciales
admin en `.env.local` (`EMAIL` / `EMAIL_PASSWORD`); login por OTP o Google.

Por cada página, en dos viewports:
- **Mobile 390×844** (iPhone 12/13): screenshot, verificar jerarquía, sin overflow
  horizontal, tab bar visible y funcional, contenido no tapado por el tab bar, Drawers/Tabs/
  Accordions abren y cierran, tap targets usables.
- **Desktop 1440×900**: screenshot, confirmar que el layout es **idéntico** al previo
  (comparación antes/después). Cualquier diff desktop = regресión a corregir.

Checklist transversal:
- Sin scroll horizontal en 360px (viewport chico).
- `prefers-reduced-motion` respetado en animaciones nuevas.
- Foco de teclado visible en tab bar, Tabs, Drawer, Accordion.
- Login y flujo de auth siguen funcionando.

## Riesgos

- **Romper desktop sin querer** al editar clases compartidas → mitigar con la regla "no
  tocar clases `lg:`" + screenshot comparativo 1440px por página.
- **vaul (Drawer)**: nueva dep runtime; validar build de producción (`pnpm build`).
- **Bottom tab bar tapando contenido** (inputs, CTAs al fondo) → asegurar padding inferior y
  `safe-area-inset-bottom`.
- **Doble navegación** (tab bar + Sheet): mantener una sola fuente (`navigation-config.ts`)
  para que no se desincronicen.
- **Tablets (640–1023px)**: como el rango mobile llega hasta `<lg`, validar también ~768px
  para que el grid 2-col y los Tabs no se vean pobres ahí.
