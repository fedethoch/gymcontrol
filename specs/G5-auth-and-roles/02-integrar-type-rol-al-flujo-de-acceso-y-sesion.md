# Integrar type_rol al flujo de acceso y sesion: distinguir admin de usuario normal

**Grupo:** G5 - Autenticacion y roles  
**Orden:** 2  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Integrar `type_rol` en el flujo de acceso y sesion para que la aplicacion pueda reconocer si el usuario autenticado es admin o usuario normal.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `docs/ARCHITECTURE.md`
- implementacion de autenticacion base
- `PLAN.md`

## Pasos

1. Revisar la representacion de `type_rol` en base de datos.
2. Integrar ese dato en el flujo de autenticacion.
3. Hacer que el estado de sesion exponga el rol necesario para autorizacion.
4. Confirmar que la aplicacion pueda resolver el rol actual sin ambiguedad.

## Criterios de aceptacion

- `type_rol` queda disponible durante el flujo autenticado.
- La app puede distinguir claramente admin de usuario comun.
- La integracion no agrega un sistema de permisos innecesariamente complejo.

## Resolucion

El flujo autenticado ahora resuelve `profiles.type_rol` desde servidor y expone el rol como parte del contexto de auth usado por layout, navegacion y guards.

## Validacion

- Verificar que el rol viaje correctamente en la sesion o contexto equivalente.
- Verificar que quede listo para proteger vistas y acciones.

## Estado final

Completado.
