# Crear tabla `profiles`

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 3  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Implementar `profiles` como la capa de datos de aplicacion asociada a `auth.users`, incluyendo el rol simple pactado para el MVP.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Crear la tabla `profiles` con los campos minimos pactados.
2. Vincularla correctamente con `auth.users`.
3. Definir `type_rol` con los valores permitidos `admin` y `user`.
4. Agregar solo las restricciones necesarias para integridad y consistencia minima.

## Criterios de aceptacion

- `profiles` existe con `user_id`, `type_rol`, `created_at` y `updated_at`.
- La relacion con `auth.users` es consistente.
- `type_rol` no permite valores fuera de `admin` y `user`.

## Validacion

- Verificar claves, restricciones y defaults.
- Verificar que la tabla siga el acuerdo de simplicidad del MVP.

## Estado final

Completado.
