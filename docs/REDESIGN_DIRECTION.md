# Dirección de rediseño (GymControl)

Leer antes de proponer o implementar el rediseño de cualquier ruta. Fija hacia dónde va la app desde el rediseño del home mobile (`/`, 2026-09-14) y cómo se trabaja un rediseño.

- Tokens, escala, radios y componentes viven en `DESIGN.md`. Acá no se repiten: se nombran por sección.
- Precedencia: pedido del usuario → `DESIGN.md` → este archivo → `docs/REDESIGN_PLAYBOOK.md` (sistema de prompts de julio 2026, anterior a esta dirección).

## 1. Pantalla de referencia: home mobile

| Qué | Dónde |
|---|---|
| Código | `app/page.tsx` (árbol `lg:hidden`), `app/components/home/`, `app/lib/home-dashboard.ts`, `app/lib/week.ts`, `app/lib/strength-colors.ts` |
| Reglas | `DESIGN.md` §10 (zonas, estados, vacíos) · §2.1 Display XXL y Metric · §1.6 rampa de fuerza · §6.1 excepción del header |
| Mock y decisiones D1–D8 | https://claude.ai/artifact/GtEptTCsGUyN1MRSSHAm2z (v5; las versiones anteriores guardan refs y variantes descartadas) |
| Commits | `94a82c7` · `af28ad3` · `fe88d8f` |

Vara para cualquier ruta: abrir `/` a 390px al lado de la ruta rediseñada. Tienen que parecer la misma app.

## 2. Qué se corrigió

Queja del usuario: *"siento muy lineal los tamaños, no hay jerarquía"*.

- **Antes:** todo medía entre 10 y 24px, cada card pesaba lo mismo y había labels en mayúscula de 11px en todas. El ojo no sabía por dónde empezar.
- **Después:** un solo protagonista enorme (título del hero en Display XXL), números en Metric L/M, títulos de sección sin kicker y el resto chico.

## 3. Hacia dónde vamos

1. **Una cosa enorme, dos o tres medianas, el resto chico.** Un protagonista por pantalla (Display XXL o Metric L, `DESIGN.md` §2.1). Títulos de sección H2 sin kicker en mayúscula encima. Micro label solo para nombrar stats o pasos.
2. **La pantalla responde "¿qué hago ahora?".** Lo más grande es la tarea principal de la ruta, arriba del fold y con una sola acción. Un CTA emerald por pantalla; si cambia el estado, el CTA se muda de sección, nunca se duplica.
3. **Estados antes que layout.** Cada ruta define sus estados (listo, en curso, hecho, vacío, parcial, sin configurar) y qué cambia en cada uno: protagonista, lugar del CTA y secciones visibles. Lo que no aplica se oculta. Lo que falta configurar se muestra como paso ("Calculá tus kcal y macros"), no como ceros.
4. **Secciones sin cajas.** Se separan con título, espacio y líneas (`border-y`). Superficie propia solo para lo que tiene que despegarse (hero con foto, paso de configuración). El problema no era apilar, era que todo pesara igual: una columna de secciones con escalas distintas es lo que hacen las apps nativas. Grilla o bento solo si el contenido es una grilla.
5. **Filas con la acción en la fila y sheets para el detalle.** Filas ≥44px con su acción al lado (el "+" por comida). Lo que se consulta de un vistazo va en bottom sheet (vaul) en vez de otra pantalla (ejercicios de hoy, D3-a).
6. **Visualizaciones que se explican solas.** Etiquetas con líneas guía y color por rango, más una sola fila de escala. Sin bloques de detalle debajo.
7. **Dato ≠ acento.** Escalas ordinales con varios hues de peor a mejor y brillo creciente (rampa Semáforo, §1.6), validadas con contraste y daltonismo. Nunca emerald para datos ni rampas de un solo color.
8. **Reusar y adaptar.** Extender lo que existe antes de crear (`BodyMuscleFigure` sumó vistas, fills y centroides en vez de un mapa nuevo). Revisar tokens y paletas de `globals.css` y `DESIGN.md` antes de proponer colores.
9. **Solo datos reales.** Los mocks usan datos de ejemplo coherentes; lo implementado muestra solo lo que la base registra (volumen y duración se sacaron porque `workout-tracking` no los tiene).
10. **Mobile primero.** El rediseño cambia mobile (<1024). El desktop de `/` conserva sus cards (`hidden lg:contents`) salvo pedido explícito. La bottom nav no se toca.

Prueba rápida de una ruta: ¿qué es lo más grande y es la tarea principal? ¿Hay un solo CTA emerald? ¿Cada caja se justifica? ¿Qué muestra vacía, en curso y sin configurar?

## 4. Apps que marcan la dirección

| Familia | Apps | Qué se tomó |
|---|---|---|
| Acción de hoy | Ladder · Future | Saludo, semana en círculos, hero con foto, título gigante, meta en una línea y una acción (D1-a, D2-b) |
| Secciones sin caja | Hevy · Fitbod · MacroFactor | Título de sección con acción de texto a la derecha; el contenido fluye sin card por bloque |
| Stats medianas | Oura · Nike Run Club · WHOOP | Fila de 3 números medianos ("Esta semana") |
| Diario en filas | YAZIO | Una fila por comida con "+" (D4-b) |
| Mapa muscular | MuscleWiki · Setgraph · Liftoff · Gymverse | Cuerpo coloreado, etiquetas con líneas guía, vacío con silueta (D5-2, D6-A, D8-A) |
| Descartada | Apple Fitness · Gentler Streak | Grilla de widgets de tamaños distintos: se sigue leyendo como grilla |

