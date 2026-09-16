# Graph Report - gymcontrol  (2026-09-15)

## Corpus Check
- 556 files · ~3,972,026 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5075 nodes · 7298 edges · 441 communities (398 shown, 43 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `25c9a877`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Definir lineamientos de instrucciones optimizadas en tokens
- PLAN.md
- ARCHITECTURE.md (gateway)
- docs/architecture/07-frontend-experience.md
- OTP por email de 6 digitos
- recipes.ts
- ARCHITECTURE.md
- G5.5 - RLS And Policies
- AGENTS.md (Gymcontrol)
- DATABASE.md
- Button.tsx
- graphify Skill (/graphify)
- recetas/actions.ts
- PLAN.md (MVP Execution Plan)
- Tabla de rutina y modal de ejercicio
- saved-routines.ts
- G13-auth-transition/README.md
- admin/page.tsx
- AGENTS.md Project Router
- PrimaryNavigation Component
- DATABASE.md - data model source of truth
- catalogo/page.tsx
- registro/actions.ts
- app/alimentos/actions.ts
- Globe Icon
- RoutineCatalogClient.tsx
- exercise-demo.ts
- routine-validation.ts
- Next.js Logo
- exercise-validation.ts
- NutritionCatalogClient.tsx
- request-otp/route.ts
- foods.ts
- RutinasOverview.tsx
- Codex G11 Upload Placeholder Image
- dependencies
- Frontend Experience
- nutrition-types.ts
- What You Must Do When Invoked
- What You Must Do When Invoked
- Plan — Tanda de mejoras UI + feature reps
- Definir estilo base de tabla de rutina y modal de ejercicio: fijar dos patrones centrales de lectura
- compilerOptions
- MCP Supabase Setup For GymControl
- Dashboard principal — Rearquitectura de layout (FASE 2) + Piel premium (FASE 3)
- meal-logs.ts
- Mapa de vistas y transiciones
- Fixes por área
- RegistroClient
- Tareas
- Crear tabla `saved_routines`
- Plan: arreglos responsive mobile
- Routing Graph
- components.json
- 1. Diagnóstico — diferencias actuales vs referencia
- Fase 1 — Patrones reutilizables por tipo de página
- Cambios por página
- Documentation Roadmap
- Trabajo por área
- Plan: corrección visual del dashboard principal (PWA) vs referencia
- Disenar pantalla mis rutinas con rutina activa: ordenar la gestion personal del usuario
- 01-confirmar-stack-final-y-dependencias-necesarias.md
- workout-sync.ts
- Project Foundations
- Skills And Agents
- Capas minimas del sistema
- Crear estructura de carpetas pactada: materializar la organizacion tecnica definida
- Cambios (todos en `app/page.tsx` salvo E)
- Plan: unidades de alimentos, comidas con nombre, figura grasa, layout /configuración
- Working Agreements
- Cambios visuales (mobile, dentro del bloque `lg:hidden` y la card de plan)
- Plan: Rediseño responsive mobile (GymControl)
- Plan — Pulido visual: nutrición/registro, configuración, admin/alimentos
- exercises.ts
- Disenar entradas para gestion de ejercicios y rutinas: preparar el punto de partida administrativo real
- Documentar bootstrap admin verificable: asegurar una cuenta admin util para QA del MVP
- Proteger admin dashboard para rol admin: restringir la entrada a la zona administrativa
- Cambios por área
- Tareas
- Plan: corrección visual dashboard principal (PWA) → fidelidad a referencia
- Prompt Templates
- Plan: corrección fidelidad visual Dashboard principal (PWA)
- Definir navegacion base para usuario y admin: ordenar el acceso principal del producto
- Decisiones confirmadas (previews aprobadas)
- Corrección visual — Dashboard principal (PWA) — Ronda 2
- CLAUDE.md (Gymcontrol)
- Plan — Mejorar pantalla de ejecución del día (`/rutinas/dia`)
- 10-aplicar-migracion-en-supabase-y-verificar-esquema-real.md
- app/page.tsx
- Disenar e implementar componente base de modal: crear la pieza reutilizable del detalle de ejercicio
- Mostrar nombre, imagen y descripcion del ejercicio: completar el contenido minimo del emergente
- Permitir apertura y cierre sin abandonar la pagina: conservar el contexto de la vista actual
- Integrar el modal en catalogo de rutinas: llevar el detalle de ejercicio al flujo de exploracion
- Integrar el modal en dashboard de usuario: reutilizar el detalle emergente en la experiencia autenticada
- Integrar el modal en otras vistas del MVP que muestren ejercicios: cerrar la cobertura transversal del componente
- Asegurar comportamiento claro en desktop y mobile: adaptar el modal a los contextos principales de uso
- Revisar accesibilidad minima de foco, cierre y lectura: cerrar la calidad base del modal
- Probar flujo admin de creacion de ejercicios: validar la base del recurso ejercicio de punta a punta
- Probar flujo admin de creacion de rutinas semanales: validar la estructura completa de la rutina
- Probar flujo usuario de exploracion, guardado y renombrado: validar la experiencia principal del usuario
- Probar apertura del modal de ejercicio desde multiples contextos: validar consistencia transversal
- Revisar validaciones, mensajes de error y estados vacios: cerrar la robustez minima de la UX
- Revisar permisos para evitar acciones admin desde no admin: validar la seguridad funcional del MVP
- Revisar consistencia visual minima entre vistas: unificar la experiencia del MVP
- Resolver bugs detectados en pruebas finales: cerrar problemas funcionales antes del cierre del MVP
- createSupabaseServerClient
- Ejecutar validacion tecnica final del MVP: confirmar que la base esta lista para cierre
- Actualizar README y documentos principales: alinear la documentacion con el estado real del MVP
- Registrar decisiones finales y desvios del plan: dejar trazabilidad del recorrido del MVP
- Confirmar que el MVP cumple el alcance funcional pactado: validar la entrega contra el objetivo original
- Confirmar pendientes post-MVP: separar claramente el cierre del backlog futuro
- Dejar listo el backlog de la siguiente iteracion: preparar el siguiente ciclo sin mezclarlo con el cierre
- Definir el contrato de auth dual para GymControl: fijar el nuevo modelo de acceso del proyecto
- Documentar la brecha entre magic link actual y auth dual objetivo: dejar claro que cambia y que se conserva
- Definir el flujo OTP por email de 6 digitos: cerrar la experiencia passwordless principal
- Definir el flujo alternativo de Google OAuth: agregar un segundo acceso sin romper la estrategia principal
- Definir como convergen sesion y perfil entre OTP y Google: evitar dos modelos de usuario dentro de GymControl
- Definir redirecciones y reglas de acceso segun rol: mantener una navegacion segura durante la transicion auth
- Disenar la nueva pantalla de auth dual: unificar OTP y Google en una sola entrada de acceso
- Plan: Arreglar login OTP 6 digitos + desbloquear validacion responsive
- Fase 5 — Micro-interacciones · Dashboard principal
- Implementar requestOtp mediante endpoint protegido: desacoplar la solicitud de codigo del magic link actual
- Agregar rate limit minimo para solicitud de OTP: reducir abuso basico del endpoint de acceso
- Implementar verificacion de OTP y creacion de sesion: cerrar el acceso passwordless dentro de la app
- Plan: Fixes de front en /configuracion, /nutricion/registro y /admin/alimentos
- Adaptar el callback auth para Google OAuth y retirar dependencia del callback en OTP: separar correctamente ambos flujos
- Confirmar si el trigger actual de profiles alcanza sin capa extra de sync: reutilizar el modelo de usuario actual antes de agregar complejidad
- Refactorizar la capa auth y guards sin romper roles: mantener un unico punto de verdad para acceso y autorizacion
- Retirar el flujo principal de magic link: limpiar el acceso antiguo sin romper compatibilidad necesaria
- Plan — Responsive mobile fixes (Home, Nutrición/Registro, Admin)
- Cambios
- Documentar configuracion externa de Supabase para OTP por codigo: dejar operativa la parte fuera del repo
- Documentar configuracion externa de Google OAuth: preparar el proveedor alternativo fuera del repo
- Cambios por sección
- Plan — Rediseño mobile `/dashboard/rutinas` como dashboard semanal
- Plan: Responsive audit + fixes (desktop / tablet / mobile)
- Revalidar compatibilidad con profiles, bootstrap admin y RLS: confirmar que la transicion auth no rompa el modelo del MVP
- Cambios propuestos
- Guardar arquitectura pactada: consolidar la definicion final en docs/ARCHITECTURE.md
- Crear formulario para alta de ejercicio: permitir la carga administrativa del recurso
- Crear edicion basica de ejercicio si aplica: habilitar ajuste minimo del recurso en el MVP
- Exponer datos de ejercicio para consumo transversal: habilitar reutilizacion en catalogo, rutinas y modal
- Verificar persistencia y recuperacion correcta: asegurar consistencia del recurso ejercicio
- Implementar persistencia de rutina plantilla: crear acceso a datos sobre `routine_templates`
- Implementar persistencia de dias de rutina semanal: modelar la subdivision por dias
- Implementar persistencia de filas de ejercicio: guardar ejercicio, series, repeticiones, RIR y descanso
- Crear listado de rutinas en admin dashboard: exponer las rutinas administradas
- Crear builder o formulario de rutina semanal: permitir al admin construir la rutina base
- Permitir agregar multiples dias a una rutina: materializar la naturaleza semanal del recurso
- Permitir agregar multiples filas de ejercicios por dia: completar la tabla funcional de cada jornada
- Validar recuperacion de rutina con estructura completa: asegurar lectura coherente de la rutina semanal
- Verificar consistencia de referencias a ejercicios: asegurar integridad entre rutinas y catalogo de ejercicios
- Crear vista catalogo de rutinas disponibles: exponer las rutinas para exploracion del usuario
- Mostrar informacion minima util de cada rutina: facilitar la eleccion desde el catalogo
- Permitir entrar al detalle de una rutina: ampliar la consulta sin perder claridad de navegacion
- Mostrar estructura semanal de la rutina elegida: presentar dias y filas de forma entendible
- Hacer clickeables los ejercicios para su detalle: conectar el catalogo con el modal de ejercicio
- Preparar punto de accion para guardar rutina: conectar el catalogo con el dashboard del usuario
- Implementar accion para guardar rutina en cuenta: conectar el catalogo con la cuenta del usuario
- Permitir que el usuario tenga mas de una rutina guardada: soportar multiples elecciones del catalogo
- Definir representacion entre rutina plantilla y rutina guardada: cerrar la logica del recurso del usuario
- Permitir asignar nombre propio a cada rutina guardada: habilitar personalizacion basica del usuario
- Permitir editar nombre desde el dashboard: completar la personalizacion de rutinas guardadas
- Crear dashboard de usuario con listado de rutinas guardadas: materializar la vista principal del usuario autenticado
- Permitir ver detalle de cada rutina guardada: llevar la consulta del usuario mas alla del listado
- Mantener acceso al modal de detalle de ejercicio: reutilizar la experiencia de ayuda dentro del dashboard
- Estructura de carpetas
- Estrategia de implementacion
- Navegacion base
- RegistroClient.tsx
- Plan: arreglar registro de nutrición + UX cards + centrado figura grasa + backfill porciones
- Plan: arreglos visuales PWA
- Plan: Admin dashboard + Ejercicios + Rutinas (design impl) + lupita fix
- Env Index
- Login redesign — audit-driven polish + app-native container
- Plan: Admin Dashboard en `/admin`
- Plan: Fix 6 PWA bugs (login, OTP, rename rutina, registro pesos, play ejercicio, config overflow)
- Plan: rediseño nutrición + ajustes UI
- Plan: Imágenes para body-fat, alimentos y recetas (PWA)
- Plan: corrección visual dashboard principal (PWA)
- Plan — Corrección visual Dashboard principal (PWA) vs referencia
- Mejora Home mobile (app/page.tsx)
- Mejora visual de `/catalogo` (rutinas)
- Dashboard principal (`/`) — Audit + Redesign plan
- Mobile responsive redesign — gymcontrol
- Grupo "G6" - Ejercicios admin
- Dirección de rediseño (GymControl)
- Plan — Sidebar fit, nutrición lista, /configuración, registro rediseñado
- Plan — Apartado de Nutrición (alimentos, calorías, macros, dietas)
- Fases (secuenciales, con gate de verificación)
- Guardar acuerdo de minima manipulacion de la base: dejar explicita la regla de simplicidad del esquema
- Rediseño cards sin borde + headers compactos
- Identificar tareas recurrentes que justifican skills o agentes: separar necesidad real de conveniencia
- Plan: Hero estático + popup GIF en detalle de ejercicio
- Cambios
- Definir cantidad minima de skills necesarias: acotar el set util del proyecto
- Plan: nutrición — imagen grasa, alimentos por unidad, baja de dietas, card de registro
- Plan: arreglos de layout en /admin, /admin/ejercicios, /admin/rutinas y /catalogo
- Guardar definicion en SKILLS_AND_AGENTS.md: consolidar la decision final del grupo
- Definir shell principal con panel lateral izquierdo: establecer la estructura visual base del producto
- map-exercisedb-demos.mjs
- Definir mapa real de vistas y transiciones: dejar explicito como se recorre el frontend
- Confirmar fronteras entre agregar rutinas, mis rutinas, ejercicio y admin: evitar mezclar modulos en el frontend
- Definir direccion visual general del producto: acordar la identidad frontend del MVP
- Definir tipografia, paleta, superficies y espaciado base: consolidar el sistema visual minimo
- Definir patron visual del panel lateral y area de contenido: ordenar la composicion principal del producto
- Plan — Corrección visual Dashboard principal (PWA) vs referencia
- Disenar pantalla agregar rutinas: preparar la vista de exploracion y seleccion del usuario
- Validar flujos auth duales y logout: comprobar que OTP y Google funcionen de punta a punta
- Disenar pantalla ejercicio con organigrama semanal: traducir la rutina activa a lectura por dias
- workout-tracking.ts
- Disenar comportamiento del modal de ejercicio: resolver consulta contextual sin abandonar la rutina
- Disenar base visual de admin dashboard: preparar una capa administrativa clara y consistente
- Ejecutar validacion tecnica de la transicion auth: cerrar chequeos minimos del cambio transversal
- Actualizar documentacion final y contexto del repo tras cerrar G13: dejar el nuevo login reflejado en las fuentes de verdad
- validate-mobile.mjs
- Delimitar alcance final del MVP: confirmar que entra en la primera version y que queda fuera
- Definir modulos principales del producto: establecer las secciones base de la aplicacion
- Definir responsabilidades y fronteras: separar UI, logica y persistencia sin sobreingenieria
- Configurar estilos base y UI compartida: preparar la capa visual minima reutilizable
- Configurar acceso a base de datos y entorno: preparar la conexion tecnica del proyecto
- Crear layout base y navegacion inicial: dejar una estructura navegable minima del producto
- Documentar flujo admin para crear ejercicios: describir el recorrido funcional de alta y persistencia
- Definir estrategia minima de RLS y helper de admin: fijar reglas base antes de escribir policies
- Documentar flujo admin para crear rutinas semanales: describir dias, filas y estructura de trabajo
- Documentar flujo usuario para explorar, elegir, guardar y renombrar rutinas: describir el recorrido principal del usuario
- Documentar flujo de apertura del detalle emergente de ejercicio: definir la interaccion sin abandonar la pagina
- Definir estructura de carpetas y convenciones de nombres: ordenar el repositorio antes de implementar
- Definir estrategia de componentes, vistas, acciones y validaciones: acordar el patron de implementacion
- Listar entidades minimas necesarias: identificar las piezas de datos indispensables del MVP
- Definir atributos minimos por entidad: acordar los campos necesarios sin sobrecargar el esquema
- Definir type_rol y su uso en permisos: representar el control minimo de acceso en datos
- Definir redirecciones segun estado autenticado y rol: ordenar la navegacion de acceso
- Definir relacion entre rutina, dias y filas: estructurar la rutina semanal del MVP
- Proteger acciones de creacion y edicion administrativas: cerrar la escritura sensible al rol admin
- Validar acceso normal al dashboard de usuario: habilitar la experiencia autenticada no administrativa
- Definir relacion entre usuarios y rutinas guardadas: soportar multiples rutinas con nombre propio
- Definir estrategia para imagenes de ejercicios: resolver almacenamiento o referencia sin complejizar
- Revisar si el modelo puede simplificarse: reducir complejidad antes de congelar el esquema inicial
- Redactar documento de base de datos: consolidar entidades, atributos y relaciones
- Cerrar DATABASE.md como fuente de verdad: dejar el modelo inicial listo para los grupos siguientes
- Separar necesidades reales de ideas prematuras: filtrar skills o agentes innecesarios
- Decidir que puede resolverse sin skill dedicada: evitar fragmentacion innecesaria
- Definir si hace falta algun agente adicional: justificar o descartar multiagente para el MVP
- Documentar responsabilidades, limites y criterio de uso: dejar cada skill o agente bien acotado
- Modulos principales del producto
- Flujos principales
- Implementar shell navegable definitivo del frontend base: llevar la nueva experiencia al layout real
- Implementar vistas base y placeholders del nuevo flujo: dejar visibles las pantallas clave del frontend
- Crear tabla `profiles`
- Crear tablas `routine_templates` y `routine_days`
- Validar navegacion, responsive y smoke tecnico del frontend base: asegurar que la nueva base frontend funcione en uso real
- Instalar y configurar librerias imprescindibles: preparar las dependencias reales del proyecto
- Generar migracion SQL final de G2
- Aplicar migracion en Supabase y verificar esquema real
- Sincronizar documentacion operativa de G2
- GymControl
- routine-week.ts
- graphify reference: extra exports and benchmark
- Limpiar el boilerplate inicial: quitar lo que no aporta al producto
- Dejar esqueleto navegable de las vistas principales: preparar la app para la implementacion funcional
- Habilitar RLS en tablas del MVP: activar la proteccion base del esquema aplicado
- graphify reference: query, path, explain
- Documentar lecturas de catalogo del MVP: cerrar que actores pueden consultar el contenido base
- Aplicar policies para profiles: limitar lectura y edicion del perfil de aplicacion
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- Aplicar policies para catalogo base: cubrir exercises, routine_templates, routine_days y routine_items
- Aplicar policies para saved_routines: aislar las rutinas guardadas por usuario
- Restringir escrituras administrativas a admin: cerrar la autorizacion de cambios globales
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- Validar escenarios anon, authenticated, admin y owner: comprobar el comportamiento real de las policies
- Confirmar bootstrap admin y criterio de QA manual: cerrar la operativa minima para validar permisos
- Probar escenarios basicos de acceso permitido y denegado: validar el comportamiento del control de acceso
- Ajustar mensajes o UX minima ante accesos no permitidos: cerrar la experiencia de bloqueo con claridad
- Grupo "G12" - Cierre del MVP
- Fronteras entre secciones
- Patron visual del panel y contenido
- Entradas administrativas para gestion
- Sistema visual minimo
- Implementar modelo persistente de ejercicio: crear acceso a datos sobre `exercises`
- Implementar validaciones de alta y edicion: asegurar consistencia minima de los ejercicios
- G6-admin-exercises/README.md
- Resolver almacenamiento o referencia de imagenes: conectar el ejercicio con su recurso visual
- sync-fitnessprogramer-images.mjs
- Plan - indice y orden de ejecucion
- Grupo "G4.5" - Frontend base y experiencia
- Crear vista de listado de ejercicios en admin dashboard: exponer el recurso al administrador
- .claude/skills/graphify/references/extraction-spec.md
- Alcance del MVP
- auth.ts
- DayWorkoutClient.tsx
- media-manifest.mjs
- Plan: ajustes UI (home, catalogo, rutina detalle, dashboard)
- Plan: rediseño login + ejercicios clickeables + reestructura day-workout
- G2.1 - Implementacion de G2 en Supabase
- Plan: 3 mejoras de UI (configuración, admin/alimentos, nutrición/registro)
- Grupo "G2" - Base de datos
- Grupo "G13" - Transicion de auth dual
- Grupo "G5" - Autenticacion y roles
- Confirmar stack final y dependencias necesarias: cerrar la base tecnica del MVP
- Traducir `docs/DATABASE.md` a reglas SQL concretas
- Definir utilidades comunes minimas del esquema
- Agregar constraints e indices minimos finales
- Plan: imagen + GIF de ExerciseDB en el detalle de ejercicio
- fetch-dataset-images.mjs
- Plan: Exercise Detail Modal — PWA Visual Fixes
- Development Workflow
- Development Workflow
- Development Workflow
- Development Workflow
- Development Workflow
- Grupo "G10" - Modal de ejercicio
- Grupo "G11" - Integracion y QA del MVP
- Grupo "G1" - Arquitectura
- Grupo "G3" - Skills y agentes
- Grupo "G4" - Setup tecnico del MVP
- Grupo "G5.5" - RLS y policies
- Grupo "G7" - Rutinas admin
- Grupo "G9" - Dashboard de usuario
- Development Workflow
- Codex Tactical Routing Layer (docs/codex/)
- Skills and Subagents Routing Policy
- supabase_gymcontrol MCP
- Execution Flow
- Development Workflow
- Development Workflow
- Development Workflow
- eslint.config.mjs
- Development Workflow
- .mcp.json
- next.config.ts
- postcss.config.mjs
- sw.js
- Execution Flow
- Development Workflow
- upload-generated-images.mjs
- render-generated-images.ps1
- graphify reference: extra exports and benchmark
- sync-exercise-images.mjs
- MuscleAnatomy.tsx
- login/page.tsx
- workout-sync-queue.ts
- Plan: Fixes responsive mobile (Home cuerpo + Nutrición registro)
- Codex context layer maintenance rules
- private.is_current_user_admin() helper
- G5 - Auth And Roles
- render_body_fat.py
- graphify reference: query, path, explain
- 05-crear-tablas-routine-templates-y-routine-days.md
- SKILL_ROUTING
- 01-definir-estrategia-minima-de-rls-y-helper-de-admin.md
- G2 - Database
- G7 - Admin Routines
- 4. Decisiones tomadas
- G12 - MVP Closure
- Traduccion SQL preliminar para G2.1
- G3 - Skills And Agents
- G4.5 - Frontend Base And Experience
- G4 - MVP Setup
- Crear tabla `routine_items`
- PrimaryNavigation.tsx
- G8 - Routine Catalog
- G9 - User Dashboard
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- RLS y policies del MVP
- RouteCard.tsx
- WeekStripCard.tsx
- Apartado de nutricion (G18)
- dashboard/rutinas/dia/page.tsx
- Apartado de nutricion - extras (G21)
- exercise-image.ts
- Entidades minimas necesarias
- getSupabasePublicEnv
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- Body fat reference images
- .codex/skills/graphify/references/extraction-spec.md
- input-otp
- lucide-react
- radix-ui
- Crear tabla `exercises`
- @radix-ui/react-dropdown-menu
- @radix-ui/react-separator
- @radix-ui/react-slot
- react-dom
- registro/page.tsx
- ExerciseAdminClient.tsx
- vaul
- app/dashboard/page.tsx (Dashboard Route)
- app/page.tsx (Home Page Route)
- backfill-exercise-static-frames.mjs
- clear-exercise-images.mjs
- app/dashboard/rutinas/page.tsx (Routines Detail Route)
- DESIGN.md — GymControl Design System
- docs/codex/
- _find-missing.mjs
- devDependencies
- scripts
- Disenar pantalla de detalle diario de rutina: enfocar la consulta del entrenamiento del dia
- package.json
- Ciclo AUDITAR ⇄ EJECUTAR — 2 prompts
- README.md (repo)
- Redesign Playbook (Gymcontrol)
- cn
- createMealWithItems
- Implementar autenticacion base de usuario: habilitar Supabase Auth server-side para el MVP
- Integrar acceso admin en el shell general: unificar la entrada administrativa sin duplicar la experiencia base
- Integrar type_rol al flujo de acceso y sesion: distinguir admin de usuario normal
- routines.ts
- 02-integrar-type-rol-al-flujo-de-acceso-y-sesion.md
- recipe-nutrition.ts
- Acceso admin integrado en shell general
- Fases
- FoodAdminClient
- react
- zod
- RecipeCatalogClient
- Plan — Huecos de la auditoría (Ejercitación + Alimentación)
- RoutineFormSheet
- meal-order.ts
- SurfaceCard.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 131 edges
2. `createSupabaseServerClient()` - 79 edges
3. `DATABASE.md - data model source of truth` - 37 edges
4. `requireUser()` - 35 edges
5. `Button()` - 32 edges
6. `RegistroClient()` - 25 edges
7. `PLAN.md` - 24 edges
8. `isValidSet()` - 22 edges
9. `Frontend Experience` - 22 edges
10. `addDaysToDateKey()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `tabsFor()` --calls--> `buildDayTabs()`  [EXTRACTED]
  tests/unit/routine-week.test.mjs → app/lib/routine-week.ts
- `primaryCount()` --calls--> `resolveDockAction()`  [EXTRACTED]
  tests/unit/routine-week.test.mjs → app/lib/routine-week.ts
- `Project Foundations` --rationale_for--> `Architecture - MVP Scope`  [INFERRED]
  docs/PROJECT_FOUNDATIONS.md → docs/architecture/01-scope.md
- `graphify Usage Rules` --references--> `graphify Skill (/graphify)`  [EXTRACTED]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `Grupo G13 - Transicion de auth dual` --implements--> `Auth Dual: OTP Email + Google OAuth`  [INFERRED]
  PLAN.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **G5 admin access control layer (layout guards + server guards + redirects)** — g5_auth_and_roles_admin_layout_guard, g5_auth_and_roles_dashboard_layout_guard, g5_auth_and_roles_requireuser_requireadmin, g5_auth_and_roles_redirect_strategy [EXTRACTED 0.90]
- **graphify Full Pipeline (Detect, Extract, Build, Cluster, Export, Update)** — claude_skills_graphify_skill_pipeline_steps, claude_skills_graphify_references_extraction_spec_subagent_prompt, claude_skills_graphify_references_update_graphify_update_incremental, claude_skills_graphify_references_exports_graphify_export_wiki, claude_skills_graphify_skill_query_path_explain [EXTRACTED 0.90]
- **G13 Auth Dual Migration: Magic Link to OTP+Google** — gymcontrol_plan_g13_transicion_auth_dual, gymcontrol_readme_auth_dual_otp_google, gymcontrol_readme_profiles_type_rol, gymcontrol_plan_g5_autenticacion_y_roles [EXTRACTED 0.90]
- **Decision de auth dual: OTP + Google OAuth sobre Supabase Auth, reemplazando magic link** — g13_auth_transition_concept_otp_email, g13_auth_transition_concept_google_oauth, g13_auth_transition_concept_supabase_auth, g13_auth_transition_concept_magic_link [EXTRACTED 0.95]
- **Auth flow (OTP + Google OAuth) resolves to profiles.type_rol for both module access and RLS** — flows_acceso_vigente, modules_acceso_y_sesion, docs_database_doc_profiles, docs_database_doc_rls_policies_g55, docs_database_doc_handle_new_user_trigger [EXTRACTED 1.00]
- **G4.5 sequential decision chain consolidated into 07-frontend-experience.md** — frontend_experience_shell_principal, frontend_experience_navegacion_base, frontend_experience_mapa_vistas, frontend_experience_direccion_visual, docs_architecture_07_frontend_experience_doc [EXTRACTED 1.00]
- **Flujo de guardado y personalizacion de rutinas en cuenta de usuario** — g9_user_dashboard_01_implementar_accion_guardar_rutina, g9_user_dashboard_02_permitir_multiples_rutinas_guardadas, g9_user_dashboard_03_definir_representacion_rutina_plantilla_guardada, g9_user_dashboard_04_permitir_nombre_propio_rutina_guardada, g9_user_dashboard_05_permitir_editar_nombre_dashboard [EXTRACTED 1.00]
- **Flujo de dashboard, listado y detalle de rutina guardada con modal de ejercicio** — g9_user_dashboard_06_crear_dashboard_listado_rutinas_guardadas, g9_user_dashboard_07_permitir_ver_detalle_rutina_guardada, g9_user_dashboard_08_mantener_acceso_modal_detalle_ejercicio, concept_rutina_guardada_usuario [EXTRACTED 1.00]
- **External configuration documentation for OTP and Google providers** — concept_supabase_otp_email_config, concept_google_oauth_external_config, concept_auth_dual [INFERRED 0.75]
- **Auth + role integration spanning G5 and shell admin access** — g5_auth_and_roles_01_implementar_autenticacion_base_de_usuario, g5_auth_and_roles_02_integrar_type_rol_al_flujo_de_acceso_y_sesion, frontend_experience_acceso_admin_shell, auth_context_rol [INFERRED 0.85]
- **Catalog detail to exercise modal navigation flow** — g8_routine_catalog_03_detalle_rutina, g8_routine_catalog_04_estructura_semanal_rutina, g8_routine_catalog_05_ejercicios_clickeables_detalle, exercise_detail_modal [INFERRED 0.85]
- **Exercise Modal Cross-View Integration** — exercise_modal_component, routine_catalog_view, user_dashboard_view [INFERRED 0.85]
- **OTP Flow Implementation Pipeline (UI -> request -> rate limit -> verify/session)** — concept_login_page, concept_request_otp_endpoint, concept_otp_rate_limit, concept_otp_verification_session [INFERRED 0.85]
- **Convergence of OTP and Google identities into single profile/role model** — specs_g13_auth_transition_05_definir_como_convergen_sesion_y_perfil_entre_otp_y_google_definir_como_convergen_sesion_y_perfil_entre_otp_y_google, concept_profiles_trigger, concept_profiles_type_rol, concept_auth_guards [INFERRED 0.85]
- **MVP Closure Documentation Update** — readme_md, docs_architecture_md, docs_database_md, docs_skills_and_agents_md, plan_md [INFERRED 0.85]
- **MVP End-to-End QA Validation** — admin_exercise_creation_flow, admin_routine_builder_flow, user_exploration_save_rename_flow, role_based_access_control [INFERRED 0.85]
- **Routine template/day/item data model used across architecture flows and DATABASE.md** — docs_database_doc_routine_templates, docs_database_doc_routine_days, docs_database_doc_routine_items, flows_admin_crear_rutinas_semanales, modules_admin_dashboard [INFERRED 0.85]
- **Admin routine builder flow: form, multi-day, multi-row support** — g7_admin_routines_05_builder_formulario_rutina_semanal, g7_admin_routines_06_multiples_dias_rutina, g7_admin_routines_07_multiples_filas_ejercicios_dia [INFERRED 0.85]
- **Routine persistence chain: templates -> days -> items -> exercises** — g7_admin_routines_routine_templates_table, g7_admin_routines_routine_days_table, g7_admin_routines_routine_items_table, g6_admin_exercises_exercises_table [INFERRED 0.90]

## Communities (441 total, 43 thin omitted)

### Community 1 - "PLAN.md"
Cohesion: 0.09
Nodes (50): Admin Exercise Creation Flow, Admin Weekly Routine Builder Flow, Modal de detalle de ejercicio (patron reutilizable), Rutina guardada de usuario (recurso de cuenta), docs/architecture/, docs/ARCHITECTURE.md, docs/DATABASE.md, docs/PROJECT_FOUNDATIONS.md (+42 more)

### Community 2 - "ARCHITECTURE.md (gateway)"
Cohesion: 0.11
Nodes (26): Architecture - MVP Scope, Architecture - Modules, Architecture - Flows, Architecture - Layers and Boundaries, ARCHITECTURE.md (gateway), Nota, Orden recomendado de lectura, handle_new_user() trigger (+18 more)

### Community 3 - "docs/architecture/07-frontend-experience.md"
Cohesion: 0.13
Nodes (11): Fronteras funcionales entre modulos (Agregar rutinas, Mis rutinas, Ejercicio, Admin), Mapa de vistas y transiciones del MVP, Navegacion base usuario/admin en panel lateral, Pantalla Agregar rutinas (catalogo), Pantalla de detalle diario de rutina, Pantalla Ejercicio con organigrama semanal, Pantalla Mis rutinas con rutina activa, Patron visual panel lateral + area de contenido (+3 more)

### Community 4 - "OTP por email de 6 digitos"
Cohesion: 0.08
Nodes (42): app/auth/callback/route.ts, Auth Dual (OTP + Google OAuth), Auth Guards (getOptionalAuthContext, requireUser, requireAdmin), Bootstrap manual de admin, Configuracion externa Google OAuth (provider, callback URLs), Google OAuth Flow, app/lib/auth.ts, app/auth/login/page.tsx (Auth Dual UI) (+34 more)

### Community 5 - "recipes.ts"
Cohesion: 0.14
Nodes (15): AdminRecetasPage(), RecipeAdminClient(), confirmDelete(), RecipeIngredient, AdminRecipeListItem, archiveRecipe(), formatDateLabel(), listAdminRecipes() (+7 more)

### Community 6 - "ARCHITECTURE.md"
Cohesion: 0.33
Nodes (4): Architecture, Orden recomendado de lectura, Regla, Architecture README index

### Community 7 - "G5.5 - RLS And Policies"
Cohesion: 0.29
Nodes (7): Dependencias, Estado final, G5.5 - RLS And Policies, Objetivo del grupo, Orden recomendado, Resolucion, Resultado esperado

### Community 8 - "AGENTS.md (Gymcontrol)"
Cohesion: 0.13
Nodes (14): Admin account, Agentes, AGENTS.md (Gymcontrol), Codex context layer maintenance, Context router, Formato de salida, Frontend, Fuentes de verdad (+6 more)

### Community 9 - "DATABASE.md"
Cohesion: 0.33
Nodes (3): Acuerdo de minima manipulacion de la base de datos, profiles.type_rol, supabase/migrations/

### Community 10 - "Button.tsx"
Cohesion: 0.14
Nodes (21): SheetExercise, TodayExercisesSheet(), ChooseRoutineMobile(), EmptyRoutineMobile(), ROUTINE_XXL_CLASS, RoutineSwitcher(), Button(), ButtonProps (+13 more)

### Community 11 - "graphify Skill (/graphify)"
Cohesion: 0.09
Nodes (24): graphify add <url>, graphify --watch, graphify benchmark (token reduction), graphify export neo4j / neo4j-push, graphify export svg / graphml, graphify export wiki, graphify.serve MCP server, Confidence Score Rubric (+16 more)

### Community 12 - "recetas/actions.ts"
Cohesion: 0.18
Nodes (16): handleSubmit(), INITIAL_RECIPE_FORM_STATE, ParsedRecipePayload, RecipeFormField, RecipeFormPayload, RecipeFormState, RecipeIngredientPayload, getRecipeById() (+8 more)

### Community 13 - "PLAN.md (MVP Execution Plan)"
Cohesion: 0.16
Nodes (19): Grupo G10 - Modal de ejercicio, Grupo G11 - Integracion y QA del MVP, Grupo G12 - Cierre del MVP, Grupo G13 - Transicion de auth dual, Grupo G1 - Arquitectura, Grupo G2 - Base de datos, Grupo G3 - Skills y agentes, Grupo G4.5 - Frontend base y experiencia (+11 more)

### Community 14 - "Tabla de rutina y modal de ejercicio"
Cohesion: 0.47
Nodes (6): Modal de ejercicio, Pantalla `Ejercicio`, Relacion entre tabla y modal, Tabla de rutina, Tabla de rutina y modal de ejercicio, Pantalla Detalle diario de rutina

### Community 15 - "saved-routines.ts"
Cohesion: 0.09
Nodes (40): activateRoutineFromCatalogAction(), revalidateRoutineSelection(), saveRoutineFromCatalogAction(), CatalogRoutineDetailPage(), CatalogRoutineDetailPageProps, StatPillProps, RoutineDetailClient(), activateIfRequested() (+32 more)

### Community 16 - "G13-auth-transition/README.md"
Cohesion: 0.22
Nodes (10): Google OAuth, Magic link (flujo legado de auth), OTP por email de 6 digitos, Supabase Auth (proveedor de autenticacion), @supabase/ssr (sesion web), Decision inicial del grupo, G13 - Auth Transition, Objetivo del grupo (+2 more)

### Community 17 - "admin/page.tsx"
Cohesion: 0.07
Nodes (46): DIFFICULTY_BADGE_VARIANT, quickActions, RecentExercisesTable(), fadeRow, RoutineDetailClientProps, ExerciseDetailModal(), ExerciseDetailModalProps, dayLabel() (+38 more)

### Community 20 - "DATABASE.md - data model source of truth"
Cohesion: 0.08
Nodes (31): Acuerdo de minima manipulacion, Campos que se mantienen fuera por ahora, DATABASE.md - data model source of truth, Decisiones de simplicidad aprobadas, exercise-images storage bucket (G6), exercises table, routine_days table, routine_items table (+23 more)

### Community 21 - "catalogo/page.tsx"
Cohesion: 0.52
Nodes (6): CatalogoPage(), listSavedRoutineStatusesForUser(), Catalogo Desktop Full Page (Sidebar + Filters + Routine Catalog Header), Catalogo Desktop Card Layout (Routine Cards Grid), Catalogo Mobile Full Page (Header + Filters + Routine List), Catalogo Mobile Card Layout (Routine Card Stacked View)

### Community 22 - "registro/actions.ts"
Cohesion: 0.09
Nodes (27): deleteMeal(), deleteMealItem(), MealLog, updateMeal(), FOOD_MEASURES, MEAL_LOG_MAX_PAST_DAYS, MEAL_TYPES, addItemSchema (+19 more)

### Community 23 - "app/alimentos/actions.ts"
Cohesion: 0.19
Nodes (19): deleteFoodAction(), saveFoodAction(), SaveFoodResult, FoodFormSheet(), handleSubmit(), saveOwnFoodAction(), SaveOwnFoodResult, createFood() (+11 more)

### Community 24 - "Globe Icon"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

### Community 25 - "RoutineCatalogClient.tsx"
Cohesion: 0.09
Nodes (24): getRoutineCoverImage(), getRoutineItemCount(), getVisiblePages(), RoutineCatalogCard(), RoutineCatalogClient(), handleClearFilters(), handleFilterChange(), RoutineCatalogClientProps (+16 more)

### Community 26 - "exercise-demo.ts"
Cohesion: 0.13
Nodes (26): dynamic, GET(), noStoreHeaders(), dynamic, GET(), noStoreHeaders(), RouteContext, ALLOWED_RESOLUTIONS (+18 more)

### Community 27 - "routine-validation.ts"
Cohesion: 0.11
Nodes (27): INITIAL_ROUTINE_FORM_STATE, RoutineDayWriteInput, RoutineFormDayPayload, RoutineFormField, RoutineFormItemPayload, RoutineItemFormField, RoutineItemWriteInput, RoutineStructureErrors (+19 more)

### Community 29 - "exercise-validation.ts"
Cohesion: 0.10
Nodes (25): EXERCISE_IMAGE_ACCEPT, EXERCISE_IMAGE_ALLOWED_EXTENSIONS, EXERCISE_IMAGE_ALLOWED_MIME_TYPES, EXERCISE_IMAGE_BUCKET, EXERCISE_IMAGE_MAX_SIZE_BYTES, EQUIPMENT_LABELS, EXERCISE_EQUIPMENT_OPTIONS, EXERCISE_MUSCLE_GROUPS (+17 more)

### Community 30 - "NutritionCatalogClient.tsx"
Cohesion: 0.07
Nodes (39): deleteOwnFoodAction(), FoodDetailSheet(), handleDelete(), FormState, NutritionCatalogClientProps, BusyState, OtpLoginFlowProps, requestErrorCopy (+31 more)

### Community 31 - "request-otp/route.ts"
Cohesion: 0.17
Nodes (21): isSupabaseRateLimitError(), json(), POST(), json(), POST(), OtpLoginFlow(), requestOtp(), verifyOtp() (+13 more)

### Community 32 - "foods.ts"
Cohesion: 0.17
Nodes (16): AdminFoodsPage(), NutritionCatalogClient(), NutricionPage(), getOptionalAuthContext, AdminFoodListItem, createAnonClient(), FoodInput, FoodRow (+8 more)

### Community 33 - "RutinasOverview.tsx"
Cohesion: 0.29
Nodes (4): fadeUp(), RutinasOverview(), confirmEdit(), RutinasOverviewProps

### Community 35 - "dependencies"
Cohesion: 0.09
Nodes (23): class-variance-authority, clsx, framer-motion, next, dependencies, class-variance-authority, clsx, framer-motion (+15 more)

### Community 36 - "Frontend Experience"
Cohesion: 0.15
Nodes (15): Area principal de contenido, Content plan, Direccion visual general, Estado implementado en G4.5, Frontend Experience, Interaction thesis, Limites de este paso, Panel lateral izquierdo (+7 more)

### Community 37 - "nutrition-types.ts"
Cohesion: 0.08
Nodes (45): BODY_FAT_VALUES, BodyFatFigure(), deleteAccountAction(), macroGramsSchema, manualTargetSchema, profileInputSchema, saveNutritionProfileAction(), saveProfileNameAction() (+37 more)

### Community 38 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (23): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+15 more)

### Community 39 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (23): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+15 more)

### Community 40 - "Plan — Tanda de mejoras UI + feature reps"
Cohesion: 0.09
Nodes (22): A. Calendario: ver el día al hacer hover, Archivos clave a tocar (resumen), B. Card "Esta semana": frase motivadora como protagonista, C. Login idéntico al design, Context, D. Filtros más anchos, search más angosto, centrar icono+label en Y, E. Contenido full-width + hover hasta los bordes, F. Alinear columna "Grupo muscular" (centrar) (+14 more)

### Community 41 - "Definir estilo base de tabla de rutina y modal de ejercicio: fijar dos patrones centrales de lectura"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Definir estilo base de tabla de rutina y modal de ejercicio: fijar dos patrones centrales de lectura, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 42 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 43 - "MCP Supabase Setup For GymControl"
Cohesion: 0.11
Nodes (18): 1. Obtener el `project_ref`, 2. Registrar el MCP en la config local del repo, 3. Mantener el espejo en `.mcp.json`, 3. Si usas autenticacion manual por token, 4. Reiniciar Codex, 5. Autenticar el servidor, 6. Convencion local dentro del repo, 7. Como pedirle a la IA que use el MCP correcto (+10 more)

### Community 44 - "Dashboard principal — Rearquitectura de layout (FASE 2) + Piel premium (FASE 3)"
Cohesion: 0.09
Nodes (21): Archivos a modificar, Archivos a modificar (FASE 4-6), Context, Context (FASE 4-6), Dashboard principal — Rearquitectura de layout (FASE 2) + Piel premium (FASE 3), Decisiones de agrupamiento / jerarquía / densidad, FASE 2 — Sistema de distribución espacial, FASE 3 — Piel premium (solo si FASE 2 aprobada; NO cambia layout) (+13 more)

### Community 45 - "meal-logs.ts"
Cohesion: 0.12
Nodes (27): buildItemValues(), ensureMealLogId(), findMealLogId(), FoodRow, ItemNutrition, ItemValues, mapMealGroup(), mapMealLog() (+19 more)

### Community 46 - "Mapa de vistas y transiciones"
Cohesion: 0.25
Nodes (8): Comportamiento del modal de ejercicio, Mapa de vistas y transiciones, Pantalla `Agregar rutinas`, Pantalla `Detalle diario de rutina`, Pantalla `Mis rutinas`, Tipos de transicion, Vistas admin, Vistas de usuario

### Community 47 - "Fixes por área"
Cohesion: 0.10
Nodes (20): A. Sonner global, /admin (`app/admin/page.tsx`) — #1, /admin/ejercicios (`ExerciseAdminClient.tsx`, `actions.ts`, `app/lib/exercises.ts`), /admin/rutinas (`RoutineAdminClient.tsx`, `actions.ts`), Auth — #8, B. Radix DropdownMenu, C. Fix borde violeta persistente en filtros (global), /catalogo (`app/catalogo/page.tsx`, `RoutineCatalogClient.tsx`) (+12 more)

### Community 48 - "RegistroClient"
Cohesion: 0.13
Nodes (14): createMealAction(), moveMealAction(), calculateStreak(), dateKeyToDate(), formatDayMonth(), formatDayTitle(), RegistroClient(), applyResult() (+6 more)

### Community 49 - "Tareas"
Cohesion: 0.10
Nodes (19): 10. Admin: alineacion tabla ejercicios y rutinas, 11. Mejorar UI crear/editar ejercicio, 12. Mejorar UI crear/editar rutina, 13. Dashboard: boton borrar roto, 14. Home: card calendario minimalista (cuadrados tipo Claude), 15. Home: card asistencia semanal + frase motivacional, 1. Catalogo: searchbar/filtros no deben bajar en "sin resultados", 2. Catalogo: searchbar/filtros casi pegados al subtitulo (+11 more)

### Community 50 - "Crear tabla `saved_routines`"
Cohesion: 0.18
Nodes (10): Tabla profiles, Tabla saved_routines, Archivos, Crear tabla `saved_routines`, Criterios de aceptacion, Estado, Estado final, Objetivo (+2 more)

### Community 51 - "Plan: arreglos responsive mobile"
Cohesion: 0.10
Nodes (19): 1. Home — `app/page.tsx`, 1a. Reordenar grid + quitar Hidratación (`app/page.tsx:166-210`), 1b. Comidas de hoy full ancho, 2. Cuerpo más grande/detallado — `app/components/shared/BodyMuscleFigure.tsx`, 3. Calendarios sin scroll (media card) — `TrainingCalendarCard.tsx` + `NutritionCalendarCard.tsx`, 3b. Calendario de nutrición — celda HOY desmarcada si no se cargó nada, 4. Card principal del día — `app/dashboard/rutinas/dia/DayWorkoutClient.tsx:280-327`, 5. Dashboard (+11 more)

### Community 52 - "Routing Graph"
Cohesion: 0.33
Nodes (4): File Ownership, Routing Graph, G1-architecture group, Specs README index

### Community 53 - "components.json"
Cohesion: 0.12
Nodes (15): aliases, components, lib, ui, utils, rsc, $schema, style (+7 more)

### Community 54 - "1. Diagnóstico — diferencias actuales vs referencia"
Cohesion: 0.10
Nodes (19): 1. Diagnóstico — diferencias actuales vs referencia, 2. Plan de corrección por bloque, 3. Archivos / componentes a modificar, 3 cards resumen — Entrenamiento / Nutrición / Constancia (`SummaryStatCard` 500–543), 4. Riesgos / limitaciones, 5. Validación con Playwright (playwright-cli / MCP), Bloque A — Hero, Bloque B — 3 cards resumen (+11 more)

### Community 55 - "Fase 1 — Patrones reutilizables por tipo de página"
Cohesion: 0.11
Nodes (17): A. Dashboard / pantallas de resumen (`app/dashboard/page.tsx`), Archivos a tocar (representativos), B. Formularios largos de configuración (`app/configuracion/ConfiguracionClient.tsx`), C. Captura de datos densa (`app/nutricion/registro/RegistroClient.tsx`), Context, D. Tablas de admin (`app/admin/ejercicios`, `/rutinas`, `/alimentos`, `/recetas`), E. Grids de catálogo público (`app/catalogo`, `/catalogo/rutinas`, `/alimentos`, `/recetas`), F. Detalle de rutina semanal (`app/catalogo/rutinas/[id]`) (+9 more)

### Community 56 - "Cambios por página"
Cohesion: 0.11
Nodes (17): /admin — `app/admin/page.tsx`, /admin/ejercicios — `app/admin/ejercicios/ExerciseAdminClient.tsx`, /admin/rutinas — `app/admin/rutinas/RoutineAdminClient.tsx`, `app/components/shared/FilterSheet.tsx`, Cambios por página, /catalogo — `app/catalogo/RoutineCatalogClient.tsx`, Componente nuevo, Context (+9 more)

### Community 57 - "Documentation Roadmap"
Cohesion: 0.13
Nodes (14): 1. Arquitectura, 2. Base de datos, 3. Skills y agentes, 4. Plan maestro del MVP, Archivos por paso, Cada grupo, Documentation Roadmap, Documentos a crear (+6 more)

### Community 58 - "Trabajo por área"
Cohesion: 0.11
Nodes (17): 10. Tabla ordenable en `/admin/alimentos`, 1. Conversión proporcional gramos ↔ unidades (registro), 2. Editar cantidades de items en comida creada, 3. Rediseño `/nutricion/registro` (base: ref HTML), 4. `/nutricion` (catálogo): "1u (x g)" bajo el alimento, 5. Sidebar: reestructurar en áreas + mover logout, 6. Renombrar ruta `/nutricion` → `/alimentos`, 7. `/configuracion`: nombre, plan rediseñado, logout, borrar cuenta (+9 more)

### Community 59 - "Plan: corrección visual del dashboard principal (PWA) vs referencia"
Cohesion: 0.11
Nodes (17): 1. Diagnóstico — diferencias actuales vs referencia, 2. Plan de corrección por bloque visual, 3. Archivos / componentes a modificar, 3 cards resumen (Entrenamiento / Nutrición / Constancia), 4. Riesgos / limitaciones, 5. Validación con Playwright (MCP / playwright-cli), Bloque A — Hero (CTAs + espaciado), Bloque B — 3 cards resumen (+9 more)

### Community 60 - "Disenar pantalla mis rutinas con rutina activa: ordenar la gestion personal del usuario"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Disenar pantalla mis rutinas con rutina activa: ordenar la gestion personal del usuario, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 61 - "01-confirmar-stack-final-y-dependencias-necesarias.md"
Cohesion: 0.22
Nodes (9): app/lib/supabase/ (clientes Supabase), eslint-config-next, Next.js 16, React 19, @supabase/supabase-js, @supabase/ssr, Tailwind CSS 4, TypeScript (+1 more)

### Community 62 - "workout-sync.ts"
Cohesion: 0.13
Nodes (23): fail(), POST(), applyWorkoutSync(), exerciseKindSchema, MAX_SETS_PER_EXERCISE, SyncErrorCode, SyncItem, SyncItemResult (+15 more)

### Community 63 - "Project Foundations"
Cohesion: 0.15
Nodes (13): 1. Gestion de ejercicios por admin, 2. Gestion de rutinas por admin, 3. Restriccion por rol, 4. Consumo de rutinas por usuario, 5. Consulta de detalle de ejercicio, Alcance funcional inicial, Entidades conceptuales del dominio, Fuera de alcance por ahora (+5 more)

### Community 64 - "Skills And Agents"
Cohesion: 0.14
Nodes (14): Decision actual, Fuente de verdad, Lo que hoy no justifica una skill propia del repo, Next.js, Objetivo, Regla para auth y seguridad, Skills And Agents, Skills disponibles pero no elegidas por defecto (+6 more)

### Community 65 - "Capas minimas del sistema"
Cohesion: 0.15
Nodes (13): 1. UI y vistas, 2. Componentes compartidos, 3. Logica de aplicacion, 4. Validacion, 5. Persistencia y acceso a datos, Capas minimas del sistema, Escritura, Fronteras de lectura y escritura (+5 more)

### Community 66 - "Crear estructura de carpetas pactada: materializar la organizacion tecnica definida"
Cohesion: 0.12
Nodes (16): app/components/ui/ (primitivas), app/globals.css, app/layout.tsx, app/page.tsx, docs/ARCHITECTURE.md, Estructura app/ (admin, auth, catalogo, dashboard, components, data, lib, validations), G4.5 (refinamiento visual y vistas), Archivos (+8 more)

### Community 67 - "Cambios (todos en `app/page.tsx` salvo E)"
Cohesion: 0.12
Nodes (16): A. Disciplina de acento / CTAs (defectos 1 y 2), Archivos a modificar, B. KPI strip: ocultar en mobile (defectos 7 y 9), C. Nutrición: empty-state compacto (defecto 8), Cambios (todos en `app/page.tsx` salvo E), Context, D. Truncados en reposo (defecto 3), Decisiones tomadas (usuario) (+8 more)

### Community 68 - "Plan: unidades de alimentos, comidas con nombre, figura grasa, layout /configuración"
Cohesion: 0.12
Nodes (16): `app/lib/meal-logs.ts` (reescritura del modelo), `app/nutricion/registro/actions.ts`, `app/nutricion/registro/page.tsx`, `app/nutricion/registro/RegistroClient.tsx` (reescritura UI), Archivos, Archivos a tocar (resumen), Context, Migración (nueva, vía `apply_migration`) (+8 more)

### Community 69 - "Working Agreements"
Cohesion: 0.15
Nodes (12): Acuerdos sobre documentacion, Criterios para arquitectura, Criterios para base de datos, Criterios para el plan de ejecucion, Criterios para skills y agentes, Objetivo de este documento, Orden de definicion previsto, Regla de simplicidad (+4 more)

### Community 70 - "Cambios visuales (mobile, dentro del bloque `lg:hidden` y la card de plan)"
Cohesion: 0.12
Nodes (16): A. Header mobile (nuevo, encima del Accordion, `lg:hidden`), Animaciones (Framer Motion, reusando `motion.tsx`), Archivo principal, B. Mini-card "Plan actual" (nueva, encima de las secciones, `lg:hidden`), C. Headers de Accordion con resumen + check, Cambios visuales (mobile, dentro del bloque `lg:hidden` y la card de plan), Context, D. Sección grasa corporal — compactar (+8 more)

### Community 71 - "Plan: Rediseño responsive mobile (GymControl)"
Cohesion: 0.12
Nodes (16): 10. `/admin/recetas` nombre+icono centrado, 11. Categoría de recetas: macro → meal-type, 1. Quitar header (top bar) en mobile, 2. Home (`app/page.tsx`), 3. `/dashboard/rutinas` (`app/dashboard/rutinas/page.tsx` + `WeekDaysList.tsx`), 4. Filtros (patrón global, reemplazar dropdowns), 5. `/catalogo` (`app/catalogo/RoutineCatalogClient.tsx`), 6. `/dashboard` (`app/dashboard/DashboardRoutinesClient.tsx`) (+8 more)

### Community 72 - "Plan — Pulido visual: nutrición/registro, configuración, admin/alimentos"
Cohesion: 0.12
Nodes (16): 1a. Igualar altura "Nueva comida" ↔ "Resumen", 1b. `FoodPickerRow` — campos siempre visibles (`app/nutricion/registro/RegistroClient.tsx`, comp. local ~L633), 1c. Card de alimento (draft) siempre presente como estado vacío, 1d. Rediseño card "Resumen nutricional del día" (L258-332), 1e. "Comidas de hoy" como card contenedora, 1f. Rediseño `MealCard` (comp. local ~L379), 1g. Zona inferior: Constancia + card extra (2 columnas), Archivos a modificar (+8 more)

### Community 73 - "exercises.ts"
Cohesion: 0.16
Nodes (16): deleteExerciseAction(), saveExerciseAction(), ExerciseAdminClient(), confirmDelete(), AdminExercisesPage(), AdminExerciseListItem, createExercise(), CreateExerciseInput (+8 more)

### Community 74 - "Disenar entradas para gestion de ejercicios y rutinas: preparar el punto de partida administrativo real"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Disenar entradas para gestion de ejercicios y rutinas: preparar el punto de partida administrativo real, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 75 - "Documentar bootstrap admin verificable: asegurar una cuenta admin util para QA del MVP"
Cohesion: 0.18
Nodes (10): Archivos, Criterios de aceptacion, Documentar bootstrap admin verificable: asegurar una cuenta admin util para QA del MVP, Estado, Estado final, Objetivo, Pasos, Resolucion (+2 more)

### Community 76 - "Proteger admin dashboard para rol admin: restringir la entrada a la zona administrativa"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Proteger admin dashboard para rol admin: restringir la entrada a la zona administrativa, Resolucion (+1 more)

### Community 77 - "Cambios por área"
Cohesion: 0.12
Nodes (15): 1. DB: agregar steps/tips a `exercises`, 2. Login — `/auth/login` (restyle, mantener OTP), 3. Centrado de headers en tablas admin, 4. Detalle de ejercicio — drawer con 3 tabs, 5. Form crear/editar ejercicio — restyle, 6. Form crear/editar rutina — restyle, 7. `/dashboard/rutinas/dia` — click detalle + campos por serie, Archivos críticos (+7 more)

### Community 78 - "Tareas"
Cohesion: 0.12
Nodes (15): 1. Tooltip del calendario sigue al mouse — `app/components/shared/TrainingCalendarCard.tsx`, 2. Espacio texto rutina activa — `app/page.tsx`, 3. Racha semanal por días con reset semanal — `app/lib/workout-tracking.ts` (+ `app/page.tsx`), 4. Login idéntico a `desing-refs/Login.html` — `app/auth/login/page.tsx` + `OtpLoginFlow.tsx`, 5. Alinear tablas admin (excepto Acciones) — `app/admin/ejercicios/ExerciseAdminClient.tsx` y `app/admin/rutinas/RoutineAdminClient.tsx`, 6. Rediseño modal detalle ejercicio — `app/components/shared/ExerciseDetailModal.tsx`, 7. Rediseño form crear/editar ejercicio — `app/admin/ejercicios/ExerciseAdminClient.tsx` (`ExerciseFormSheet`, ~566-949), 8. Reps/peso por serie — migración + `dia` (+7 more)

### Community 79 - "Plan: corrección visual dashboard principal (PWA) → fidelidad a referencia"
Cohesion: 0.12
Nodes (15): 1. Diagnóstico — diferencias actuales vs referencia, 2. Plan de corrección por bloques visuales, 3. Archivos / componentes a modificar, 4. Riesgos / limitaciones, 5. Validación con Playwright (MCP), Bloque A — Hero: más aire vertical, Bloque B — Carga muscular: despegar barra del dibujo (mismo alto de card), Bloque C — Nutrición: texto del anillo en 3 líneas, blanco apagado (+7 more)

### Community 80 - "Prompt Templates"
Cohesion: 0.12
Nodes (15): Auditar feature, Bug desconocido con debugger, Context optimization, Debug deploy / env, Deploy o env, Diagnosticar bug, Patch minimo, Pedir plan antes de editar (+7 more)

### Community 81 - "Plan: corrección fidelidad visual Dashboard principal (PWA)"
Cohesion: 0.13
Nodes (14): 1. Diagnóstico (actual vs referencia), 2. Plan de corrección por bloques, 3. Archivos / componentes a modificar, 4. Riesgos / limitaciones, 5. Validación con Playwright (MCP / playwright-cli), Bloque A — Hero (más aire vertical), Bloque B — Carga muscular (quitar espacio barra↔cuerpos → card más baja), Bloque C — Nutrición de hoy (igualar altura a Carga muscular achicando el círculo) (+6 more)

### Community 82 - "Definir navegacion base para usuario y admin: ordenar el acceso principal del producto"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Definir navegacion base para usuario y admin: ordenar el acceso principal del producto, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 83 - "Decisiones confirmadas (previews aprobadas)"
Cohesion: 0.13
Nodes (14): `/admin` — `app/admin/page.tsx`, `/admin/rutinas` — `RoutineAdminClient.tsx`, Archivos a modificar, `/catalogo/rutinas/[id]` — `page.tsx` + `RoutineDetailClient.tsx`, Context, `/dashboard` — `app/dashboard/page.tsx`, `/dashboard/rutinas` — `app/dashboard/rutinas/page.tsx` + `WeekDaysList.tsx`, Decisiones confirmadas (previews aprobadas) (+6 more)

### Community 84 - "Corrección visual — Dashboard principal (PWA) — Ronda 2"
Cohesion: 0.13
Nodes (14): 1. Hero (compacto + imagen fija), 2. Tres cards de resumen (más color y jerarquía), 3. Nutrición de hoy + Carga muscular en una fila, 4. Comidas de hoy (empty state fiel), 5. Constancia semanal / Registro nutricional (heatmap con contexto), Archivos a modificar, Context, Corrección visual — Dashboard principal (PWA) — Ronda 2 (+6 more)

### Community 85 - "CLAUDE.md (Gymcontrol)"
Cohesion: 0.15
Nodes (12): Admin account, CLAUDE.md (Gymcontrol), Codex context layer maintenance, Context router, Formato de salida, Frontend, Fuentes de verdad, Global agent rules (+4 more)

### Community 86 - "Plan — Mejorar pantalla de ejecución del día (`/rutinas/dia`)"
Cohesion: 0.13
Nodes (14): 1) Copys (acentos), 2) Header + resumen superior (más útil y accionable), 3) Lista de ejercicios (card cerrada con más contexto + activo destacado), 4) Registro de series (más cálido, estado por serie derivado), 5) Timer de descanso (client-only, sin DB), 6) Espacio mobile / bottom nav, 7) Animaciones (Framer Motion — reusar patrones existentes), Archivos a tocar (+6 more)

### Community 87 - "10-aplicar-migracion-en-supabase-y-verificar-esquema-real.md"
Cohesion: 0.32
Nodes (7): docs/DATABASE.md (esquema G2), Esquema G2: 6 tablas (profiles, exercises, routine_templates, routine_days, routine_items, saved_routines), docs/MCP_SUPABASE_SETUP.md, PLAN.md, docs/PROJECT_FOUNDATIONS.md, alias supabase_gymcontrol (MCP), supabase/migrations/

### Community 88 - "app/page.tsx"
Cohesion: 0.10
Nodes (32): formatDayTitle(), HEIGHT_BY_STATE, HeroDay, TodayHero(), buildMealRows(), formatMuscleGroup(), getSessionProgress(), HeroState (+24 more)

### Community 89 - "Disenar e implementar componente base de modal: crear la pieza reutilizable del detalle de ejercicio"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Disenar e implementar componente base de modal: crear la pieza reutilizable del detalle de ejercicio, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 90 - "Mostrar nombre, imagen y descripcion del ejercicio: completar el contenido minimo del emergente"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Mostrar nombre, imagen y descripcion del ejercicio: completar el contenido minimo del emergente, Objetivo, Pasos, Resolucion (+1 more)

### Community 91 - "Permitir apertura y cierre sin abandonar la pagina: conservar el contexto de la vista actual"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir apertura y cierre sin abandonar la pagina: conservar el contexto de la vista actual, Resolucion (+1 more)

### Community 92 - "Integrar el modal en catalogo de rutinas: llevar el detalle de ejercicio al flujo de exploracion"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Integrar el modal en catalogo de rutinas: llevar el detalle de ejercicio al flujo de exploracion, Objetivo, Pasos, Resolucion (+1 more)

### Community 93 - "Integrar el modal en dashboard de usuario: reutilizar el detalle emergente en la experiencia autenticada"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Integrar el modal en dashboard de usuario: reutilizar el detalle emergente en la experiencia autenticada, Objetivo, Pasos, Resolucion (+1 more)

### Community 94 - "Integrar el modal en otras vistas del MVP que muestren ejercicios: cerrar la cobertura transversal del componente"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Integrar el modal en otras vistas del MVP que muestren ejercicios: cerrar la cobertura transversal del componente, Objetivo, Pasos, Resolucion (+1 more)

### Community 95 - "Asegurar comportamiento claro en desktop y mobile: adaptar el modal a los contextos principales de uso"
Cohesion: 0.20
Nodes (9): Archivos, Asegurar comportamiento claro en desktop y mobile: adaptar el modal a los contextos principales de uso, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 96 - "Revisar accesibilidad minima de foco, cierre y lectura: cerrar la calidad base del modal"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Revisar accesibilidad minima de foco, cierre y lectura: cerrar la calidad base del modal (+1 more)

### Community 97 - "Probar flujo admin de creacion de ejercicios: validar la base del recurso ejercicio de punta a punta"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Probar flujo admin de creacion de ejercicios: validar la base del recurso ejercicio de punta a punta, Resolucion (+1 more)

### Community 98 - "Probar flujo admin de creacion de rutinas semanales: validar la estructura completa de la rutina"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Probar flujo admin de creacion de rutinas semanales: validar la estructura completa de la rutina, Resolucion (+1 more)

### Community 99 - "Probar flujo usuario de exploracion, guardado y renombrado: validar la experiencia principal del usuario"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Probar flujo usuario de exploracion, guardado y renombrado: validar la experiencia principal del usuario, Resolucion (+1 more)

### Community 100 - "Probar apertura del modal de ejercicio desde multiples contextos: validar consistencia transversal"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Probar apertura del modal de ejercicio desde multiples contextos: validar consistencia transversal, Resolucion (+1 more)

### Community 101 - "Revisar validaciones, mensajes de error y estados vacios: cerrar la robustez minima de la UX"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Revisar validaciones, mensajes de error y estados vacios: cerrar la robustez minima de la UX (+1 more)

### Community 102 - "Revisar permisos para evitar acciones admin desde no admin: validar la seguridad funcional del MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Revisar permisos para evitar acciones admin desde no admin: validar la seguridad funcional del MVP (+1 more)

### Community 103 - "Revisar consistencia visual minima entre vistas: unificar la experiencia del MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Revisar consistencia visual minima entre vistas: unificar la experiencia del MVP (+1 more)

### Community 104 - "Resolver bugs detectados en pruebas finales: cerrar problemas funcionales antes del cierre del MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Resolver bugs detectados en pruebas finales: cerrar problemas funcionales antes del cierre del MVP (+1 more)

### Community 105 - "createSupabaseServerClient"
Cohesion: 0.14
Nodes (18): AdminPage(), ACTIVITY_ICONS, formatActivityDate(), RecentActivityEntry, RecentActivityTable(), startOfDay(), POST(), redirectToLogin() (+10 more)

### Community 106 - "Ejecutar validacion tecnica final del MVP: confirmar que la base esta lista para cierre"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Ejecutar validacion tecnica final del MVP: confirmar que la base esta lista para cierre, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 107 - "Actualizar README y documentos principales: alinear la documentacion con el estado real del MVP"
Cohesion: 0.20
Nodes (9): Actualizar README y documentos principales: alinear la documentacion con el estado real del MVP, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 108 - "Registrar decisiones finales y desvios del plan: dejar trazabilidad del recorrido del MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Registrar decisiones finales y desvios del plan: dejar trazabilidad del recorrido del MVP, Resolucion (+1 more)

### Community 109 - "Confirmar que el MVP cumple el alcance funcional pactado: validar la entrega contra el objetivo original"
Cohesion: 0.20
Nodes (9): Archivos, Confirmar que el MVP cumple el alcance funcional pactado: validar la entrega contra el objetivo original, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 110 - "Confirmar pendientes post-MVP: separar claramente el cierre del backlog futuro"
Cohesion: 0.20
Nodes (9): Archivos, Confirmar pendientes post-MVP: separar claramente el cierre del backlog futuro, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 111 - "Dejar listo el backlog de la siguiente iteracion: preparar el siguiente ciclo sin mezclarlo con el cierre"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Dejar listo el backlog de la siguiente iteracion: preparar el siguiente ciclo sin mezclarlo con el cierre, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 112 - "Definir el contrato de auth dual para GymControl: fijar el nuevo modelo de acceso del proyecto"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir el contrato de auth dual para GymControl: fijar el nuevo modelo de acceso del proyecto, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 113 - "Documentar la brecha entre magic link actual y auth dual objetivo: dejar claro que cambia y que se conserva"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar la brecha entre magic link actual y auth dual objetivo: dejar claro que cambia y que se conserva, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 114 - "Definir el flujo OTP por email de 6 digitos: cerrar la experiencia passwordless principal"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir el flujo OTP por email de 6 digitos: cerrar la experiencia passwordless principal, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 115 - "Definir el flujo alternativo de Google OAuth: agregar un segundo acceso sin romper la estrategia principal"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir el flujo alternativo de Google OAuth: agregar un segundo acceso sin romper la estrategia principal, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 116 - "Definir como convergen sesion y perfil entre OTP y Google: evitar dos modelos de usuario dentro de GymControl"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir como convergen sesion y perfil entre OTP y Google: evitar dos modelos de usuario dentro de GymControl, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 117 - "Definir redirecciones y reglas de acceso segun rol: mantener una navegacion segura durante la transicion auth"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir redirecciones y reglas de acceso segun rol: mantener una navegacion segura durante la transicion auth, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 118 - "Disenar la nueva pantalla de auth dual: unificar OTP y Google en una sola entrada de acceso"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Disenar la nueva pantalla de auth dual: unificar OTP y Google en una sola entrada de acceso, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 120 - "Plan: Arreglar login OTP 6 digitos + desbloquear validacion responsive"
Cohesion: 0.14
Nodes (13): A1. Email OTP Length = 6, A2. Email OTP Expiration, A3. Template del email (Magic Link template → emitir codigo), A4. (Verificar, no necesariamente cambiar), Context, Entregable final, Parte A — Config Supabase (la aplica el usuario, fuera del repo), Parte B — Codigo (repo) (+5 more)

### Community 121 - "Fase 5 — Micro-interacciones · Dashboard principal"
Cohesion: 0.14
Nodes (13): A1. `.pressable` utility — `app/globals.css` (`@layer components`), A2. `MotionConfig` global — nuevo `app/components/ui/MotionProvider.tsx` + `app/layout.tsx`, Context, Decisiones, Fase 5 — Micro-interacciones · Dashboard principal, No se toca, Parte A — Foundation (global, alta palanca), Parte B — Reubicar press al target real (`app/page.tsx`) (+5 more)

### Community 122 - "Implementar requestOtp mediante endpoint protegido: desacoplar la solicitud de codigo del magic link actual"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar requestOtp mediante endpoint protegido: desacoplar la solicitud de codigo del magic link actual, Objetivo, Pasos, Resolucion (+1 more)

### Community 123 - "Agregar rate limit minimo para solicitud de OTP: reducir abuso basico del endpoint de acceso"
Cohesion: 0.20
Nodes (9): Agregar rate limit minimo para solicitud de OTP: reducir abuso basico del endpoint de acceso, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 124 - "Implementar verificacion de OTP y creacion de sesion: cerrar el acceso passwordless dentro de la app"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar verificacion de OTP y creacion de sesion: cerrar el acceso passwordless dentro de la app, Objetivo, Pasos, Resolucion (+1 more)

### Community 125 - "Plan: Fixes de front en /configuracion, /nutricion/registro y /admin/alimentos"
Cohesion: 0.14
Nodes (13): 1. Configuracion — `app/configuracion/ConfiguracionClient.tsx:263-289`, 2. Nutricion registro — `app/nutricion/registro/RegistroClient.tsx`, 3. Admin alimentos — `app/admin/alimentos/FoodAdminClient.tsx` + `app/components/ui/Table.tsx`, Approach, Archivos a modificar, Context, Diagnóstico técnico (ya investigado), Fix 1 — Configuracion: compactar card de mantenimiento (+5 more)

### Community 126 - "Adaptar el callback auth para Google OAuth y retirar dependencia del callback en OTP: separar correctamente ambos flujos"
Cohesion: 0.20
Nodes (9): Adaptar el callback auth para Google OAuth y retirar dependencia del callback en OTP: separar correctamente ambos flujos, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 127 - "Confirmar si el trigger actual de profiles alcanza sin capa extra de sync: reutilizar el modelo de usuario actual antes de agregar complejidad"
Cohesion: 0.20
Nodes (9): Archivos, Confirmar si el trigger actual de profiles alcanza sin capa extra de sync: reutilizar el modelo de usuario actual antes de agregar complejidad, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 128 - "Refactorizar la capa auth y guards sin romper roles: mantener un unico punto de verdad para acceso y autorizacion"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Refactorizar la capa auth y guards sin romper roles: mantener un unico punto de verdad para acceso y autorizacion, Resolucion (+1 more)

### Community 129 - "Retirar el flujo principal de magic link: limpiar el acceso antiguo sin romper compatibilidad necesaria"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Retirar el flujo principal de magic link: limpiar el acceso antiguo sin romper compatibilidad necesaria (+1 more)

### Community 130 - "Plan — Responsive mobile fixes (Home, Nutrición/Registro, Admin)"
Cohesion: 0.14
Nodes (13): 1. Home — `app/page.tsx` + `app/components/shared/BodyMuscleFigure.tsx`, 1a. Sacar cards, misma distribución, 1b. Centrar calendarios, 1c. Reconstruir `BodyMuscleFigure.tsx` (hand-craft SVG detallado), 2. Nutrición/Registro — `app/nutricion/registro/RegistroClient.tsx`, 2a. Sacar cards, mismo orden, 2b. Constancia: sacar solo "Este mes", 2c. "Vas en camino" en 1-2 líneas (+5 more)

### Community 131 - "Cambios"
Cohesion: 0.14
Nodes (13): 1. Helper de URL por nombre — `app/lib/exercise-image.ts` (nuevo), 2. Derivar `imageUrl` del nombre — `app/lib/exercises.ts`, 3. Hero del modal con imagen + fallback — `app/components/shared/ExerciseDetailModal.tsx`, 4. Fallback en cards del catálogo (graceful), 5. Borrar filas de test — Supabase (`execute_sql`), 6. Limpiar imágenes obsoletas del bucket (one-off), Archivos, Cambios (+5 more)

### Community 132 - "Documentar configuracion externa de Supabase para OTP por codigo: dejar operativa la parte fuera del repo"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar configuracion externa de Supabase para OTP por codigo: dejar operativa la parte fuera del repo, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 133 - "Documentar configuracion externa de Google OAuth: preparar el proveedor alternativo fuera del repo"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar configuracion externa de Google OAuth: preparar el proveedor alternativo fuera del repo, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 134 - "Cambios por sección"
Cohesion: 0.14
Nodes (13): 0. Helper nuevo: `AnimatedNumber` (motion.tsx), 1. Card de calorías (RegistroClient.tsx:358-394), 2. Macros (RegistroClient.tsx:396-434), 3. Comidas de hoy (RegistroClient.tsx:436-470), 4. Constancia (RegistroClient.tsx:472-495), 5. Frase motivadora (RegistroClient.tsx:497-503), 6. Animaciones (Framer Motion), Archivos a modificar (+5 more)

### Community 135 - "Plan — Rediseño mobile `/dashboard/rutinas` como dashboard semanal"
Cohesion: 0.14
Nodes (13): Animaciones (Framer Motion), Archivos a tocar, Cambios visuales (preview ASCII), Context, Datos derivados (en `page.tsx`, ya casi todos existen), Empty states, Plan — Rediseño mobile `/dashboard/rutinas` como dashboard semanal, Riesgos (+5 more)

### Community 136 - "Plan: Responsive audit + fixes (desktop / tablet / mobile)"
Cohesion: 0.14
Nodes (13): 1. Tablas → responsive (prioridad alta), 2. Grids sin fallback mobile (pulir), 3. Cards de catálogo y tarjetas (pulir), 4. Touch-targets, Archivos a modificar, Context, Entregable final al usuario, Estrategia (+5 more)

### Community 137 - "Revalidar compatibilidad con profiles, bootstrap admin y RLS: confirmar que la transicion auth no rompa el modelo del MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Revalidar compatibilidad con profiles, bootstrap admin y RLS: confirmar que la transicion auth no rompa el modelo del MVP (+1 more)

### Community 138 - "Cambios propuestos"
Cohesion: 0.14
Nodes (13): Archivos a modificar (resumen), Cambios propuestos, Causas confirmadas (file:line), Context, Fase 1 — Cache de queries (mayor ganancia, bajo riesgo), Fase 2 — Proxy de imágenes a Supabase, Fase 3 — next/image en el modal, Fase 4 — Service Worker cachea imágenes de Supabase (+5 more)

### Community 139 - "Guardar arquitectura pactada: consolidar la definicion final en docs/ARCHITECTURE.md"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Guardar arquitectura pactada: consolidar la definicion final en docs/ARCHITECTURE.md, Objetivo, Pasos, Resolucion (+1 more)

### Community 140 - "Crear formulario para alta de ejercicio: permitir la carga administrativa del recurso"
Cohesion: 0.20
Nodes (9): Archivos, Crear formulario para alta de ejercicio: permitir la carga administrativa del recurso, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 141 - "Crear edicion basica de ejercicio si aplica: habilitar ajuste minimo del recurso en el MVP"
Cohesion: 0.20
Nodes (9): Archivos, Crear edicion basica de ejercicio si aplica: habilitar ajuste minimo del recurso en el MVP, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 142 - "Exponer datos de ejercicio para consumo transversal: habilitar reutilizacion en catalogo, rutinas y modal"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Exponer datos de ejercicio para consumo transversal: habilitar reutilizacion en catalogo, rutinas y modal, Objetivo, Pasos, Resolucion (+1 more)

### Community 143 - "Verificar persistencia y recuperacion correcta: asegurar consistencia del recurso ejercicio"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Validacion (+1 more)

### Community 144 - "Implementar persistencia de rutina plantilla: crear acceso a datos sobre `routine_templates`"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar persistencia de rutina plantilla: crear acceso a datos sobre `routine_templates`, Objetivo, Pasos, Resolucion (+1 more)

### Community 145 - "Implementar persistencia de dias de rutina semanal: modelar la subdivision por dias"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar persistencia de dias de rutina semanal: modelar la subdivision por dias, Objetivo, Pasos, Resolucion (+1 more)

### Community 146 - "Implementar persistencia de filas de ejercicio: guardar ejercicio, series, repeticiones, RIR y descanso"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar persistencia de filas de ejercicio: guardar ejercicio, series, repeticiones, RIR y descanso, Objetivo, Pasos, Resolucion (+1 more)

### Community 147 - "Crear listado de rutinas en admin dashboard: exponer las rutinas administradas"
Cohesion: 0.20
Nodes (9): Archivos, Crear listado de rutinas en admin dashboard: exponer las rutinas administradas, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 148 - "Crear builder o formulario de rutina semanal: permitir al admin construir la rutina base"
Cohesion: 0.20
Nodes (9): Archivos, Crear builder o formulario de rutina semanal: permitir al admin construir la rutina base, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 149 - "Permitir agregar multiples dias a una rutina: materializar la naturaleza semanal del recurso"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir agregar multiples dias a una rutina: materializar la naturaleza semanal del recurso, Resolucion (+1 more)

### Community 150 - "Permitir agregar multiples filas de ejercicios por dia: completar la tabla funcional de cada jornada"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir agregar multiples filas de ejercicios por dia: completar la tabla funcional de cada jornada, Resolucion (+1 more)

### Community 151 - "Validar recuperacion de rutina con estructura completa: asegurar lectura coherente de la rutina semanal"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Validacion (+1 more)

### Community 152 - "Verificar consistencia de referencias a ejercicios: asegurar integridad entre rutinas y catalogo de ejercicios"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Validacion (+1 more)

### Community 153 - "Crear vista catalogo de rutinas disponibles: exponer las rutinas para exploracion del usuario"
Cohesion: 0.20
Nodes (9): Archivos, Crear vista catalogo de rutinas disponibles: exponer las rutinas para exploracion del usuario, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 154 - "Mostrar informacion minima util de cada rutina: facilitar la eleccion desde el catalogo"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Mostrar informacion minima util de cada rutina: facilitar la eleccion desde el catalogo, Objetivo, Pasos, Resolucion (+1 more)

### Community 155 - "Permitir entrar al detalle de una rutina: ampliar la consulta sin perder claridad de navegacion"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir entrar al detalle de una rutina: ampliar la consulta sin perder claridad de navegacion, Resolucion (+1 more)

### Community 156 - "Mostrar estructura semanal de la rutina elegida: presentar dias y filas de forma entendible"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Mostrar estructura semanal de la rutina elegida: presentar dias y filas de forma entendible, Objetivo, Pasos, Resolucion (+1 more)

### Community 157 - "Hacer clickeables los ejercicios para su detalle: conectar el catalogo con el modal de ejercicio"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Hacer clickeables los ejercicios para su detalle: conectar el catalogo con el modal de ejercicio, Objetivo, Pasos, Resolucion (+1 more)

### Community 158 - "Preparar punto de accion para guardar rutina: conectar el catalogo con el dashboard del usuario"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Preparar punto de accion para guardar rutina: conectar el catalogo con el dashboard del usuario, Resolucion (+1 more)

### Community 159 - "Implementar accion para guardar rutina en cuenta: conectar el catalogo con la cuenta del usuario"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar accion para guardar rutina en cuenta: conectar el catalogo con la cuenta del usuario, Objetivo, Pasos, Resolucion (+1 more)

### Community 160 - "Permitir que el usuario tenga mas de una rutina guardada: soportar multiples elecciones del catalogo"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir que el usuario tenga mas de una rutina guardada: soportar multiples elecciones del catalogo, Resolucion (+1 more)

### Community 161 - "Definir representacion entre rutina plantilla y rutina guardada: cerrar la logica del recurso del usuario"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir representacion entre rutina plantilla y rutina guardada: cerrar la logica del recurso del usuario, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 162 - "Permitir asignar nombre propio a cada rutina guardada: habilitar personalizacion basica del usuario"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir asignar nombre propio a cada rutina guardada: habilitar personalizacion basica del usuario, Resolucion (+1 more)

### Community 163 - "Permitir editar nombre desde el dashboard: completar la personalizacion de rutinas guardadas"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir editar nombre desde el dashboard: completar la personalizacion de rutinas guardadas, Resolucion (+1 more)

### Community 164 - "Crear dashboard de usuario con listado de rutinas guardadas: materializar la vista principal del usuario autenticado"
Cohesion: 0.20
Nodes (9): Archivos, Crear dashboard de usuario con listado de rutinas guardadas: materializar la vista principal del usuario autenticado, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 165 - "Permitir ver detalle de cada rutina guardada: llevar la consulta del usuario mas alla del listado"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Permitir ver detalle de cada rutina guardada: llevar la consulta del usuario mas alla del listado, Resolucion (+1 more)

### Community 166 - "Mantener acceso al modal de detalle de ejercicio: reutilizar la experiencia de ayuda dentro del dashboard"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Mantener acceso al modal de detalle de ejercicio: reutilizar la experiencia de ayuda dentro del dashboard, Objetivo, Pasos, Resolucion (+1 more)

### Community 167 - "Estructura de carpetas"
Cohesion: 0.14
Nodes (13): Archivos de componentes, Archivos de pagina o vista, Archivos de utilidad o logica, Carpetas, Convenciones de nombres, Estructura base recomendada, Estructura de carpetas, Regla de orden (+5 more)

### Community 168 - "Estrategia de implementacion"
Cohesion: 0.14
Nodes (13): Acceso a datos y entorno, Acciones y logica de aplicacion, Base visual compartida, Cierre de arquitectura, Componentes compartidos, Criterio de simplicidad, Estrategia de implementacion, Nota (+5 more)

### Community 169 - "Navegacion base"
Cohesion: 0.18
Nodes (11): Acceso y sesion, Admin, Base visual de Admin dashboard, Diferencias utiles respecto del flujo de usuario, Estado activo, Estructura visual, Jerarquia de accesos, Limites de diseno (+3 more)

### Community 170 - "RegistroClient.tsx"
Cohesion: 0.07
Nodes (42): FoodRow(), Select(), SelectContent(), SelectItem(), SelectLabel(), SelectSeparator(), SelectTrigger(), SelectValue() (+34 more)

### Community 171 - "Plan: arreglar registro de nutrición + UX cards + centrado figura grasa + backfill porciones"
Cohesion: 0.15
Nodes (12): 1. Fix del bug de agregar alimento, 2. Rediseño de cards en `/nutricion/registro`, 3. Centrar figura de porcentaje graso en `/configuracion`, 4. Backfill de porción/unidad (grams_per_unit) realista, Card "Comidas de hoy" → solo ver / borrar / editar, Card "Nueva comida" → constructor de comida, Context, Orden de ejecución (+4 more)

### Community 172 - "Plan: arreglos visuales PWA"
Cohesion: 0.15
Nodes (12): 1. Modal detalle ejercicio — `app/components/shared/ExerciseDetailModal.tsx`, 1a. Botón "ver gif" se solapa con la X de cerrar, 1b. "Grupo muscular" ocupa 2 renglones, 1c. Badges "pecho"/"barra" se ven encerrados, 2. Rutina día — `app/catalogo/rutinas/[id]/RoutineDetailClient.tsx`, 3. Home hero recortado — `app/page.tsx`, 4. Configuración — guardado automático — `app/configuracion/ConfiguracionClient.tsx`, 5. Línea violeta en sheets de alimentos y recetas (+4 more)

### Community 173 - "Plan: Admin dashboard + Ejercicios + Rutinas (design impl) + lupita fix"
Cohesion: 0.15
Nodes (12): Context, Design tokens (mapping), Files touched (summary), Part A — DB migration (Supabase), Part B — Data layer changes, Part C — Admin Dashboard (`app/admin/page.tsx`), Part D — Admin Ejercicios (`app/admin/ejercicios/`), Part E — Admin Rutinas (`app/admin/rutinas/`) (+4 more)

### Community 174 - "Env Index"
Cohesion: 0.15
Nodes (10): Commands, Auth post-MVP, Env Index, Operativas / MCP, Runtime de la app, Skill/subagent validation, Test Matrix, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (+2 more)

### Community 175 - "Login redesign — audit-driven polish + app-native container"
Cohesion: 0.15
Nodes (12): A. Unify focus ring (coherence, +score), Approach (recommended: fixes + card container), B. Tokenize hardcoded hex (color discipline), C. Back button a11y (`OtpLoginFlow.tsx:198-210`), Context, D. Resend cooldown (states/UX), E. App-native container (layout, matches refs), Files to modify (+4 more)

### Community 176 - "Plan: Admin Dashboard en `/admin`"
Cohesion: 0.17
Nodes (11): 1. NUEVO `app/lib/admin-stats.ts`, 2. REESCRIBIR `app/admin/page.tsx`, 3. `app/globals.css` (solo si hace falta), Archivos, Cambios, Context, Decisiones (confirmadas con el usuario), Mapeo diseño → repo (+3 more)

### Community 177 - "Plan: Fix 6 PWA bugs (login, OTP, rename rutina, registro pesos, play ejercicio, config overflow)"
Cohesion: 0.17
Nodes (11): Context, Files to modify, Issue 1 — Remove "Necesitas iniciar sesion..." on first open, Issue 2 — Email sends magic link instead of 6-digit code, Issue 3 — Small edit button to rename the active routine, Issue 4 — "Error" when entering reps/weights, Issue 5 — Play button in exercise detail does nothing, Issue 6 — Config cards widen off-screen after a save/fetch (+3 more)

### Community 178 - "Plan: rediseño nutrición + ajustes UI"
Cohesion: 0.17
Nodes (11): 1.b "Agregar escondido" (scrolldown), 1. Rediseño completo `/nutricion/registro` (port fiel del ref), 2. Cards "Cerrar sesión" y "Borrar tu cuenta" más chicas/sutiles, 3. /recetas card con imagen, sin ícono de macro, 4. /configuracion: "Mantenimiento estimado" más a la derecha, 5. /admin/alimentos: searchbar tamaño fijo, Archivos a modificar, Context (+3 more)

### Community 179 - "Plan: Imágenes para body-fat, alimentos y recetas (PWA)"
Cohesion: 0.17
Nodes (11): 1. Body-fat (por género, en `public/`), 2. Pipeline de imágenes (reusar lo existente + extender), 3. UI alimentos — renderizar la imagen, Archivos a tocar, Cambios, Context, Decisión de storage (carga rápida), Fuentes de datos (verificadas) (+3 more)

### Community 180 - "Plan: corrección visual dashboard principal (PWA)"
Cohesion: 0.17
Nodes (11): 1. Diagnóstico de diferencias actuales vs referencia, 2. Plan de corrección por bloque, 3. Archivos/componentes a modificar, 4. Riesgos / limitaciones, 5. Validación con Playwright (MCP), Bloque A — `CargaMuscularCard` (centrar barra+legend), Bloque B — `ComidasHoyCard` estado vacío, Card "Carga muscular" (+3 more)

### Community 181 - "Plan — Corrección visual Dashboard principal (PWA) vs referencia"
Cohesion: 0.17
Nodes (11): 1. Hero card (`app/page.tsx` ~243-342, helper `HeroStat` 489-506), 2. Cards Entrenamiento / Nutrición / Constancia (`SummaryStatCard` 508-574), 3. Nutrición de hoy + Carga muscular (`NutricionTodayCard` 576-672, `CargaMuscularCard` 674-734), 4. Comidas de hoy vacía (`ComidasHoyCard` 736-845, bloque empty 765-798), 5. Cards inferiores: Constancia semanal / Registro nutricional, Archivos a modificar, Context, Plan — Corrección visual Dashboard principal (PWA) vs referencia (+3 more)

### Community 182 - "Mejora Home mobile (app/page.tsx)"
Cohesion: 0.17
Nodes (11): 1. Hero "Hoy toca" más protagonista, 2. Profundidad / separación entre cards, 3. Empty states accionables, 4. Card "Carga muscular" más legible, 5. Racha real en header, 6. Animaciones (Framer Motion, sutiles), Archivos a modificar, Context (+3 more)

### Community 183 - "Mejora visual de `/catalogo` (rutinas)"
Cohesion: 0.17
Nodes (11): Animaciones (framer-motion, reutilizando helpers), Archivos a tocar (solo 2), Cambios concretos, Context, Datos disponibles (modelo real, no inventar), Mejora visual de `/catalogo` (rutinas), No incluido (confirmado por el usuario), `page.tsx` (+3 more)

### Community 184 - "Dashboard principal (`/`) — Audit + Redesign plan"
Cohesion: 0.17
Nodes (11): Benchmark (referencia real capturada), Context, Dashboard principal (`/`) — Audit + Redesign plan, Decisión pendiente del usuario (asumida), Enfoque recomendado: 2 fases, FASE 1 — De-slop (tokens · legibilidad · contraste · motion), FASE 2 — Jerarquía hero-metric-led + mobile airy (opt-in), Hallazgos del audit (evidencia con file:line) (+3 more)

### Community 185 - "Mobile responsive redesign — gymcontrol"
Cohesion: 0.17
Nodes (11): 1. Home — `app/page.tsx`, 2. `/dashboard/rutinas` — `app/dashboard/rutinas/page.tsx` (+ `WeekDaysList.tsx`), 3. `/nutricion/registro` — `app/nutricion/registro/RegistroClient.tsx`, 4. Remove "Mis rutinas" from dashboard — `app/dashboard/page.tsx`, 5. `/catalogo` — shrink "Ver rutina" — `app/catalogo/RoutineCatalogClient.tsx` (~298-307), 6. `/catalogo/rutinas/[id]` — `page.tsx` + `RoutineDetailClient.tsx`, Context, Files to modify (+3 more)

### Community 186 - "Grupo "G6" - Ejercicios admin"
Cohesion: 0.50
Nodes (4): Grupo "G6" - Ejercicios admin, Subgrupo "G6.1" - Acceso a datos y validacion, Subgrupo "G6.2" - Admin UI, Subgrupo "G6.3" - Integracion y permisos

### Community 187 - "Dirección de rediseño (GymControl)"
Cohesion: 0.18
Nodes (10): 1. Pantalla de referencia: home mobile, 2. Qué se corrigió, 3. Hacia dónde vamos, 4. Apps que marcan la dirección, 5. Rechazado por el usuario, 6. Método, 7. Rutas y progreso, Checklist por ruta (+2 more)

### Community 188 - "Plan — Sidebar fit, nutrición lista, /configuración, registro rediseñado"
Cohesion: 0.18
Nodes (10): 1. Sidebar entra sin scroll, 2. /nutricion como lista, 3. /configuración (mover desde /nutricion/perfil), 4. /nutricion/registro rediseñado (agrupar por slot, sin DB), Archivos a tocar (resumen), Context, Plan — Sidebar fit, nutrición lista, /configuración, registro rediseñado, Riesgos (+2 more)

### Community 189 - "Plan — Apartado de Nutrición (alimentos, calorías, macros, dietas)"
Cohesion: 0.18
Nodes (10): Archivos críticos a crear/modificar, Context, Fase 1 — Mock (UI completa, datos estáticos, sin DB), Fase 2 — Funcional (Supabase + cálculo real), Fase 3 — Extras (sólo con OK del usuario tras ver el core), Nutrición: lógica de cálculo (fuente de verdad del feature), Patrones existentes a reusar (no reinventar), Plan — Apartado de Nutrición (alimentos, calorías, macros, dietas) (+2 more)

### Community 190 - "Fases (secuenciales, con gate de verificación)"
Cohesion: 0.18
Nodes (10): Context, Fase 1 — Resolver el audit, Fase 2 — Revisión premium, Fase 3 — Accesibilidad (WCAG 2.2 AA), Fase 4 — Micro-interacciones, Fase 5 — Verificación funcional, Fases (secuenciales, con gate de verificación), Plan — Login (OTP) refinement por fases secuenciales (+2 more)

### Community 191 - "Guardar acuerdo de minima manipulacion de la base: dejar explicita la regla de simplicidad del esquema"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Guardar acuerdo de minima manipulacion de la base: dejar explicita la regla de simplicidad del esquema, Objetivo, Pasos, Resolucion (+1 more)

### Community 192 - "Rediseño cards sin borde + headers compactos"
Cohesion: 0.18
Nodes (10): 1. Home — `app/page.tsx`, 2. Rutinas — `app/dashboard/rutinas/page.tsx` + `WeekDaysList.tsx`, 3. Registro — `app/nutricion/registro/RegistroClient.tsx` + `app/nutricion/registro/page.tsx`, Cambios por archivo, Context, Decisiones confirmadas, Rediseño cards sin borde + headers compactos, Riesgos (+2 more)

### Community 193 - "Identificar tareas recurrentes que justifican skills o agentes: separar necesidad real de conveniencia"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Identificar tareas recurrentes que justifican skills o agentes: separar necesidad real de conveniencia, Objetivo, Pasos, Resolucion (+1 more)

### Community 194 - "Plan: Hero estático + popup GIF en detalle de ejercicio"
Cohesion: 0.18
Nodes (10): 1. DB — agregar columna `gif_url`, 2. Script de backfill — frame 0 → image_url, GIF → gif_url, 3. Capa de datos — exponer `gif_url` como `gifUrl`, 4. Tipo `ExerciseDetail`, 5. Modal — hero estático + botón Play + popup Dialog, Archivos a tocar, Context, Plan: Hero estático + popup GIF en detalle de ejercicio (+2 more)

### Community 195 - "Cambios"
Cohesion: 0.20
Nodes (9): 1. Variables de entorno en Vercel (proyecto gymcontrol-lake), 2. Supabase → Auth → URL Configuration (dashboard, proyecto `ignlzahslkkfucgnekkb`), 3. Google Cloud Console → OAuth Client (solo si se usa login Google), 4. Sin cambios de código, Cambios, Context, Plan: localhost:3000 → producción (gymcontrol-lake.vercel.app), Riesgos (+1 more)

### Community 196 - "Definir cantidad minima de skills necesarias: acotar el set util del proyecto"
Cohesion: 0.17
Nodes (11): AGENTS.md, docs/codex/ (Codex routing layer), Archivos, Criterios de aceptacion, Definir cantidad minima de skills necesarias: acotar el set util del proyecto, Estado, Estado final, Objetivo (+3 more)

### Community 197 - "Plan: nutrición — imagen grasa, alimentos por unidad, baja de dietas, card de registro"
Cohesion: 0.20
Nodes (9): Context, Orden de ejecución, Plan: nutrición — imagen grasa, alimentos por unidad, baja de dietas, card de registro, Riesgos, Tarea 1 — Imagen de grasa corporal, Tarea 2 — Alimentos en gramos y unidades, Tarea 3 — Baja de dietas, Tarea 4 — Card de registro (+1 more)

### Community 198 - "Plan: arreglos de layout en /admin, /admin/ejercicios, /admin/rutinas y /catalogo"
Cohesion: 0.20
Nodes (9): Archivos a modificar, Context, Plan: arreglos de layout en /admin, /admin/ejercicios, /admin/rutinas y /catalogo, Riesgos, Tarea 1 — `/admin` cards sin espacio sobrante, Tarea 2 — `/admin/ejercicios` compactar + borrar contador, Tarea 3 — `/admin/rutinas` compactar + borrar contador, Tarea 4 — `/catalogo` centrar lupita en Y (+1 more)

### Community 199 - "Guardar definicion en SKILLS_AND_AGENTS.md: consolidar la decision final del grupo"
Cohesion: 0.17
Nodes (11): docs/SKILLS_AND_AGENTS.md, docs/WORKING_AGREEMENTS.md, Archivos, Criterios de aceptacion, Estado, Estado final, Guardar definicion en SKILLS_AND_AGENTS.md: consolidar la decision final del grupo, Objetivo (+3 more)

### Community 200 - "Definir shell principal con panel lateral izquierdo: establecer la estructura visual base del producto"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Definir shell principal con panel lateral izquierdo: establecer la estructura visual base del producto, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 201 - "map-exercisedb-demos.mjs"
Cohesion: 0.19
Nodes (16): DEFAULT_OUT, EQUIPMENT_TERMS, EXERCISE_SEARCH_TERMS, fetchExercises(), getExerciseDbApiKey(), getRequiredEnv(), includesAny(), main() (+8 more)

### Community 202 - "Definir mapa real de vistas y transiciones: dejar explicito como se recorre el frontend"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Definir mapa real de vistas y transiciones: dejar explicito como se recorre el frontend, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 203 - "Confirmar fronteras entre agregar rutinas, mis rutinas, ejercicio y admin: evitar mezclar modulos en el frontend"
Cohesion: 0.22
Nodes (9): Archivos, Confirmar fronteras entre agregar rutinas, mis rutinas, ejercicio y admin: evitar mezclar modulos en el frontend, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 204 - "Definir direccion visual general del producto: acordar la identidad frontend del MVP"
Cohesion: 0.18
Nodes (10): Direccion visual general del producto (premium minimalista), Archivos, Criterios de aceptacion, Definir direccion visual general del producto: acordar la identidad frontend del MVP, Estado, Estado final, Objetivo, Pasos (+2 more)

### Community 205 - "Definir tipografia, paleta, superficies y espaciado base: consolidar el sistema visual minimo"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Definir tipografia, paleta, superficies y espaciado base: consolidar el sistema visual minimo, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 206 - "Definir patron visual del panel lateral y area de contenido: ordenar la composicion principal del producto"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Definir patron visual del panel lateral y area de contenido: ordenar la composicion principal del producto, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 207 - "Plan — Corrección visual Dashboard principal (PWA) vs referencia"
Cohesion: 0.20
Nodes (9): 3. Card "Carga muscular" — bajar barra + texto (`app/page.tsx`, `CargaMuscularCard`, ~L707–730), 4. Card "Comidas de hoy" vacía (`app/page.tsx`, `ComidasHoyCard` empty branch, ~L773–814), Archivos a modificar, Context, Diagnóstico (actual vs referencia), Plan — Corrección visual Dashboard principal (PWA) vs referencia, Plan de corrección por bloque, Riesgos / limitaciones (+1 more)

### Community 208 - "Disenar pantalla agregar rutinas: preparar la vista de exploracion y seleccion del usuario"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Disenar pantalla agregar rutinas: preparar la vista de exploracion y seleccion del usuario, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 209 - "Validar flujos auth duales y logout: comprobar que OTP y Google funcionen de punta a punta"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Validacion (+1 more)

### Community 210 - "Disenar pantalla ejercicio con organigrama semanal: traducir la rutina activa a lectura por dias"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Disenar pantalla ejercicio con organigrama semanal: traducir la rutina activa a lectura por dias, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 211 - "workout-tracking.ts"
Cohesion: 0.10
Nodes (26): LoggedSet, resolveExerciseKind(), CountedSessionRow, ExerciseHistoryEntry, getOpenSessionForDay(), HistoryRow, isCountedSession(), isPrincipalStrengthExercise() (+18 more)

### Community 212 - "Disenar comportamiento del modal de ejercicio: resolver consulta contextual sin abandonar la rutina"
Cohesion: 0.18
Nodes (10): Comportamiento del modal de ejercicio, Archivos, Criterios de aceptacion, Disenar comportamiento del modal de ejercicio: resolver consulta contextual sin abandonar la rutina, Estado, Estado final, Objetivo, Pasos (+2 more)

### Community 213 - "Disenar base visual de admin dashboard: preparar una capa administrativa clara y consistente"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Disenar base visual de admin dashboard: preparar una capa administrativa clara y consistente, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 214 - "Ejecutar validacion tecnica de la transicion auth: cerrar chequeos minimos del cambio transversal"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Ejecutar validacion tecnica de la transicion auth: cerrar chequeos minimos del cambio transversal, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 215 - "Actualizar documentacion final y contexto del repo tras cerrar G13: dejar el nuevo login reflejado en las fuentes de verdad"
Cohesion: 0.20
Nodes (9): Actualizar documentacion final y contexto del repo tras cerrar G13: dejar el nuevo login reflejado en las fuentes de verdad, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 216 - "validate-mobile.mjs"
Cohesion: 0.33
Nodes (9): authenticate(), DEFAULT_VIEWPORT, ensureServer(), generateOtp(), main(), readLocalEnv(), ROUTES, validateRoute() (+1 more)

### Community 217 - "Delimitar alcance final del MVP: confirmar que entra en la primera version y que queda fuera"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Delimitar alcance final del MVP: confirmar que entra en la primera version y que queda fuera, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 218 - "Definir modulos principales del producto: establecer las secciones base de la aplicacion"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir modulos principales del producto: establecer las secciones base de la aplicacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 219 - "Definir responsabilidades y fronteras: separar UI, logica y persistencia sin sobreingenieria"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir responsabilidades y fronteras: separar UI, logica y persistencia sin sobreingenieria, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 220 - "Configurar estilos base y UI compartida: preparar la capa visual minima reutilizable"
Cohesion: 0.22
Nodes (9): Archivos, Configurar estilos base y UI compartida: preparar la capa visual minima reutilizable, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 221 - "Configurar acceso a base de datos y entorno: preparar la conexion tecnica del proyecto"
Cohesion: 0.17
Nodes (11): .env.example, G5 (auth, proteccion de rutas), Archivos, Configurar acceso a base de datos y entorno: preparar la conexion tecnica del proyecto, Criterios de aceptacion, Estado, Estado final, Objetivo (+3 more)

### Community 222 - "Crear layout base y navegacion inicial: dejar una estructura navegable minima del producto"
Cohesion: 0.22
Nodes (9): Archivos, Crear layout base y navegacion inicial: dejar una estructura navegable minima del producto, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 223 - "Documentar flujo admin para crear ejercicios: describir el recorrido funcional de alta y persistencia"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar flujo admin para crear ejercicios: describir el recorrido funcional de alta y persistencia, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 224 - "Definir estrategia minima de RLS y helper de admin: fijar reglas base antes de escribir policies"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Definir estrategia minima de RLS y helper de admin: fijar reglas base antes de escribir policies, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 225 - "Documentar flujo admin para crear rutinas semanales: describir dias, filas y estructura de trabajo"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar flujo admin para crear rutinas semanales: describir dias, filas y estructura de trabajo, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 226 - "Documentar flujo usuario para explorar, elegir, guardar y renombrar rutinas: describir el recorrido principal del usuario"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar flujo usuario para explorar, elegir, guardar y renombrar rutinas: describir el recorrido principal del usuario, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 227 - "Documentar flujo de apertura del detalle emergente de ejercicio: definir la interaccion sin abandonar la pagina"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar flujo de apertura del detalle emergente de ejercicio: definir la interaccion sin abandonar la pagina, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 228 - "Definir estructura de carpetas y convenciones de nombres: ordenar el repositorio antes de implementar"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir estructura de carpetas y convenciones de nombres: ordenar el repositorio antes de implementar, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 229 - "Definir estrategia de componentes, vistas, acciones y validaciones: acordar el patron de implementacion"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir estrategia de componentes, vistas, acciones y validaciones: acordar el patron de implementacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 230 - "Listar entidades minimas necesarias: identificar las piezas de datos indispensables del MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Listar entidades minimas necesarias: identificar las piezas de datos indispensables del MVP, Objetivo, Pasos, Resolucion (+1 more)

### Community 231 - "Definir atributos minimos por entidad: acordar los campos necesarios sin sobrecargar el esquema"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir atributos minimos por entidad: acordar los campos necesarios sin sobrecargar el esquema, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 232 - "Definir type_rol y su uso en permisos: representar el control minimo de acceso en datos"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir type_rol y su uso en permisos: representar el control minimo de acceso en datos, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 233 - "Definir redirecciones segun estado autenticado y rol: ordenar la navegacion de acceso"
Cohesion: 0.18
Nodes (10): Archivos, Criterios de aceptacion, Definir redirecciones segun estado autenticado y rol: ordenar la navegacion de acceso, Estado, Estado final, Objetivo, Pasos, Resolucion (+2 more)

### Community 234 - "Definir relacion entre rutina, dias y filas: estructurar la rutina semanal del MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir relacion entre rutina, dias y filas: estructurar la rutina semanal del MVP, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 235 - "Proteger acciones de creacion y edicion administrativas: cerrar la escritura sensible al rol admin"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Proteger acciones de creacion y edicion administrativas: cerrar la escritura sensible al rol admin, Resolucion (+1 more)

### Community 236 - "Validar acceso normal al dashboard de usuario: habilitar la experiencia autenticada no administrativa"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Validacion (+1 more)

### Community 237 - "Definir relacion entre usuarios y rutinas guardadas: soportar multiples rutinas con nombre propio"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir relacion entre usuarios y rutinas guardadas: soportar multiples rutinas con nombre propio, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 238 - "Definir estrategia para imagenes de ejercicios: resolver almacenamiento o referencia sin complejizar"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir estrategia para imagenes de ejercicios: resolver almacenamiento o referencia sin complejizar, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 239 - "Revisar si el modelo puede simplificarse: reducir complejidad antes de congelar el esquema inicial"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Revisar si el modelo puede simplificarse: reducir complejidad antes de congelar el esquema inicial (+1 more)

### Community 240 - "Redactar documento de base de datos: consolidar entidades, atributos y relaciones"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Redactar documento de base de datos: consolidar entidades, atributos y relaciones, Resolucion (+1 more)

### Community 241 - "Cerrar DATABASE.md como fuente de verdad: dejar el modelo inicial listo para los grupos siguientes"
Cohesion: 0.20
Nodes (9): Archivos, Cerrar DATABASE.md como fuente de verdad: dejar el modelo inicial listo para los grupos siguientes, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 242 - "Separar necesidades reales de ideas prematuras: filtrar skills o agentes innecesarios"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Separar necesidades reales de ideas prematuras: filtrar skills o agentes innecesarios (+1 more)

### Community 243 - "Decidir que puede resolverse sin skill dedicada: evitar fragmentacion innecesaria"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Decidir que puede resolverse sin skill dedicada: evitar fragmentacion innecesaria, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 244 - "Definir si hace falta algun agente adicional: justificar o descartar multiagente para el MVP"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Definir si hace falta algun agente adicional: justificar o descartar multiagente para el MVP, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 245 - "Documentar responsabilidades, limites y criterio de uso: dejar cada skill o agente bien acotado"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar responsabilidades, limites y criterio de uso: dejar cada skill o agente bien acotado, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 246 - "Modulos principales del producto"
Cohesion: 0.25
Nodes (8): 1. Acceso y sesion, 2. Catalogo de rutinas, 3. Dashboard de usuario, 4. Admin dashboard, 5. Detalle de ejercicio, 6. Capa de datos, Criterio de modularidad, Modulos principales del producto

### Community 247 - "Flujos principales"
Cohesion: 0.33
Nodes (6): Flujo admin para crear ejercicios, Flujo admin para crear rutinas semanales, Flujo de acceso vigente, Flujo del modal de detalle de ejercicio, Flujo usuario para explorar, elegir, guardar y renombrar rutinas, Flujos principales

### Community 248 - "Implementar shell navegable definitivo del frontend base: llevar la nueva experiencia al layout real"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar shell navegable definitivo del frontend base: llevar la nueva experiencia al layout real, Objetivo, Pasos, Resolucion (+1 more)

### Community 249 - "Implementar vistas base y placeholders del nuevo flujo: dejar visibles las pantallas clave del frontend"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar vistas base y placeholders del nuevo flujo: dejar visibles las pantallas clave del frontend, Objetivo, Pasos, Resolucion (+1 more)

### Community 250 - "Crear tabla `profiles`"
Cohesion: 0.25
Nodes (8): Archivos, Crear tabla `profiles`, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Validacion

### Community 251 - "Crear tablas `routine_templates` y `routine_days`"
Cohesion: 0.25
Nodes (8): Archivos, Crear tablas `routine_templates` y `routine_days`, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Validacion

### Community 252 - "Validar navegacion, responsive y smoke tecnico del frontend base: asegurar que la nueva base frontend funcione en uso real"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Validacion (+1 more)

### Community 253 - "Instalar y configurar librerias imprescindibles: preparar las dependencias reales del proyecto"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Instalar y configurar librerias imprescindibles: preparar las dependencias reales del proyecto, Objetivo, Pasos, Resolucion (+1 more)

### Community 254 - "Generar migracion SQL final de G2"
Cohesion: 0.25
Nodes (8): Archivos, Criterios de aceptacion, Estado, Estado final, Generar migracion SQL final de G2, Objetivo, Pasos, Validacion

### Community 255 - "Aplicar migracion en Supabase y verificar esquema real"
Cohesion: 0.25
Nodes (8): Aplicar migracion en Supabase y verificar esquema real, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Validacion

### Community 256 - "Sincronizar documentacion operativa de G2"
Cohesion: 0.25
Nodes (8): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Sincronizar documentacion operativa de G2, Validacion

### Community 257 - "GymControl"
Cohesion: 0.18
Nodes (7): Alcance operativo del MVP, Configuracion de auth dual, Documentos clave, GymControl, Que hace hoy el MVP, Siguiente frente de trabajo, Stack principal

### Community 258 - "routine-week.ts"
Cohesion: 0.19
Nodes (11): RoutineWeekView(), subscribeNothing(), buildDayTabs(), DayTabState, DockAction, resolveDockAction(), WEEKDAY_SHORT, weekdayShort() (+3 more)

### Community 259 - "graphify reference: extra exports and benchmark"
Cohesion: 0.25
Nodes (7): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 260 - "Limpiar el boilerplate inicial: quitar lo que no aporta al producto"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Limpiar el boilerplate inicial: quitar lo que no aporta al producto, Objetivo, Pasos, Resolucion (+1 more)

### Community 261 - "Dejar esqueleto navegable de las vistas principales: preparar la app para la implementacion funcional"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Dejar esqueleto navegable de las vistas principales: preparar la app para la implementacion funcional, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 262 - "Habilitar RLS en tablas del MVP: activar la proteccion base del esquema aplicado"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Habilitar RLS en tablas del MVP: activar la proteccion base del esquema aplicado, Objetivo, Pasos, Resolucion (+1 more)

### Community 263 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 264 - "Documentar lecturas de catalogo del MVP: cerrar que actores pueden consultar el contenido base"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Documentar lecturas de catalogo del MVP: cerrar que actores pueden consultar el contenido base, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 265 - "Aplicar policies para profiles: limitar lectura y edicion del perfil de aplicacion"
Cohesion: 0.20
Nodes (9): Aplicar policies para profiles: limitar lectura y edicion del perfil de aplicacion, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 266 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 267 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 268 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 269 - "Aplicar policies para catalogo base: cubrir exercises, routine_templates, routine_days y routine_items"
Cohesion: 0.20
Nodes (9): Aplicar policies para catalogo base: cubrir exercises, routine_templates, routine_days y routine_items, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 270 - "Aplicar policies para saved_routines: aislar las rutinas guardadas por usuario"
Cohesion: 0.20
Nodes (9): Aplicar policies para saved_routines: aislar las rutinas guardadas por usuario, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 271 - "Restringir escrituras administrativas a admin: cerrar la autorizacion de cambios globales"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Restringir escrituras administrativas a admin: cerrar la autorizacion de cambios globales (+1 more)

### Community 274 - "Validar escenarios anon, authenticated, admin y owner: comprobar el comportamiento real de las policies"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Validacion (+1 more)

### Community 275 - "Confirmar bootstrap admin y criterio de QA manual: cerrar la operativa minima para validar permisos"
Cohesion: 0.20
Nodes (9): Archivos, Confirmar bootstrap admin y criterio de QA manual: cerrar la operativa minima para validar permisos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 276 - "Probar escenarios basicos de acceso permitido y denegado: validar el comportamiento del control de acceso"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Probar escenarios basicos de acceso permitido y denegado: validar el comportamiento del control de acceso, Resolucion (+1 more)

### Community 277 - "Ajustar mensajes o UX minima ante accesos no permitidos: cerrar la experiencia de bloqueo con claridad"
Cohesion: 0.20
Nodes (9): Ajustar mensajes o UX minima ante accesos no permitidos: cerrar la experiencia de bloqueo con claridad, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 278 - "Grupo "G12" - Cierre del MVP"
Cohesion: 0.29
Nodes (7): Backlog inicial de la siguiente iteracion, Checklist de alcance del MVP, Cierre formal del MVP, Grupo "G12" - Cierre del MVP, Pendientes post-MVP, Subgrupo "G12.1" - Documentacion final, Subgrupo "G12.2" - Checklist de entrega

### Community 279 - "Fronteras entre secciones"
Cohesion: 0.33
Nodes (6): `Admin dashboard`, `Agregar rutinas`, `Ejercicio`, Fronteras entre secciones, `Mis rutinas`, Regla de separacion

### Community 280 - "Patron visual del panel y contenido"
Cohesion: 0.33
Nodes (6): Area principal de contenido, Criterio de legibilidad, Estados del patron, Panel lateral, Patron visual del panel y contenido, Relacion visual entre ambas regiones

### Community 281 - "Entradas administrativas para gestion"
Cohesion: 0.33
Nodes (6): Entradas administrativas para gestion, Gestion de ejercicios, Gestion de rutinas, Preparacion para G6 y G7, Punto de partida, Regla de navegacion administrativa

### Community 282 - "Sistema visual minimo"
Cohesion: 0.33
Nodes (6): Espaciado, Paleta, Resultado esperado del sistema base, Sistema visual minimo, Superficies, Tipografia

### Community 283 - "Implementar modelo persistente de ejercicio: crear acceso a datos sobre `exercises`"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar modelo persistente de ejercicio: crear acceso a datos sobre `exercises`, Objetivo, Pasos, Resolucion (+1 more)

### Community 284 - "Implementar validaciones de alta y edicion: asegurar consistencia minima de los ejercicios"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar validaciones de alta y edicion: asegurar consistencia minima de los ejercicios, Objetivo, Pasos, Resolucion (+1 more)

### Community 285 - "G6-admin-exercises/README.md"
Cohesion: 0.05
Nodes (51): Modal de detalle de ejercicio, Dependencias operativas, G10 - Exercise Modal, Objetivo del grupo, Orden recomendado, Resultado esperado, G11 - Integration And QA, Objetivo del grupo (+43 more)

### Community 286 - "Resolver almacenamiento o referencia de imagenes: conectar el ejercicio con su recurso visual"
Cohesion: 0.20
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion, Resolver almacenamiento o referencia de imagenes: conectar el ejercicio con su recurso visual (+1 more)

### Community 287 - "sync-fitnessprogramer-images.mjs"
Cohesion: 0.24
Nodes (13): delay(), DIRECT_SLUGS, EXERCISE_SEARCH_TERMS, extractGifUrl(), fetchHtml(), findExerciseUrl(), getRequiredEnv(), HEADERS (+5 more)

### Community 288 - "Plan - indice y orden de ejecucion"
Cohesion: 0.33
Nodes (6): Estado actual, Grupo "G8" - Catalogo de rutinas, Lectura recomendada, Plan - indice y orden de ejecucion, Subgrupo "G8.1" - Exploracion, Subgrupo "G8.2" - Consumo del contenido

### Community 289 - "Grupo "G4.5" - Frontend base y experiencia"
Cohesion: 0.33
Nodes (6): Grupo "G4.5" - Frontend base y experiencia, Subgrupo "G4.5.1" - Arquitectura de experiencia, Subgrupo "G4.5.2" - Sistema visual base, Subgrupo "G4.5.3" - Flujo de usuario, Subgrupo "G4.5.4" - Flujo admin, Subgrupo "G4.5.5" - Implementacion y validacion

### Community 290 - "Crear vista de listado de ejercicios en admin dashboard: exponer el recurso al administrador"
Cohesion: 0.20
Nodes (9): Archivos, Crear vista de listado de ejercicios en admin dashboard: exponer el recurso al administrador, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 292 - "Alcance del MVP"
Cohesion: 0.40
Nodes (5): Alcance del MVP, Fuera de alcance por ahora, Incluido en el MVP, Principios de arquitectura, Proposito

### Community 293 - "auth.ts"
Cohesion: 0.25
Nodes (12): GET(), redirectToLogin(), AppRole, AuthContext, getPostLoginRedirectPath(), loadAuthContext(), loadProfileRecord(), ProfileRecord (+4 more)

### Community 294 - "DayWorkoutClient.tsx"
Cohesion: 0.10
Nodes (42): computeWeeklyStreak(), estimateE1rm(), ExerciseKind, findBestSet(), formatKg(), formatLoggedSet(), formatSeconds(), getLoadStep() (+34 more)

### Community 295 - "media-manifest.mjs"
Cohesion: 0.16
Nodes (19): collectRoutineExercises(), DASHBOARD_ASSETS, DEFAULT_OUT, exerciseToAsset(), fetchExercises(), fetchFoods(), fetchRecipes(), fetchRoutines() (+11 more)

### Community 296 - "Plan: ajustes UI (home, catalogo, rutina detalle, dashboard)"
Cohesion: 0.22
Nodes (8): 1. Home `/` — 3 cards con alturas distintas, 2. /catalogo — lupa de la searchbar no centrada en Y, 3. /catalogo/rutinas/[id] — hover + columnas, 4. /dashboard/rutinas — espacios gigantes entre componentes, Context, Plan: ajustes UI (home, catalogo, rutina detalle, dashboard), Riesgos, Verificación

### Community 297 - "Plan: rediseño login + ejercicios clickeables + reestructura day-workout"
Cohesion: 0.22
Nodes (8): Archivos a modificar (resumen), Context, Plan: rediseño login + ejercicios clickeables + reestructura day-workout, Riesgos, Tarea 1 — Rediseño login (split full-screen minimal), Tarea 2 — Ejercicios clickeables (faltantes admin), Tarea 3 — Day-workout acordeón, Verificación end-to-end

### Community 298 - "G2.1 - Implementacion de G2 en Supabase"
Cohesion: 0.40
Nodes (5): G2.1 - Implementacion de G2 en Supabase, Limites del grupo, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 299 - "Plan: 3 mejoras de UI (configuración, admin/alimentos, nutrición/registro)"
Cohesion: 0.22
Nodes (8): Context, Orden de ejecución, Plan: 3 mejoras de UI (configuración, admin/alimentos, nutrición/registro), Riesgos, Tarea 1 — Rediseño "Tu plan estimado" /configuracion, Tarea 2 — Fix searchbar /admin/alimentos (la más simple, hacer primero), Tarea 3 — Rediseño /nutricion/registro, Verificación (playwright-cli, app local)

### Community 300 - "Grupo "G2" - Base de datos"
Cohesion: 0.40
Nodes (5): Bajada operativa de G2 a Supabase, Grupo "G2" - Base de datos, Subgrupo "G2.1" - Entidades base, Subgrupo "G2.2" - Relaciones y reglas, Subgrupo "G2.3" - Documento y criterio de simplicidad

### Community 301 - "Grupo "G13" - Transicion de auth dual"
Cohesion: 0.40
Nodes (5): Grupo "G13" - Transicion de auth dual, Subgrupo "G13.1" - Contrato y alcance de auth, Subgrupo "G13.2" - UI y backend de autenticacion, Subgrupo "G13.3" - Configuracion externa y compatibilidad, Subgrupo "G13.4" - QA y cierre

### Community 302 - "Grupo "G5" - Autenticacion y roles"
Cohesion: 0.40
Nodes (5): Grupo "G5" - Autenticacion y roles, Subgrupo "G5.1" - Sesion con Supabase Auth, Subgrupo "G5.2" - Proteccion de areas, Subgrupo "G5.3" - Verificacion, Subgrupo "G5.4" - Bootstrap operativo

### Community 303 - "Confirmar stack final y dependencias necesarias: cerrar la base tecnica del MVP"
Cohesion: 0.22
Nodes (9): Archivos, Confirmar stack final y dependencias necesarias: cerrar la base tecnica del MVP, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 304 - "Traducir `docs/DATABASE.md` a reglas SQL concretas"
Cohesion: 0.22
Nodes (8): Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Traducir `docs/DATABASE.md` a reglas SQL concretas, Validacion

### Community 305 - "Definir utilidades comunes minimas del esquema"
Cohesion: 0.22
Nodes (8): Archivos, Criterios de aceptacion, Definir utilidades comunes minimas del esquema, Estado, Estado final, Objetivo, Pasos, Validacion

### Community 306 - "Agregar constraints e indices minimos finales"
Cohesion: 0.22
Nodes (8): Agregar constraints e indices minimos finales, Archivos, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Validacion

### Community 307 - "Plan: imagen + GIF de ExerciseDB en el detalle de ejercicio"
Cohesion: 0.25
Nodes (7): `app/components/shared/ExerciseDetailModal.tsx` (único archivo a tocar), Cambios, Context, No tocar, Plan: imagen + GIF de ExerciseDB en el detalle de ejercicio, Riesgos, Verificación (end-to-end)

### Community 308 - "fetch-dataset-images.mjs"
Cohesion: 0.19
Nodes (18): DEFAULT_MANIFEST, DISH_SEARCH_MAP, fetchBytes(), fetchFoodImage(), fetchJson(), fetchOff(), fetchRecipeImage(), FOOD_INGREDIENT_FALLBACK (+10 more)

### Community 309 - "Plan: Exercise Detail Modal — PWA Visual Fixes"
Cohesion: 0.25
Nodes (7): Context, File to modify, Fix 1 — Remove purple gradient line, Fix 2 — Sheet width ~70% on mobile, Fix 3 — GIFs not cropped at top, Plan: Exercise Detail Modal — PWA Visual Fixes, Verification

### Community 310 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. System Analysis, 2. Service Development, 3. Production Readiness, Communication Protocol, Development Workflow, Mandatory Context Retrieval, Project Overlay

### Community 311 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Review Preparation, 2. Implementation Phase, 3. Review Excellence, Code Review Context, Communication Protocol, Development Workflow, Project Overlay

### Community 312 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Architecture Analysis, 2. Implementation Phase, 3. Context Excellence, Communication Protocol, Context System Assessment, Development Workflow, Project Overlay

### Community 313 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Infrastructure Analysis, 2. Implementation Phase, 3. Operational Excellence, Communication Protocol, Database Assessment, Development Workflow, Project Overlay

### Community 314 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Issue Analysis, 2. Implementation Phase, 3. Resolution Excellence, Communication Protocol, Debugging Context, Development Workflow, Project Overlay

### Community 315 - "Grupo "G10" - Modal de ejercicio"
Cohesion: 0.50
Nodes (4): Grupo "G10" - Modal de ejercicio, Subgrupo "G10.1" - Componente base, Subgrupo "G10.2" - Integracion en vistas, Subgrupo "G10.3" - UX y accesibilidad minima

### Community 316 - "Grupo "G11" - Integracion y QA del MVP"
Cohesion: 0.50
Nodes (4): Grupo "G11" - Integracion y QA del MVP, Subgrupo "G11.1" - Flujos criticos, Subgrupo "G11.2" - Consistencia y errores, Subgrupo "G11.3" - Ajustes finales

### Community 317 - "Grupo "G1" - Arquitectura"
Cohesion: 0.50
Nodes (4): Grupo "G1" - Arquitectura, Subgrupo "G1.1" - Alcance y modulos, Subgrupo "G1.2" - Flujos principales, Subgrupo "G1.3" - Convenciones tecnicas

### Community 318 - "Grupo "G3" - Skills y agentes"
Cohesion: 0.50
Nodes (4): Grupo "G3" - Skills y agentes, Subgrupo "G3.1" - Necesidad real, Subgrupo "G3.2" - Diseno minimo, Subgrupo "G3.3" - Documento de referencia

### Community 319 - "Grupo "G4" - Setup tecnico del MVP"
Cohesion: 0.50
Nodes (4): Grupo "G4" - Setup tecnico del MVP, Subgrupo "G4.1" - Preparacion del entorno, Subgrupo "G4.2" - Estructura de proyecto, Subgrupo "G4.3" - Base de trabajo

### Community 320 - "Grupo "G5.5" - RLS y policies"
Cohesion: 0.50
Nodes (4): Grupo "G5.5" - RLS y policies, Subgrupo "G5.5.1" - Estrategia base, Subgrupo "G5.5.2" - Policies por dominio, Subgrupo "G5.5.3" - Validacion

### Community 322 - "Grupo "G7" - Rutinas admin"
Cohesion: 0.50
Nodes (4): Grupo "G7" - Rutinas admin, Subgrupo "G7.1" - Acceso a datos e integridad, Subgrupo "G7.2" - Builder admin, Subgrupo "G7.3" - Lectura completa y referencias

### Community 323 - "Grupo "G9" - Dashboard de usuario"
Cohesion: 0.50
Nodes (4): Grupo "G9" - Dashboard de usuario, Subgrupo "G9.1" - Guardado de rutinas, Subgrupo "G9.2" - Personalizacion, Subgrupo "G9.3" - Visualizacion

### Community 324 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Pipeline Analysis, 2. Implementation Phase, 3. Deployment Excellence, Communication Protocol, Deployment Assessment, Development Workflow, Project Overlay

### Community 328 - "Execution Flow"
Cohesion: 0.25
Nodes (7): 1. Context Discovery, 2. Development Execution, 3. Handoff and Documentation, Communication Protocol, Execution Flow, Project Overlay, Required Initial Step: Project Context Gathering

### Community 329 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Architecture Planning, 2. Implementation Phase, 3. Next.js Excellence, Communication Protocol, Development Workflow, Next.js Context Assessment, Project Overlay

### Community 330 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Database Analysis, 2. Implementation Phase, 3. PostgreSQL Excellence, Communication Protocol, Development Workflow, PostgreSQL Context Assessment, Project Overlay

### Community 331 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Audit Planning, 2. Implementation Phase, 3. Audit Excellence, Audit Context Assessment, Communication Protocol, Development Workflow, Project Overlay

### Community 333 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Type Architecture Analysis, 2. Implementation Phase, 3. Type Quality Assurance, Communication Protocol, Development Workflow, Project Overlay, TypeScript Project Assessment

### Community 338 - "Execution Flow"
Cohesion: 0.25
Nodes (7): 1. Context Discovery, 2. Design Execution, 3. Handoff and Documentation, Communication Protocol, Execution Flow, Project Overlay, Required Initial Step: Design Context Gathering

### Community 339 - "Development Workflow"
Cohesion: 0.25
Nodes (7): 1. Assessment Phase, 2. Implementation Phase, 3. Testing Excellence, Communication Protocol, Development Workflow, Project Overlay, Testing Context Assessment

### Community 340 - "upload-generated-images.mjs"
Cohesion: 0.24
Nodes (8): DEFAULT_MANIFEST, main(), MIME_BY_EXT, PROJECT_ROOT, resolveArg(), stripBom(), supabase, updateTable()

### Community 341 - "render-generated-images.ps1"
Cohesion: 0.60
Nodes (9): Blend-Color(), Draw-ExerciseImage(), Draw-FoodImage(), Draw-RoutineImage(), Fill-Background(), Get-Palette(), Get-StableHash(), New-Color() (+1 more)

### Community 342 - "graphify reference: extra exports and benchmark"
Cohesion: 0.25
Nodes (7): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 343 - "sync-exercise-images.mjs"
Cohesion: 0.23
Nodes (13): EQUIPMENT_TERMS, EXERCISE_SEARCH_TERMS, exerciseImageSlug(), fetchDbExercises(), fetchFreeExerciseDb(), findBestMatch(), getRequiredEnv(), main() (+5 more)

### Community 344 - "MuscleAnatomy.tsx"
Cohesion: 0.08
Nodes (31): HomeSectionHeader(), HomeWeekStats(), CALLOUTS, MuscleAnatomy(), changeView(), MuscleStrengthPoint, Side, strongestGroup() (+23 more)

### Community 345 - "login/page.tsx"
Cohesion: 0.22
Nodes (8): errorCopy, LoginPage(), LoginPageProps, statusCopy, StatusToast(), StatusToastProps, SectionEyebrow(), SectionEyebrowProps

### Community 346 - "workout-sync-queue.ts"
Cohesion: 0.10
Nodes (38): WorkoutSyncRunner(), ExerciseKind, enqueueFinish(), enqueueItem(), eventListeners, findQueuedSessionForDay(), firstError(), flushNow() (+30 more)

### Community 347 - "Plan: Fixes responsive mobile (Home cuerpo + Nutrición registro)"
Cohesion: 0.29
Nodes (6): Context, Plan: Fixes responsive mobile (Home cuerpo + Nutrición registro), Rediseño 1 — Cuerpo "Carga muscular" (Home), Rediseño 2 — Bloque "Constancia" + tip (`/nutricion/registro`), Riesgos, Verificación (Playwright, mobile)

### Community 348 - "Codex context layer maintenance rules"
Cohesion: 0.29
Nodes (6): Allowed changes, Codex context layer maintenance rules, Non-goals, Purpose, Required checks before editing, Size budget

### Community 349 - "private.is_current_user_admin() helper"
Cohesion: 0.29
Nodes (4): private.is_current_user_admin() helper, app/admin layout server-side guard (type_rol=admin), app/dashboard layout server-side guard (auth required, no admin), requireUser / requireAdmin server guards

### Community 350 - "G5 - Auth And Roles"
Cohesion: 0.29
Nodes (6): Decision cerrada, Estado del grupo, G5 - Auth And Roles, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 351 - "render_body_fat.py"
Cohesion: 0.27
Nodes (10): add_garment(), add_light(), contact_sheet(), material(), Renders the body fat reference figures used by BodyFatFigure. Requires Blender…, Builds tight clothing from the posed body surface inside the given height bands., rows: list of lists of image paths, all RES_X x RES_Y., relax_pose() (+2 more)

### Community 352 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 353 - "05-crear-tablas-routine-templates-y-routine-days.md"
Cohesion: 0.47
Nodes (4): Tabla exercises, Tabla routine_days, Tabla routine_items, Tabla routine_templates

### Community 354 - "SKILL_ROUTING"
Cohesion: 0.33
Nodes (5): Hard limits, Rule of thumb, SKILL_ROUTING, Skills, Subagents

### Community 355 - "01-definir-estrategia-minima-de-rls-y-helper-de-admin.md"
Cohesion: 0.40
Nodes (4): supabase/migrations/20260608_g55_mvp_rls_policies.sql, private.can_update_own_profile(...) helper, private.current_profile_id() helper, profiles.type_rol (fuente de verdad de autorizacion)

### Community 356 - "G2 - Database"
Cohesion: 0.33
Nodes (5): Bajada operativa, G2 - Database, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 358 - "G7 - Admin Routines"
Cohesion: 0.33
Nodes (5): Dependencias, G7 - Admin Routines, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 359 - "4. Decisiones tomadas"
Cohesion: 0.12
Nodes (16): 1. Resumen, 2. Fuentes y método, 3. Excepciones Atwater, 4. Decisiones tomadas, 5. Validación y cambios futuros, Análogos documentados (sin registro exacto), Apéndice — fuente de cada alimento, Calidad de la referencia (+8 more)

### Community 360 - "G12 - MVP Closure"
Cohesion: 0.40
Nodes (4): G12 - MVP Closure, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 361 - "Traduccion SQL preliminar para G2.1"
Cohesion: 0.15
Nodes (13): Constraints e indices minimos finales, Criterios comunes, `exercises`, Observaciones de implementacion, `profiles`, `routine_days`, `routine_items`, `routine_templates` (+5 more)

### Community 362 - "G3 - Skills And Agents"
Cohesion: 0.40
Nodes (4): G3 - Skills And Agents, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 363 - "G4.5 - Frontend Base And Experience"
Cohesion: 0.40
Nodes (4): G4.5 - Frontend Base And Experience, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 364 - "G4 - MVP Setup"
Cohesion: 0.40
Nodes (4): G4 - MVP Setup, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 365 - "Crear tabla `routine_items`"
Cohesion: 0.25
Nodes (8): Archivos, Crear tabla `routine_items`, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Validacion

### Community 366 - "PrimaryNavigation.tsx"
Cohesion: 0.06
Nodes (46): isStandaloneDisplay(), PwaRuntime(), MobileHeader(), MobileHeaderBadge, MobileHeaderBadgeSync(), MobileHeaderContext, MobileHeaderProps, MobileHeaderState (+38 more)

### Community 367 - "G8 - Routine Catalog"
Cohesion: 0.40
Nodes (4): G8 - Routine Catalog, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 368 - "G9 - User Dashboard"
Cohesion: 0.40
Nodes (4): G9 - User Dashboard, Objetivo del grupo, Orden recomendado, Resultado esperado

### Community 369 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 370 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 371 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 372 - "RLS y policies del MVP"
Cohesion: 0.20
Nodes (10): 3. Ejercicio, 4. Rutina plantilla, 5. Dia de rutina, 6. Fila o item de rutina, 7. Rutina guardada por usuario, RLS y policies del MVP, Traduccion SQL, Traduccion SQL (+2 more)

### Community 375 - "Apartado de nutricion (G18)"
Cohesion: 0.40
Nodes (5): Apartado de nutricion (G18), `foods`, Indices, `nutrition_profiles`, Storage `food-images`

### Community 377 - "Apartado de nutricion - extras (G21)"
Cohesion: 0.40
Nodes (5): Apartado de nutricion - extras (G21), Indices, `meal_log_items`, `meal_log_meals` (g23), `meal_logs`

### Community 379 - "Entidades minimas necesarias"
Cohesion: 0.50
Nodes (4): 1. Usuario auth, 2. Perfil de usuario, Entidades minimas necesarias, Provisionamiento de perfil

### Community 380 - "getSupabasePublicEnv"
Cohesion: 0.20
Nodes (12): ExerciseFormSheet(), clearObjectUrl(), handleFileChange(), handleSubmit(), validateExerciseImageFile(), createSupabaseBrowserClient(), getSupabasePublicEnv(), SupabasePublicEnv (+4 more)

### Community 391 - "Crear tabla `exercises`"
Cohesion: 0.25
Nodes (8): Archivos, Crear tabla `exercises`, Criterios de aceptacion, Estado, Estado final, Objetivo, Pasos, Validacion

### Community 396 - "registro/page.tsx"
Cohesion: 0.13
Nodes (25): HomeWeekStrip(), buildWeek(), DayCell, WeekCombinedCard(), WeekCombinedCardProps, addDaysToDateKey(), APP_TIME_ZONE, DATE_KEY_FORMATTER (+17 more)

### Community 397 - "ExerciseAdminClient.tsx"
Cohesion: 0.08
Nodes (34): FoodAdminClientProps, FoodFormSheetProps, SortColumn, SortDirection, ExerciseAdminClientProps, ExerciseFormSheetProps, SortColumn, SortDirection (+26 more)

### Community 402 - "backfill-exercise-static-frames.mjs"
Cohesion: 0.47
Nodes (4): getRequiredEnv(), main(), PROJECT_ROOT, uploadToSupabase()

### Community 406 - "DESIGN.md — GymControl Design System"
Cohesion: 0.06
Nodes (32): 0. Principios, 10.1 Zonas (arriba → abajo), 10.2 Estados del hero, 10.3 Tus músculos sin datos, 10. Home mobile (`/`, <1024px), 11. Registro de entrenamiento (`/rutinas/dia`), 12.1 Zonas (arriba → abajo), 12.2 Estados (+24 more)

### Community 413 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, playwright, sharp, tailwindcss (+15 more)

### Community 414 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, check, check:ui, dev, exercisedb:audit, lint, media:manifest (+5 more)

### Community 415 - "Disenar pantalla de detalle diario de rutina: enfocar la consulta del entrenamiento del dia"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Disenar pantalla de detalle diario de rutina: enfocar la consulta del entrenamiento del dia, Estado, Estado final, Objetivo, Pasos, Resolucion (+1 more)

### Community 416 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 417 - "Ciclo AUDITAR ⇄ EJECUTAR — 2 prompts"
Cohesion: 0.25
Nodes (7): Ciclo AUDITAR ⇄ EJECUTAR — 2 prompts, Cierre de sección, Prompt A — AUDITAR, Prompt A — AUDITAR, Prompt B - AUDITAR segundo run, Prompt B — EJECUTAR, Secciones

### Community 422 - "Redesign Playbook (Gymcontrol)"
Cohesion: 0.18
Nodes (10): Anti-patrón que esto corrige, Compresión: 7 fases → 3 prompts, Ejecución encadenada (pegar arriba de cada prompt agrupado), Principios, PROMPT 1 — Referencia + Audit (read-only, no toca código), PROMPT 2 — Layout + Piel, PROMPT 3 — A11y + Micro + Verify, Redesign Playbook (Gymcontrol) (+2 more)

### Community 423 - "cn"
Cohesion: 0.07
Nodes (34): HomeGreeting(), DayPanel(), WeekDay, WeekExercise, WeekStats(), DayTabs(), RoutineCover(), WeekSummary (+26 more)

### Community 424 - "createMealWithItems"
Cohesion: 0.31
Nodes (9): addMealItems(), createMealWithItems(), emptyMealLog(), getMealInLog(), getMealLogOrEmpty(), getNextMealPosition(), listMealIdsInOrder(), moveMeal() (+1 more)

### Community 425 - "Implementar autenticacion base de usuario: habilitar Supabase Auth server-side para el MVP"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Implementar autenticacion base de usuario: habilitar Supabase Auth server-side para el MVP, Objetivo, Pasos, Resolucion (+1 more)

### Community 426 - "Integrar acceso admin en el shell general: unificar la entrada administrativa sin duplicar la experiencia base"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Integrar acceso admin en el shell general: unificar la entrada administrativa sin duplicar la experiencia base, Objetivo, Pasos, Resolucion (+1 more)

### Community 427 - "Integrar type_rol al flujo de acceso y sesion: distinguir admin de usuario normal"
Cohesion: 0.22
Nodes (9): Archivos, Criterios de aceptacion, Estado, Estado final, Integrar type_rol al flujo de acceso y sesion: distinguir admin de usuario normal, Objetivo, Pasos, Resolucion (+1 more)

### Community 428 - "routines.ts"
Cohesion: 0.08
Nodes (36): AdminLayout(), deleteRoutineAction(), restoreRoutineAction(), revalidateRoutinePaths(), saveRoutineAction(), AdminRoutinesPage(), RoutineAdminClient(), confirmDelete() (+28 more)

### Community 429 - "02-integrar-type-rol-al-flujo-de-acceso-y-sesion.md"
Cohesion: 0.40
Nodes (3): Contexto de auth con rol expuesto a layout, navegacion y guards, profiles.type_rol, Supabase Auth con @supabase/ssr (login, logout, middleware, magic link)

### Community 430 - "recipe-nutrition.ts"
Cohesion: 0.17
Nodes (15): formatOneDecimal(), RecipeForm(), toNumber(), buildRecipeSnapshot(), NutritionAmount, nutritionFromSnapshot(), recipeBaseGrams(), RecipeFoodNutrition (+7 more)

### Community 431 - "Acceso admin integrado en shell general"
Cohesion: 0.33
Nodes (3): Acceso admin integrado en shell general, Base visual de Admin dashboard (Rutinas y Ejercicios), Entradas administrativas Gestion de rutinas / Gestion de ejercicios

### Community 432 - "Fases"
Cohesion: 0.13
Nodes (14): Archivos, Context, Enfoque, F0 · Docs (fuente de verdad primero), F1 · Lógica pura + datos, F2 · Shell mobile, F3 · Pestañas, pager y panel, F4 · Estados restantes (+6 more)

### Community 437 - "Plan — Huecos de la auditoría (Ejercitación + Alimentación)"
Cohesion: 0.18
Nodes (10): Context, Docs, F0 — Migración expand (no rompe código viejo en prod), F1 — Orden de comidas, F2 — Porción en gramos + registrar por g o porción + congelado, F3 — Recetas creadas por usuarios, F4 — Contract (después del deploy de F1–F3 en prod, con confirmación), Plan — Huecos de la auditoría (Ejercitación + Alimentación) (+2 more)

### Community 438 - "RoutineFormSheet"
Cohesion: 0.28
Nodes (5): createEmptyDay(), createEmptyItem(), RoutineFormSheet(), handleAddDay(), handleAddItem()

### Community 439 - "meal-order.ts"
Cohesion: 0.29
Nodes (7): buildDayMealRows(), DayMealRow, DEFAULT_DAY_MEAL_TYPES, insertAfter(), moveInOrder(), rankOf(), suggestAfterMealId()

### Community 443 - "SurfaceCard.tsx"
Cohesion: 0.40
Nodes (3): PlaceholderPanelProps, SurfaceCard(), SurfaceCardProps

## Ambiguous Edges - Review These
- `File Icon` → `Globe Icon`  [AMBIGUOUS]
  public/file.svg · relation: conceptually_related_to
- `Globe Icon` → `Window Icon`  [AMBIGUOUS]
  public/window.svg · relation: conceptually_related_to
- `Next.js Logo` → `Vercel Triangle Logo`  [AMBIGUOUS]
  public/next.svg · relation: conceptually_related_to

## Knowledge Gaps
- **2955 isolated node(s):** `supabase_gymcontrol`, `RecentActivityEntry`, `ACTIVITY_ICONS`, `FoodAdminClientProps`, `SortColumn` (+2950 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `File Icon` and `Globe Icon`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Globe Icon` and `Window Icon`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Next.js Logo` and `Vercel Triangle Logo`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `createSupabaseServerClient()` connect `createSupabaseServerClient` to `recipes.ts`, `registro/page.tsx`, `recetas/actions.ts`, `saved-routines.ts`, `catalogo/page.tsx`, `registro/actions.ts`, `app/alimentos/actions.ts`, `request-otp/route.ts`, `foods.ts`, `nutrition-types.ts`, `auth.ts`, `createMealWithItems`, `routines.ts`, `meal-logs.ts`, `workout-sync.ts`, `exercises.ts`, `workout-tracking.ts`, `app/page.tsx`, `getSupabasePublicEnv`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `nutrition-types.ts`, `DayWorkoutClient.tsx`, `Button.tsx`, `RegistroClient.tsx`, `registro/page.tsx`, `ExerciseAdminClient.tsx`, `PrimaryNavigation.tsx`, `recipe-nutrition.ts`, `RegistroClient`, `admin/page.tsx`, `MuscleAnatomy.tsx`, `RoutineCatalogClient.tsx`, `workout-sync-queue.ts`, `app/page.tsx`, `getSupabasePublicEnv`, `NutritionCatalogClient.tsx`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `MyRoutinesList()` connect `Button.tsx` to `app/page.tsx`, `saved-routines.ts`, `cn`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `supabase_gymcontrol`, `RecentActivityEntry`, `ACTIVITY_ICONS` to the rest of the system?**
  _2955 weakly-connected nodes found - possible documentation gaps or missing edges._