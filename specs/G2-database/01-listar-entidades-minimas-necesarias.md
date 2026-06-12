# Listar entidades minimas necesarias: identificar las piezas de datos indispensables del MVP

**Grupo:** G2 - Base de datos  
**Orden:** 1  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir el conjunto minimo de entidades necesarias para soportar el MVP de GymControl sin introducir tablas o conceptos prematuros.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/WORKING_AGREEMENTS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `PLAN.md`

## Pasos

1. Leer el alcance funcional y la arquitectura disponible.
2. Identificar las entidades estrictamente necesarias para cubrir usuarios, ejercicios, rutinas y asignaciones.
3. Descartar entidades futuras que no aporten al MVP.
4. Dejar una lista corta y justificada de entidades base.

## Criterios de aceptacion

- Existe una lista clara de entidades minimas.
- Cada entidad responde a una necesidad real del MVP.
- No se agregan tablas de analytics, progreso, pagos ni otras funciones fuera de alcance.

## Resolucion

Se definio el conjunto minimo de entidades necesarias para el MVP en `docs/DATABASE.md`.

## Validacion

- Verificar que la lista cubra admin, catalogo, dashboard de usuario y modal de ejercicio.
- Verificar que el modelo siga siendo simple de entender.

## Estado final

Completado.
