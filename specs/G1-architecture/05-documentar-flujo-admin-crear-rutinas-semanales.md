# Documentar flujo admin para crear rutinas semanales: describir dias, filas y estructura de trabajo

**Grupo:** G1 - Arquitectura  
**Orden:** 5  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir el flujo funcional y tecnico para que un admin cree rutinas semanales compuestas por multiples dias y por filas de ejercicios con sus columnas requeridas.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `docs/DATABASE.md` si ya existe
- `PLAN.md`

## Pasos

1. Definir el punto de entrada del admin al creador de rutinas.
2. Describir la estructura de una rutina semanal.
3. Describir como se agregan dias dentro de la rutina.
4. Describir como se agregan filas de ejercicios dentro de cada dia.
5. Confirmar las columnas obligatorias: ejercicio, series, repeticiones, RIR y descanso.
6. Registrar el flujo en la arquitectura del proyecto.

## Criterios de aceptacion

- El flujo semanal queda descripto de punta a punta.
- Se refleja que una rutina contiene multiples dias.
- Se refleja que cada dia contiene multiples filas de ejercicios.
- No quedan dudas sobre la estructura minima a implementar.

## Resolucion

El flujo admin para crear rutinas semanales con multiples dias quedo documentado en `docs/architecture/03-flows.md` como base funcional para G7.

## Validacion

- Verificar que el flujo sea compatible con un builder simple y escalable.
- Verificar que el modelo no asuma complejidades innecesarias para el MVP.

## Estado final

Completado.
