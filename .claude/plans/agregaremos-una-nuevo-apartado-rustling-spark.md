# Plan — Apartado de Nutrición (alimentos, calorías, macros, dietas)

## Context

GymControl hoy cubre ejercicios + rutinas + tracking de entrenamiento. Se agrega un
apartado nuevo de **nutrición**: catálogo de alimentos con macros, generación de
dietas automáticas según datos físicos del usuario, dietas predeterminadas por
cantidad de comidas, sugerencias simples de alimentos por macro, y CRUD de admin
para todo. Se construye **mock primero** (UI con datos estáticos, sin DB) y luego se
hace funcional (Supabase + cálculo real). Toda la UI se construye con la skill
`frontend-design` (obligatorio) y se valida con la skill `webapp-testing` (Playwright).

Decisiones ya tomadas con el usuario:
- **Se agrega `peso (kg)`** a los datos opcionales (imprescindible para cualquier fórmula).
- **Cálculo TDEE:** Katch-McArdle cuando hay % graso, fallback a Mifflin-St Jeor.
- **Extras** (registro diario, calendario adherencia, guardar dieta) → **Fase 3 separada**,
  se construyen sólo si el usuario los aprueba tras ver el core. La respuesta del usuario
  fue contradictoria (eligió los tres extras y también "solo el core"); se resuelve fasendo.

El estado del repo no tiene NADA de nutrición: ni tablas, ni campos físicos en `profiles`,
ni componentes. Todo es nuevo, pero **espeja patrones existentes** (ejercicios/rutinas).

---

## Patrones existentes a reusar (no reinventar)

Cada feature admin sigue el mismo split de archivos. Se replica para `alimentos` y `dietas`:
- `app/admin/<feature>/page.tsx` — server component, fetch inicial → `<FeatureAdminClient>`
- `app/admin/<feature>/<Feature>AdminClient.tsx` — `"use client"`, tabla + form en `Sheet` + delete en `Dialog`
- `app/admin/<feature>/actions.ts` — `"use server"`, acciones tipadas (objeto-in / estado-out)
- `app/lib/<feature>.ts` — `"server-only"`, queries Supabase + mappers snake→camel
- `app/lib/<feature>-form.ts` — tipos payload/estado, constantes de opciones, label helpers
- `app/lib/<feature>-validation.ts` — zod + checks manuales → `{ok,data}|{ok,state}`

Reutilizar directamente:
- `requireAdmin()` / `requireUser()` — `app/lib/auth.ts`
- Clientes Supabase — `app/lib/supabase/{server,browser,env}.ts`
- Primitivas UI — `app/components/ui/*` (Card, Sheet, Dialog, Table, Select, Input, Badge, Button)
- `AnimatedProgressRing` (`app/components/ui/ProgressRing.tsx`) → anillos de calorías/macros
- `ExerciseDetailModal.tsx` (Sheet side="right" + tabs) → patrón para detalle de alimento/comida
- `WeeklyAttendanceCard.tsx` / `TrainingCalendarCard.tsx` → patrón para cards de seguimiento (Fase 3)
- Patrón de upload de imagen client-side directo a Storage — ver `ExerciseAdminClient.handleFileChange` + `app/lib/exercise-config.ts`
- Tokens y estilo — `app/globals.css` (acento `--accent #7c3aed`, `font-display` para números)
- Registro de navegación — `app/components/shared/navigation-config.ts`

---

## Nutrición: lógica de cálculo (fuente de verdad del feature)

Vive en `app/lib/nutrition-calc.ts` (función pura, testeable, sin I/O).

**BMR**
- Con % graso → Katch-McArdle: `LBM = peso*(1-bf/100)`; `BMR = 370 + 21.6*LBM`
- Sin % graso → Mifflin-St Jeor:
  - hombre: `10*peso + 6.25*altura − 5*edad + 5`
  - mujer:  `10*peso + 6.25*altura − 5*edad − 161`

