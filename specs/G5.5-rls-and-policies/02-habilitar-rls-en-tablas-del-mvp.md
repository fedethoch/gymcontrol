# Habilitar RLS en tablas del MVP: activar la proteccion base del esquema aplicado

**Grupo:** G5.5 - RLS y policies  
**Orden:** 2  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Habilitar RLS en `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines` sin romper el flujo definido por G5.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- migraciones o SQL de Supabase
- `PLAN.md`

## Pasos

1. Confirmar que G5 ya deja sesion y rol disponibles.
2. Habilitar RLS en las tablas del MVP.
3. Preparar la base para aplicar policies explicitas a continuacion.
4. Evitar dejar tablas protegidas a medias.

## Criterios de aceptacion

- Las tablas del MVP quedan con RLS habilitado.
- El cambio no redefine el esquema.
- El siguiente paso puede aplicar policies concretas sobre una base coherente.

## Resolucion

- RLS habilitado en `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines`
- la migracion no redefine tablas ni relaciones de `G2.1`
- la base queda lista para CRUD real sin huecos entre tablas del MVP

## Validacion

- Verificar por SQL o MCP que RLS quede habilitado en las 6 tablas.
- Verificar que no queden tablas del MVP fuera del endurecimiento previsto.

## Estado final

Completado.
