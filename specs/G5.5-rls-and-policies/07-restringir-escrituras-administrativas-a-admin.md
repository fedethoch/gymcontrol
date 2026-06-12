# Restringir escrituras administrativas a admin: cerrar la autorizacion de cambios globales

**Grupo:** G5.5 - RLS y policies  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Confirmar que todas las escrituras administrativas globales del MVP queden reservadas a usuarios con `profiles.type_rol = admin`.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- migraciones o SQL de policies
- `PLAN.md`

## Pasos

1. Revisar tablas globales administradas por el staff.
2. Confirmar que inserciones, updates y deletes administrativos exijan rol admin.
3. Evitar huecos entre tabla y tabla.
4. Dejar el criterio reutilizable para G6 y G7.

## Criterios de aceptacion

- Las escrituras administrativas quedan cerradas a admin.
- El criterio es consistente entre ejercicios y rutinas.
- No quedan bypasses por mezcla de policies incompletas.

## Resolucion

- todas las escrituras globales del catalogo quedaron protegidas por `private.is_current_user_admin()`
- el criterio es consistente entre ejercicios, rutinas plantilla, dias e items
- no se abrio gestion de roles desde la app

## Validacion

- Verificar escritura permitida con admin.
- Verificar denegacion con usuario autenticado comun.

## Estado final

Completado.
