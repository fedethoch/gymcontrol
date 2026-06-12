# Disenar pantalla mis rutinas con rutina activa: ordenar la gestion personal del usuario

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 10  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Diseñar la pantalla `Mis rutinas` para mostrar las rutinas guardadas por el usuario y permitir la seleccion de una rutina `activa`.

## Estado

Completado.

## Archivos

- rutas de `app/dashboard/`
- `docs/ARCHITECTURE.md`
- specs de `G9`

## Pasos

1. Definir como se listan las rutinas guardadas.
2. Definir como se representa la rutina activa.
3. Definir accion visual de seleccionar o cambiar rutina activa.
4. Mantener separada la vista personal del catalogo general.

## Criterios de aceptacion

- La pantalla `Mis rutinas` queda claramente diferenciada.
- Existe una base UX para rutina activa.
- La vista queda lista para que G9 implemente logica real.

## Resolucion

Se definio la pantalla `Mis rutinas` en `docs/architecture/07-frontend-experience.md`.

Decision:

- `Mis rutinas` sera la vista personal de rutinas guardadas
- la rutina activa tendra una señal visual principal y estable
- el listado de rutinas guardadas mostrara opciones para activar o gestionar
- la accion dominante sera seleccionar o cambiar la rutina activa
- la pantalla no mezclara catalogo general ni organigrama semanal
- las acciones de renombrado quedan preparadas como soporte y no como foco principal

## Validacion

- Verificar claridad entre rutina guardada y rutina activa.
- Verificar que la vista soporte multiples rutinas sin ruido.

## Estado final

Completado.
