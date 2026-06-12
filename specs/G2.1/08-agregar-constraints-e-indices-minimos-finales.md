# Agregar constraints e indices minimos finales

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 8  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Completar la integridad del esquema con restricciones e indices minimos necesarios para el MVP, sin sobredisenar la base.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Revisar constraints pendientes entre las tablas creadas.
2. Agregar `unique`, `check` o indices solo donde resuelvan integridad o consultas obvias del MVP.
3. Confirmar que las relaciones y ordenes no queden ambiguos.
4. Evitar optimizaciones avanzadas o indices prematuros.

## Criterios de aceptacion

- El esquema tiene integridad suficiente para el MVP.
- Los indices agregados tienen una justificacion concreta.
- No se agregan piezas de tuning anticipado.

## Validacion

- Verificar que cada constraint e indice tenga una razon clara.
- Verificar que el esquema siga siendo simple de mantener.

## Estado final

Completado.
