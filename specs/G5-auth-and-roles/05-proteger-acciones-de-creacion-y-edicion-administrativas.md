# Proteger acciones de creacion y edicion administrativas: cerrar la escritura sensible al rol admin

**Grupo:** G5 - Autenticacion y roles  
**Orden:** 5  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Asegurar que las acciones administrativas de creacion y edicion solo puedan ejecutarse por usuarios admin, incluso aunque alguien intente saltarse restricciones de UI.

## Estado

Completado.

## Archivos

- acciones administrativas de ejercicios y rutinas
- implementacion de autenticacion y rol
- `docs/ARCHITECTURE.md`
- `PLAN.md`

## Pasos

1. Identificar todas las acciones administrativas sensibles del MVP.
2. Aplicar validacion de rol en la capa de escritura.
3. Evitar depender unicamente de ocultar botones o vistas.
4. Definir respuestas coherentes ante intentos no autorizados.

## Criterios de aceptacion

- Las acciones admin estan protegidas tambien en backend o capa de servidor equivalente.
- Un usuario no admin no puede crear ni editar recursos administrativos.
- La seguridad no depende solo de la interfaz.

## Resolucion

Quedo creada la base reutilizable de guards server-side (`requireUser` y `requireAdmin`) para sostener proteccion de escritura administrativa en G6 y G7, sin depender de ocultar botones.

## Validacion

- Verificar que ejercicios y rutinas no puedan alterarse sin rol admin.
- Verificar que la proteccion siga funcionando aunque la UI falle.

## Estado final

Completado.