De las refs no se toma: color de marca (amarillo de Ladder), anillos multicolor (WHOOP), mascotas e ilustraciones (YAZIO) ni features que GymControl no tiene (carrusel y chat con coach de Future).

## 5. Rechazado por el usuario

| Propuesta | Lo que dijo o eligió | Regla |
|---|---|---|
| Mejoras puntuales sobre el layout existente | "no entendiste mi pedido, quiero un rediseño total" | Si pide rediseño, proponer estructuras completas nuevas |
| Sección encerrada en card | "no me gusta que este encerrado dentro de una card" | §3.4 |
| Grilla de widgets (variante C) | Eligió "A + stats de B" | §3.4 |
| Bloque de detalle debajo del cuerpo | "con el layer que le sale del musculo es suficiente" | §3.6 |
| Paletas nuevas sin mirar las existentes | "no hay una actualmente ya marcada? revisa" | §3.8 |
| Rampas de fuerza de un solo hue (ámbar, emerald) | "no me gustaria que todo sea un solo color, me gustaria que vaya recorriendo distintos colores" | §3.7 |
| Empezar a codear mientras se define | "no comiences la implementacion, estamos definiendo todavia" | Código solo con orden explícita |
| Describir cambios sin mostrar el mock | "debes de mostrarme el artifact como queda" | Republicar el artifact en cada vuelta y pasar el link |

## 6. Método

1. **Contexto.** Leer `DESIGN.md` y este archivo. Abrir la ruta actual a 390px con Playwright y anotar qué tamaños usa y qué compite.
2. **Referencias.** `/app-store-refs` con las categorías de §7. Leer todas las `*-sheet.jpg`, extraer estructura (no piel) y escribir el brief: qué se toma de cada app y qué se descarta. Sin la skill: `python C:\Users\fedet\.claude\skills\app-store-refs\scripts\fetch_refs.py --category <cat> --extra` (o `--apps a,b`, o `--search "App"` para apps fuera del catálogo).
3. **Direcciones.** Artifact con 2–3 rediseños completos a tamaño real (375–390px), cada uno basado en una familia de apps, con los mismos datos de ejemplo, niveles de jerarquía N1–N4 y a favor / en contra. Recomendar una.
4. **Iterar el mock, no el código.** Cada punto abierto es una decisión con ID (`D1-a`, `D2-b`…) que se cierra con panel de preguntas. Mostrar alternativas lado a lado ("sin" vs "con").
5. **Estados en el mock.** Dibujar todos los estados de §3.3 con el diseño final antes de implementar.
6. **Implementar con orden explícita.** F0 `DESIGN.md` (sección nueva para la ruta, como §10) → shell → cada zona → limpieza. Lógica pura en `app/lib/`, componentes en `app/components/<ruta>/` (como `home/`) y dueño anotado en `docs/codex/FILE_OWNERSHIP.md`.
7. **Verificar.** Playwright a 375, 390, 430 y 1280px, cada estado (datos de la cuenta admin de `.env.local` o una ruta temporal que después se borra), reduced-motion y 0 errores de consola. Correr `pnpm check` y `VALIDATE_BASE_URL=http://localhost:3001 pnpm validate:mobile`. Si cambia CSS global, comparar en build de prod (`pnpm exec next start -p 3002`): el dev puede seguir sirviendo CSS viejo.
8. **Cierre.** `graphify update .`, marcar la ruta en §7 y commit convencional solo si se pide.

## 7. Rutas

| Ruta | Pantalla | Estado | Categorías de `/app-store-refs` |
|---|---|---|---|
| `/` | Inicio: qué toca hoy | Mobile rediseñado · desktop con cards | `dashboard` · `nutrition` |
| `/rutinas` | Semana activa | Sin rediseñar | `routines` · `--apps ladder` |
| `/rutinas/dia` | Entreno del día y registro de series | Sin rediseñar | `logging` · `exercise-detail` |
| `/catalogo`, `/catalogo/rutinas/[id]` | Catálogo de rutinas y detalle | Sin rediseñar | `catalog --extra` · `routines` |
| `/nutricion/registro` | Registro diario de comidas | Sin rediseñar | `nutrition --extra` |
| `/alimentos` | Alimentos y macros | Sin rediseñar | `nutrition` |
| `/recetas` | Recetas | Sin rediseñar | `recipes --extra` |
| `/configuracion` | Perfil, objetivo y cuenta | Sin rediseñar | Sin categoría: la skill no trae pantallas de ajustes |
| `/auth/login` | Acceso | Rediseñada en julio 2026, antes de esta dirección | Sin categoría |
| `/admin/*` | Herramientas admin | Sin rediseñar | Sin categoría: la skill no trae pantallas de admin |

- `/dashboard/*` y `/catalogo/rutinas` solo redirigen.
- `desing-refs/` tiene mocks HTML de junio 2026 (login, ejercicio, registro de nutrición), anteriores a esta dirección: sirven para contenido y flujo, no para jerarquía.
