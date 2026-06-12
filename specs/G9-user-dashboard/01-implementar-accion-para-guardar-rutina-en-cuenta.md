# Implementar accion para guardar rutina en cuenta: conectar el catalogo con la cuenta del usuario

**Grupo:** G9 - Dashboard de usuario  
**Orden:** 1  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Implementar la accion que permite guardar una rutina del catalogo dentro de la cuenta del usuario autenticado.

## Estado

Pendiente.

## Archivos

- acciones de usuario
- flujo del catalogo
- `docs/DATABASE.md`
- `docs/ARCHITECTURE.md`
- `PLAN.md`

## Pasos

1. Revisar el modelo de relacion entre usuario y rutinas guardadas.
2. Implementar la accion de guardado desde el flujo del catalogo.
3. Asegurar que la accion respete autenticacion y contexto de usuario.
4. Mantener la implementacion simple y coherente con el MVP.

## Criterios de aceptacion

- El usuario autenticado puede guardar una rutina en su cuenta.
- La rutina guardada queda asociada al usuario correcto.
- La accion no duplica logica innecesaria del catalogo o del dashboard.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que la accion solo funcione para usuarios autenticados.
- Verificar que la rutina guardada pueda recuperarse luego desde el dashboard.

## Estado final

No iniciado.
