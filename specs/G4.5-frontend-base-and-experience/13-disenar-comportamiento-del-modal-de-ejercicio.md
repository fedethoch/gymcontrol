# Disenar comportamiento del modal de ejercicio: resolver consulta contextual sin abandonar la rutina

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 13  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Diseñar el comportamiento del modal de ejercicio para que se abra superpuesto, centrado, grande y con informacion suficiente sin ocupar toda la pantalla.

## Estado

Completado.

## Archivos

- specs de `G10`
- `docs/ARCHITECTURE.md`
- componentes de `app/components/modals/`

## Pasos

1. Definir apertura del modal desde la tabla.
2. Definir tamano, foco y jerarquia del contenido.
3. Definir cierre y retorno al contexto previo.
4. Confirmar que el modal sirva para despejar dudas del ejercicio.

## Criterios de aceptacion

- El modal tiene un comportamiento claro y centrado.
- La experiencia mantiene el contexto de la pagina original.
- La base sirve luego para implementacion reusable.

## Resolucion

Se definio el comportamiento del modal de ejercicio en `docs/architecture/07-frontend-experience.md`.

Decision:

- el modal se abrira desde una fila o nombre de ejercicio dentro de la rutina
- aparecera centrado, grande y superpuesto a la pagina actual
- tomara el foco de lectura sin cambiar la ruta principal ni la seccion activa
- mostrara nombre, imagen y descripcion completa del ejercicio
- tendra cierre claro y devolvera al usuario exactamente al contexto previo
- no debe sentirse como pagina encubierta ni romper el flujo de consulta

## Validacion

- Verificar lectura completa del ejercicio.
- Verificar que el modal no se convierta en pagina completa encubierta.

## Estado final

Completado.
