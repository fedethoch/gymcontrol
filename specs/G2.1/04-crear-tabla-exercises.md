# Crear tabla `exercises`

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 4  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Implementar `exercises` con el set minimo de datos pactado para sostener admin, catalogo y modal de ejercicio.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Crear la tabla `exercises` con sus columnas minimas.
2. Definir la referencia `created_by` segun el criterio acordado para el MVP.
3. Mantener `image_url` como una referencia simple, sin ampliar storage ni media library.
4. Agregar solo constraints necesarias para integridad basica.

## Criterios de aceptacion

- `exercises` cubre nombre, descripcion, imagen y trazabilidad minima de creacion.
- No se agregan campos accesorios o prematuros.
- La tabla queda lista para ser consumida por admin y vistas de lectura.

## Validacion

- Verificar nombres, tipos y nulabilidad de columnas.
- Verificar consistencia de la referencia `created_by`.

## Estado final

Completado.
