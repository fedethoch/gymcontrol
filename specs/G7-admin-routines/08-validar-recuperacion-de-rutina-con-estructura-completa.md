# Validar recuperacion de rutina con estructura completa: asegurar lectura coherente de la rutina semanal

**Grupo:** G7 - Rutinas admin  
**Orden:** 8  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4

## Objetivo

Validar que una rutina pueda recuperarse desde la base de datos con toda su estructura completa: rutina, dias y filas.

## Estado

Pendiente.

## Archivos

- consultas de rutinas
- persistencia de rutina, dias y filas
- `docs/DATABASE.md`
- `PLAN.md`

## Pasos

1. Crear o usar rutinas de prueba.
2. Recuperar una rutina completa desde la capa de datos.
3. Verificar que incluya correctamente sus dias y filas.
4. Detectar y corregir inconsistencias si aparecen.

## Criterios de aceptacion

- La rutina puede leerse completa con su estructura semanal.
- No faltan dias ni filas en la recuperacion.
- La lectura queda apta para catalogo y dashboard de usuario.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que las consultas no devuelvan una estructura parcial o desordenada.
- Verificar que el formato recuperado sea util para las siguientes capas.

## Estado final

No iniciado.
