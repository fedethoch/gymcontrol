# Skills And Agents

## Objetivo

Definir la estrategia real de skills y agentes para trabajar GymControl hoy, usando capacidades disponibles y evitando documentar piezas locales que todavia no existen en el repo.

## Decision actual

GymControl no mantiene por ahora skills propias versionadas para `repo-context`, `spec-runner` o `gymcontrol-supabase`.

La operativa del proyecto se apoya en:

- `AGENTS.md`
- `docs/codex/`
- skills disponibles en la sesion de Codex
- specs bajo `specs/`

Si mas adelante aparece una necesidad real de una skill local del repo, primero debe justificarse en este documento y despues implementarse.

## Skills preferidas del proyecto

### Trabajo general del repo

- sin skill dedicada cuando el cambio es chico y `AGENTS.md` + `docs/codex/` alcanzan

### UI y frontend

- `frontend-design` para pantallas, componentes o refinamiento visual
- `accessibility` para trabajo explicito de a11y
- `core-web-vitals` para performance UI
- `web-quality-audit` para auditorias amplias

### Next.js

- `next-best-practices` para App Router, render, env y patrones de implementacion
- `next-cache-components` solo si entran cache components o PPR
- `next-upgrade` solo para upgrades de framework

### Supabase, Postgres y permisos

- `supabase-postgres-best-practices` para schema, consultas, RLS y policies

### Testing de app local

- `webapp-testing` cuando exista una app corrible y haga falta validar flujos en browser

## Skills disponibles pero no elegidas por defecto

- `better-auth-best-practices`
- `better-auth-emailAndPassword`

No deben usarse en GymControl mientras la arquitectura del MVP siga cerrada sobre Supabase Auth.

## Regla para auth y seguridad

La decision actual del proyecto es:

- autenticacion con Supabase Auth
- sesion server-side con `@supabase/ssr`
- autorizacion basada en `profiles.type_rol`
- endurecimiento de datos con RLS y policies antes de CRUD real
- auth vigente: `OTP por email + Google OAuth` sin cambiar de proveedor ni fuente de autorizacion

Por lo tanto:

- auth, roles, RLS y policies se resuelven con la documentacion del repo y skills orientadas a Supabase
- no corresponde introducir Better Auth salvo cambio explicito de arquitectura

## Subagents

Regla base:

- no usar subagents para cambios chicos o de un solo archivo
- usarlos solo en tareas grandes, riesgosas o muy especializadas

Casos donde pueden justificarce:

- bug desconocido: `debugger`
- tarea grande de UI: `frontend-developer` o `ui-designer`
- tarea de Next.js con riesgo de render o env: `nextjs-developer`
- SQL, RLS o policies complejas: `postgres-pro` con apoyo de `security-auditor` si hace falta
- review final de diff amplio o riesgoso: `code-reviewer`

## Lo que hoy no justifica una skill propia del repo

- ejercicios admin
- rutinas admin
- catalogo
- dashboard de usuario
- modal de ejercicio
- validacion documental

Estas areas ya quedan suficientemente guiadas por `PLAN.md`, `specs/`, `docs/ARCHITECTURE.md` y `docs/DATABASE.md`.

## Fuente de verdad

Este documento queda como referencia operativa para decidir:

- cuando alcanza Codex normal
- cuando conviene usar una skill existente
- cuando un subagent esta justificado
- cuando no corresponde crear o documentar capacidades que el repo aun no versiona
