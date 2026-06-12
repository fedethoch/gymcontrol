# Definir responsabilidades y fronteras: separar UI, logica y persistencia sin sobreingenieria

**Grupo:** G1 - Arquitectura  
**Orden:** 3  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir como se reparten las responsabilidades entre vistas, componentes, logica de aplicacion y persistencia para evitar mezcla de capas y mantener la implementacion simple.

## Estado

Completado.

## Archivos

- `docs/ARCHITECTURE.md` si ya existe
- `docs/WORKING_AGREEMENTS.md`
- `PLAN.md`

## Pasos

1. Identificar las capas minimas necesarias para el MVP.
2. Decidir que responsabilidades viven en UI, que responsabilidades viven en acciones o servicios y cuales en la base de datos.
3. Evitar introducir patrones avanzados que no aporten valor real al MVP.
4. Redactar fronteras claras entre lectura, escritura, validacion y renderizado.
5. Guardar estas reglas en el documento de arquitectura.

## Criterios de aceptacion

- Queda claro donde debe vivir cada tipo de logica.
- Se reduce el riesgo de duplicacion o mezcla de responsabilidades.
- La estructura propuesta sigue siendo simple de mantener.

## Resolucion

Las responsabilidades y fronteras entre UI, acciones, acceso a datos y documentos fuente quedaron fijadas en `docs/architecture/04-layers-and-boundaries.md`.

## Validacion

- Verificar que un nuevo paso tecnico pueda decidir rapidamente donde implementar algo.
- Verificar que las fronteras ayuden a proteger codigo admin y codigo de usuario.

## Estado final

Completado.
