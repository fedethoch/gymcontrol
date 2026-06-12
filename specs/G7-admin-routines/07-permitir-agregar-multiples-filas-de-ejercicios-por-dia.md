# Permitir agregar multiples filas de ejercicios por dia: completar la tabla funcional de cada jornada

**Grupo:** G7 - Rutinas admin  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Permitir que cada dia de una rutina contenga multiples filas de ejercicios con sus columnas requeridas dentro de la interfaz administrativa.

## Estado

Pendiente.

## Archivos

- builder de rutinas
- acciones y persistencia de filas
- datos de ejercicios reutilizables
- `PLAN.md`

## Pasos

1. Integrar la carga de filas dentro de cada dia.
2. Permitir seleccionar ejercicio y completar series, repeticiones, RIR y descanso.
3. Permitir multiples filas por dia.
4. Confirmar que el guardado respete la relacion dia -> filas.

## Criterios de aceptacion

- Cada dia admite multiples filas de ejercicios.
- Cada fila contiene los campos requeridos.
- La estructura final queda lista para ser mostrada luego en catalogo y dashboard.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que la UX permita cargar la tabla sin ambiguedad.
- Verificar que los datos se persistan correctamente por dia.

## Estado final

No iniciado.
