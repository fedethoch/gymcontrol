# Definir redirecciones segun estado autenticado y rol: ordenar la navegacion de acceso

**Grupo:** G5 - Autenticacion y roles  
**Orden:** 3  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir y aplicar redirecciones basicas segun el estado autenticado del usuario y su rol, para que la experiencia del producto sea coherente y segura.

## Estado

Completado.

## Archivos

- `docs/ARCHITECTURE.md`
- implementacion de autenticacion y rol
- `PLAN.md`

## Pasos

1. Definir que sucede si un visitante intenta acceder a zonas privadas.
2. Definir que sucede si un usuario normal intenta acceder a zonas admin.
3. Definir destinos iniciales coherentes para admin y usuario comun.
4. Aplicar una estrategia de redireccion simple y mantenible.

## Criterios de aceptacion

- Las redirecciones cubren casos principales del MVP.
- La navegacion respeta autenticacion y rol.
- La solucion no introduce reglas complicadas sin necesidad.

## Resolucion

Se aplicaron redirecciones simples y consistentes: visitante a login para rutas privadas, usuario comun de `/admin` a `/dashboard`, y usuario autenticado desde `/auth/login` hacia `/admin` o `/dashboard` segun rol.

## Validacion

- Verificar que los usuarios sean llevados a vistas correctas segun su contexto.
- Verificar que no existan accesos confusos o estados ambiguos.

## Estado final

Completado.
