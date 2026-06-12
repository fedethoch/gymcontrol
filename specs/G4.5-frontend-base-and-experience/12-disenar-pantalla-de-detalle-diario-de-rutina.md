# Disenar pantalla de detalle diario de rutina: enfocar la consulta del entrenamiento del dia

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 12  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Diseñar la pantalla de detalle diario de rutina para mostrar solo el entrenamiento correspondiente del dia seleccionado, con tabla clara y boton de volver.

## Estado

Completado.

## Archivos

- rutas del modulo de usuario
- `docs/ARCHITECTURE.md`
- specs de `G8`, `G9` y `G10`

## Pasos

1. Definir estructura de la pantalla diaria.
2. Definir ubicacion y comportamiento del boton de volver.
3. Definir como se presenta la tabla de ejercicios.
4. Confirmar que la vista se enfoque en lectura del entrenamiento del dia.

## Criterios de aceptacion

- La pantalla diaria queda definida con claridad.
- La tabla se entiende como foco principal.
- El retorno a la vista anterior queda contemplado.

## Resolucion

Se definio la pantalla `Detalle diario de rutina` en `docs/architecture/07-frontend-experience.md`.

Decision:

- la vista mostrara solo el entrenamiento del dia seleccionado
- el boton de volver sera visible y devolvera a `Ejercicio`
- la tabla de ejercicios sera el bloque dominante de la pantalla
- la pantalla tendra menos ruido que `Ejercicio` y mas foco de lectura
- no mezclara otros dias de la semana ni bloques ajenos al entrenamiento del dia

## Validacion

- Verificar que la vista elimine ruido innecesario.
- Verificar que la experiencia preserve contexto al volver.

## Estado final

Completado.
