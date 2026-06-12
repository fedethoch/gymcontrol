# Definir estilo base de tabla de rutina y modal de ejercicio: fijar dos patrones centrales de lectura

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 8  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir el estilo base de la tabla de rutina y del modal de ejercicio, ya que ambos son piezas centrales de la experiencia del usuario.

## Estado

Completado.

## Archivos

- `docs/ARCHITECTURE.md`
- `app/components/`
- specs de `G10`

## Pasos

1. Definir el patron visual de la tabla de rutina.
2. Definir jerarquia y columnas visibles de la tabla.
3. Definir el patron visual del modal de ejercicio.
4. Confirmar tamano, foco y lectura del modal sobre la pagina actual.

## Criterios de aceptacion

- La tabla tiene una base clara para implementacion posterior.
- El modal tiene un patron visual claro y reusable.
- Ambas piezas comparten coherencia con el shell general.

## Resolucion

Se definio el estilo base de tabla de rutina y modal de ejercicio en `docs/architecture/07-frontend-experience.md`.

Decision:

- la tabla de rutina sera compacta, limpia y orientada a lectura inmediata
- las columnas base visibles seran `ejercicio`, `series`, `repeticiones`, `RIR` y `descanso`
- el nombre del ejercicio sera la columna dominante y el resto actuara como soporte tecnico
- el modal de ejercicio sera centrado, grande y enfocado, sin reemplazar la pagina en desktop
- el contenido minimo del modal sera nombre, imagen y descripcion completa
- la relacion entre tabla y modal debe sentirse como ampliar contexto, resolver duda y volver al trabajo

## Validacion

- Verificar claridad de lectura de datos.
- Verificar que el modal resuelva dudas sin sacar al usuario de contexto.

## Estado final

Completado.
