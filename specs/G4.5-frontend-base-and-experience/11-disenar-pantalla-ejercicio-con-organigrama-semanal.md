# Disenar pantalla ejercicio con organigrama semanal: traducir la rutina activa a lectura por dias

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 11  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Diseñar la pantalla `Ejercicio` para mostrar un organigrama semanal donde cada dia indique entrenamiento correspondiente o descanso, segun la rutina activa.

## Estado

Completado.

## Archivos

- rutas de `app/dashboard/` o modulo equivalente
- `docs/ARCHITECTURE.md`
- specs de `G9` y `G10`

## Pasos

1. Definir la estructura semanal por dias.
2. Definir como se representa un dia de entrenamiento.
3. Definir como se representa un dia de descanso.
4. Definir la interaccion para entrar al detalle de un dia de entrenamiento.

## Criterios de aceptacion

- Existe un patron claro para el organigrama semanal.
- Los dias de entrenamiento y descanso se distinguen con claridad.
- La base queda lista para implementacion posterior.

## Resolucion

Se definio la pantalla `Ejercicio` en `docs/architecture/07-frontend-experience.md`.

Decision:

- `Ejercicio` sera la vista semanal de la rutina activa
- mostrara los siete dias de la semana como organigrama claro y escaneable
- cada dia indicara entrenamiento asignado o descanso
- los dias de entrenamiento mostraran una entrada clara al detalle diario
- los dias de descanso no abriran una vista nueva
- la pantalla no mezclara gestion de rutinas guardadas ni la tabla completa de todos los dias

## Validacion

- Verificar que la lectura semanal sea inmediata.
- Verificar que el organigrama no dependa aun de logica compleja.

## Estado final

Completado.
