# Definir utilidades comunes minimas del esquema

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 2  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Fijar las utilidades comunes minimas del esquema para evitar decisiones repetidas o inconsistentes al crear las tablas del MVP.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Definir el criterio para IDs, timestamps y defaults comunes.
2. Confirmar el uso de `gen_random_uuid()` y cualquier extension ya disponible que el esquema necesite.
3. Resolver como se tratara `updated_at` en esta etapa del MVP.
4. Evitar helpers adicionales si no resuelven una necesidad real del esquema.

## Criterios de aceptacion

- Existe un criterio unico para IDs y timestamps.
- Queda resuelto el tratamiento de `updated_at`.
- No se agregan utilidades que no sean necesarias para G2.

## Validacion

- Verificar que las utilidades definidas sean minimas y reutilizables.
- Verificar que no se creen abstracciones innecesarias.

## Estado final

Completado.