**TDEE = BMR × factor actividad** (con descripción breve en UI para que el usuario sepa elegir):
sedentario 1.2 · ligero 1.375 · moderado 1.55 · alto 1.725 · muy alto 1.9

**Ajuste por objetivo:**
- definición: −20% kcal · recomposición: ±0% · ganancia: +10% kcal

**Macros** (kcal: prot 4 / carb 4 / grasa 9):
- proteína: 2.0 g/kg peso (definición/recomp hasta 2.2)
- grasa: 0.9 g/kg peso (piso 20% kcal)
- carbos: resto = `(kcal_objetivo − prot*4 − grasa*9) / 4`

**Sugerencias por macro** (`app/lib/nutrition-suggest.ts`): dado el gramaje objetivo de cada
macro, los alimentos se etiquetan por fuente dominante (`protein`/`carb`/`fat`). Para cada macro
se eligen alimentos de esa categoría y se calcula el gramaje del alimento para cubrir el target
(ej: necesita 150g prot → pollo 31g/100g → ~480g repartidos en comidas). Total kcal debe quedar
cerca del objetivo (coherente, no exacto).

---

## Fase 1 — Mock (UI completa, datos estáticos, sin DB)

Objetivo: ver y navegar todo el flujo con datos hardcodeados. Construir con skill `frontend-design`.

Datos mock en `app/lib/nutrition-mock.ts` (alimentos de ejemplo, dietas predeterminadas, perfil demo).
Tipos compartidos en `app/lib/nutrition-types.ts`.

**Rutas usuario:**
- `/nutricion` — catálogo de alimentos (cards con imagen, kcal, macros). Filtro/búsqueda client-side
  espejando `RoutineCatalogClient.tsx`. Detalle en Sheet (patrón `ExerciseDetailModal`).
- `/nutricion/perfil` — cuestionario opcional: género, edad, altura, **peso**, % graso (con imagen de
  muestra para identificar nivel), intensidad actividad (con descripción), objetivo. Al enviar →
  muestra kcal mantenimiento + objetivo + macros usando `nutrition-calc.ts`. Anillos `AnimatedProgressRing`.
- `/nutricion/dietas` — dos secciones: (a) dieta automática generada del perfil; (b) dietas
  predeterminadas por nº de comidas (3/4/5), cada comida con descripción de kcal/macros aproximados.
- `/nutricion/dietas/[id]` — detalle de dieta: comidas + sugerencias de alimentos por macro con gramos.

**Rutas admin (mock):** `/admin/alimentos` y `/admin/dietas` con tablas + forms en Sheet, sin persistir aún.

**Navegación:** agregar entradas en `app/components/shared/navigation-config.ts`:
- grupo "Usuario": `{ href:"/nutricion", label:"Nutrición", icon: <lucide Apple/Salad>, section:"Usuario" }`
- grupo "Gestión": `/admin/alimentos` y `/admin/dietas` con `section:"Admin"`
- ícono lucide únicamente (`Apple`, `Salad` o `Utensils`).

Verificación Fase 1: skill `webapp-testing` (Playwright) recorre cada ruta, completa el cuestionario,
verifica que se rendericen kcal/macros y las sugerencias. Screenshots mobile-first.

---

## Fase 2 — Funcional (Supabase + cálculo real)

Primero actualizar `docs/DATABASE.md`, luego escribir migración versionada en
`supabase/migrations/` y aplicar al proyecto remoto vía MCP `supabase_gymcontrol`.

**Tablas nuevas (snake_case, PK uuid, timestamps + trigger `set_updated_at()`):**
- `foods`: `name`, `image_url`, `serving_g` (default 100), `calories`, `protein_g`, `carbs_g`,
  `fat_g`, `category` check(`protein`/`carb`/`fat`/`mixed`/`vegetable`), `created_by`→profiles. RLS:
  read anon+auth, write admin (espeja `exercises`). Bucket Storage `food-images` (público, admin write, 5MB jpg/png/webp).
