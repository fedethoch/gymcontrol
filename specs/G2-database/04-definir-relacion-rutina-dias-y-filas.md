# Definir relacion entre rutina, dias y filas: estructurar la rutina semanal del MVP

**Grupo:** G2 - Base de datos  
**Orden:** 4  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir la relacion entre rutina, dias de rutina y filas de ejercicios para representar correctamente una rutina semanal con multiples dias.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `PLAN.md`
- resultados de entidades y atributos previos

## Pasos

1. Definir la entidad principal de rutina plantilla.
2. Definir como se representan los dias dentro de una rutina.
3. Definir como se representan las filas de trabajo dentro de cada dia.
4. Confirmar que cada fila incluye ejercicio, series, repeticiones, RIR y descanso.
5. Verificar si la estructura puede simplificarse aun mas sin perder claridad.

## Criterios de aceptacion

- La relacion semanal queda clara y consistente.
- Se soportan multiples dias por rutina.
- Se soportan multiples filas por dia.
- La estructura sigue siendo simple de consultar y mantener.

## Resolucion

Se definio la estructura semanal con `routine_templates`, `routine_days` y `routine_items`, dejando claro que una rutina contiene muchos dias y cada dia muchas filas.

## Validacion

- Verificar que el modelo sirva tanto para crear como para leer rutinas completas.
- Verificar que no existan duplicaciones innecesarias de informacion.

## Estado final

Completado.
