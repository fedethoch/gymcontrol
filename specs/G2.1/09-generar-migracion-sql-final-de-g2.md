# Generar migracion SQL final de G2

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 9  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Consolidar en una migracion versionada el esquema pactado y ya traducido a SQL para el MVP de GymControl.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Redactar la migracion SQL final de G2.
2. Consolidar en ella las tablas, relaciones, constraints e indices minimos definidos en los pasos anteriores.
3. Verificar legibilidad y consistencia del archivo antes de aplicarlo.
4. Mantener la migracion acotada al alcance exacto de G2.

## Criterios de aceptacion

- Existe una migracion versionada para implementar G2.
- La migracion refleja exactamente lo pactado y decidido en los pasos previos.
- No hay SQL accesorio fuera del alcance del esquema MVP.

## Validacion

- Verificar que la migracion cubra las 6 tablas pactadas.
- Verificar que el archivo pueda ser usado como referencia unica de implementacion de G2.

## Estado final

Completado.
