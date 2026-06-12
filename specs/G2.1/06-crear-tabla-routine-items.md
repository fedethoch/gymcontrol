# Crear tabla `routine_items`

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 6  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Implementar `routine_items` como las filas funcionales de cada dia de rutina, vinculadas a ejercicios y con orden propio.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `PLAN.md`

## Pasos

1. Crear la tabla `routine_items` con las columnas funcionales del MVP.
2. Vincularla correctamente con `routine_days` y `exercises`.
3. Definir el criterio de orden con `row_order`.
4. Mantener el esquema limitado a series, repeticiones, RIR y descanso, sin campos extra.

## Criterios de aceptacion

- `routine_items` representa una fila real de trabajo dentro de un dia.
- La tabla tiene referencias correctas a dia y ejercicio.
- No se agregan atributos de seguimiento o historial.

## Validacion

- Verificar foreign keys y columnas funcionales.
- Verificar que la estructura soporte multiples filas por dia.

## Estado final

Completado.
