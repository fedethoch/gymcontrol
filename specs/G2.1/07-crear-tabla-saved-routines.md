# Crear tabla `saved_routines`

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Implementar la tabla que asigna rutinas plantilla a usuarios, permitiendo multiples guardados y nombre propio sin duplicar la estructura semanal.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Crear `saved_routines` con sus campos minimos.
2. Vincularla con el usuario y con `routine_templates`.
3. Permitir `custom_name` como campo opcional de personalizacion.
4. Evitar cualquier duplicacion innecesaria de dias o items en esta etapa.

## Criterios de aceptacion

- `saved_routines` representa la asignacion entre usuario y rutina plantilla.
- La tabla permite varias rutinas por usuario.
- No replica la estructura semanal dentro de la tabla.

## Validacion

- Verificar foreign keys y timestamps.
- Verificar que `custom_name` sea opcional.

## Estado final

Completado.
