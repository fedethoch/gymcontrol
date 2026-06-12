# Traducir `docs/DATABASE.md` a reglas SQL concretas

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 1  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Convertir el acuerdo funcional de `docs/DATABASE.md` en decisiones SQL concretas, sin cambiar el alcance ni agregar complejidad fuera del MVP.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `docs/MCP_SUPABASE_SETUP.md`
- `PLAN.md`

## Pasos

1. Leer `docs/DATABASE.md` como fuente de verdad del esquema.
2. Traducir cada entidad a decisiones concretas de columnas, tipos, `nullability`, `default`, `foreign keys`, `unique` y `check`.
3. Detectar cualquier ambiguedad tecnica que deba resolverse antes de escribir la migracion.
4. Dejar asentado el criterio resultante en la documentacion que corresponda si cambia el nivel de detalle necesario.

## Criterios de aceptacion

- Cada tabla pactada en G2 tiene una traduccion SQL coherente.
- No se agregan tablas ni campos fuera del acuerdo del MVP.
- Quedan definidos los puntos tecnicos necesarios para pasar a migracion.

## Validacion

- Verificar que toda decision SQL salga de `docs/DATABASE.md`.
- Verificar que no se introduzcan conceptos como RLS, storage o seeds.

## Estado final

Completado.
