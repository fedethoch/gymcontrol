# Definir estrategia minima de RLS y helper de admin: fijar reglas base antes de escribir policies

**Grupo:** G5.5 - RLS y policies  
**Orden:** 1  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir la estrategia minima de RLS del MVP y el criterio tecnico para reconocer usuarios admin a partir de `profiles.type_rol`.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `PLAN.md`
- SQL o migraciones relacionadas con RLS

## Pasos

1. Revisar el modelo y los actores reales del MVP.
2. Definir como se consultara el rol admin desde policies.
3. Mantener la estrategia corta y entendible.
4. Evitar helpers o abstracciones innecesarias.

## Criterios de aceptacion

- Existe una estrategia minima clara para RLS.
- Queda definido como se reconoce un admin.
- La base sirve para escribir policies sin contradicciones.

## Resolucion

- se mantuvo `profiles.type_rol` como fuente de verdad de autorizacion del MVP
- se definio catalogo publico en lectura y escrituras globales admin-only
- se agregaron helpers internos `private.current_profile_id()` y `private.is_current_user_admin()` para reutilizar criterio de identidad y rol sin recursiones de policy
- se agrego `private.can_update_own_profile(...)` para bloquear cambios de `type_rol` desde clientes

## Validacion

- Verificar consistencia con `docs/DATABASE.md`.
- Verificar que la estrategia cubra `anon`, `authenticated`, `admin` y propietario.

## Estado final

Completado.
