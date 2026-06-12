# Verificar consistencia de referencias a ejercicios: asegurar integridad entre rutinas y catalogo de ejercicios

**Grupo:** G7 - Rutinas admin  
**Orden:** 9  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4

## Objetivo

Verificar que las referencias entre filas de rutina y ejercicios existentes sean consistentes, de modo que las rutinas no queden apuntando a datos invalidos.

## Estado

Pendiente.

## Archivos

- persistencia de rutinas y filas
- modelo de ejercicio
- consultas reutilizables
- `PLAN.md`

## Pasos

1. Revisar como se vinculan filas y ejercicios.
2. Probar creacion y lectura de rutinas con ejercicios reales.
3. Detectar referencias rotas, duplicadas o inconsistentes.
4. Ajustar la implementacion si fuera necesario.

## Criterios de aceptacion

- Cada fila de rutina referencia correctamente un ejercicio valido.
- No hay inconsistencias basicas entre rutinas y ejercicios.
- La integridad es suficiente para el MVP.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que catalogo, modal y dashboard puedan resolver el ejercicio referenciado sin problemas.
- Verificar que la consistencia no dependa solo de la interfaz.

## Estado final

No iniciado.
