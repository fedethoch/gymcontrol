# G5.5 - RLS And Policies

Este grupo cierra la capa minima de seguridad de datos del MVP despues de auth y antes de CRUD real.

## Objetivo del grupo

Habilitar RLS y policies coherentes con el MVP para `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines`.

## Orden recomendado

1. `01-definir-estrategia-minima-de-rls-y-helper-de-admin.md`
2. `02-habilitar-rls-en-tablas-del-mvp.md`
3. `03-documentar-lecturas-de-catalogo-del-mvp.md`
4. `04-aplicar-policies-para-profiles.md`
5. `05-aplicar-policies-para-catalogo-base.md`
6. `06-aplicar-policies-para-saved-routines.md`
7. `07-restringir-escrituras-administrativas-a-admin.md`
8. `08-validar-escenarios-anon-authenticated-admin-y-owner.md`
9. `09-confirmar-bootstrap-admin-y-criterio-de-qa-manual.md`

## Dependencias

- `G2` aplicado en Supabase
- `G5` cerrado con Supabase Auth

## Resultado esperado

Tener el esquema del MVP protegido con RLS y policies minimas, dejando desbloqueados `G6`, `G7`, `G8` y `G9`.

## Estado final

Implementado en repo; pendiente aplicacion o validacion remota en Supabase.

## Resolucion

- migracion versionada en `supabase/migrations/20260608_g55_mvp_rls_policies.sql`
- catalogo base publico en lectura para `anon` y `authenticated`
- escrituras globales reservadas a `admin`
- `saved_routines` owner-only incluso para admin
- `profiles` con lectura propia, lectura admin y actualizacion propia sin cambios de rol desde la app
- bootstrap admin mantenido como operativa manual por Supabase o MCP
