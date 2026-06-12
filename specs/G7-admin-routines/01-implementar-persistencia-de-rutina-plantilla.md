# Implementar persistencia de rutina plantilla: crear acceso a datos sobre `routine_templates`

**Grupo:** G7 - Rutinas admin  
**Orden:** 1  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Implementar la capa de acceso a datos para la rutina plantilla creada por el admin, segun el modelo de datos ya aplicado para el MVP.

## Estado

Pendiente.

## Archivos

- `docs/DATABASE.md`
- `docs/ARCHITECTURE.md`
- configuracion de acceso a datos
- `PLAN.md`

## Pasos

1. Revisar la definicion de rutina plantilla en base de datos.
2. Crear la estructura de acceso a datos necesaria para este recurso.
3. Confirmar que la entidad soporte su rol como contenedor semanal.
4. Mantener el trabajo simple y alineado con el esquema vigente del MVP.

## Criterios de aceptacion

- Existe una persistencia funcional para rutina plantilla sin recrear tablas.
- La entidad sirve como base para dias y filas de ejercicios.
- No se agregan campos o relaciones fuera del alcance del MVP.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que la persistencia coincida con `docs/DATABASE.md`.
- Verificar que la rutina plantilla pueda ser reutilizada luego por catalogo y dashboard de usuario.

## Estado final

No iniciado.
