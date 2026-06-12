# Crear tablas `routine_templates` y `routine_days`

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 5  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Implementar la estructura base de rutina semanal, separando plantilla y dias de rutina de acuerdo con el diseño pactado en G2.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Crear `routine_templates` con los campos minimos acordados.
2. Crear `routine_days` como particion por dia de cada plantilla.
3. Vincular ambas tablas con la relacion uno a muchos pactada.
4. Dejar resuelto el criterio de orden semanal con `day_order`.

## Criterios de aceptacion

- `routine_templates` y `routine_days` existen y se relacionan correctamente.
- `day_order` queda definido de forma clara y consistente.
- No se agregan estructuras avanzadas de versionado o estados.

## Validacion

- Verificar foreign key entre ambas tablas.
- Verificar que la estructura soporte varios dias por rutina sin duplicar la plantilla.

## Estado final

Completado.