- `nutrition_profiles` (datos físicos opcionales, 1 por usuario): `user_id`→auth.users UNIQUE,
  `gender`, `age`, `height_cm`, `weight_kg`, `body_fat_pct` (nullable), `activity_level`, `goal`,
  + columnas calculadas cacheadas (`maintenance_kcal`, `target_kcal`, `protein_g`, `carbs_g`, `fat_g`).
  RLS owner-only (`auth.uid() = user_id`), espeja `saved_routines`.
- `diet_templates`: `name`, `description`, `meals_count`, `created_by`→profiles. Read público, write admin.
- `diet_template_meals`: `diet_template_id`→cascade, `meal_order`, `name`, `description`,
  `kcal_target` (o `kcal_pct`), guía de macros. UNIQUE(diet_template_id, meal_order).

**Wiring:** crear `app/lib/foods.ts`, `app/lib/diet-templates.ts`, `app/lib/nutrition-profile.ts`
(todas `server-only`, patrón list/get/create/update/delete con mappers). Las páginas de Fase 1
dejan de leer el mock y leen estas funciones. Las acciones de admin pasan a persistir
(patrón `actions.ts` con `requireAdmin()` + `revalidatePath`). Upload de imagen client-side a `food-images`.

Verificación Fase 2: `pnpm lint` + `pnpm build`; pruebas SQL vía MCP (`execute_sql`) de RLS;
skill `webapp-testing` repite el recorrido contra datos reales (crear alimento admin → aparece en catálogo →
generar dieta → sugerencias coherentes).

---

## Fase 3 — Extras (sólo con OK del usuario tras ver el core)

Cada uno reusa un patrón ya existente:
- **Registro diario de comidas** — espeja `workout_sessions`/`workout_session_items`. Tablas
  `meal_logs` + `meal_log_items`. Vista de seguimiento del día vs objetivo.
- **Calendario de adherencia** — reusa `TrainingCalendarCard.tsx` con fechas de dieta cumplida.
- **Guardar dieta activa** — espeja `saved_routines`: tabla `saved_diets` (user, diet, is_active único).

---

## Archivos críticos a crear/modificar

Nuevos (Fase 1): `app/lib/nutrition-types.ts`, `nutrition-mock.ts`, `nutrition-calc.ts`,
`nutrition-suggest.ts`; rutas `app/nutricion/**`, `app/admin/alimentos/**`, `app/admin/dietas/**`.
Modificar: `app/components/shared/navigation-config.ts` (entradas nav).

Nuevos (Fase 2): `supabase/migrations/<ts>_nutrition.sql`; `app/lib/foods.ts`,
`diet-templates.ts`, `nutrition-profile.ts`, `foods-form.ts`, `foods-validation.ts`,
`food-config.ts`. Modificar: `docs/DATABASE.md`, `docs/codex/ROUTING_GRAPH.md`,
páginas de Fase 1 (mock → datos reales).

---

## Verificación end-to-end

1. `pnpm lint && pnpm build` sin errores.
2. Skill `webapp-testing` (Playwright): recorrido completo mobile-first — catálogo alimentos →
   cuestionario perfil (con y sin % graso) → dieta automática → dieta predeterminada → sugerencias
   por macro. Verificar que kcal totales de sugerencias ≈ objetivo y macros coherentes.
3. Admin: crear/editar/borrar alimento y dieta; confirmar reflejo en vistas de usuario.
4. RLS vía MCP: usuario no-admin no puede escribir `foods`; sólo ve su `nutrition_profile`.

## Riesgos

- **% graso autoreportado** impreciso → Katch-McArdle puede desviar; el fallback Mifflin mitiga.
- **Sugerencias por macro**: ajustar gramajes para que el total kcal cierre sin volverse irreal
  (porciones gigantes). Acotar con piso/techo de gramos por alimento.
- **Scope grande**: tres fases. Mantener Fase 1 puramente visual evita arrastrar deuda de DB temprano.
- Datos físicos son sensibles: `nutrition_profiles` debe ser owner-only estricto en RLS.
