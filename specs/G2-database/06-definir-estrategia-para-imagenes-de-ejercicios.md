# Definir estrategia para imagenes de ejercicios: resolver almacenamiento o referencia sin complejizar

**Grupo:** G2 - Base de datos  
**Orden:** 6  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir la estrategia mas simple para asociar imagenes a ejercicios dentro del MVP, evitando complejidad innecesaria en base de datos y aplicacion.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `PLAN.md`

## Pasos

1. Revisar el requerimiento de imagen por ejercicio.
2. Evaluar una estrategia simple para guardar una referencia utilizable desde la app.
3. Evitar modelados avanzados de media library si no son necesarios.
4. Documentar la decision y sus limites.

## Criterios de aceptacion

- La estrategia permite mostrar la imagen del ejercicio en admin, catalogo y modal.
- La decision no agrega tablas o sistemas complejos sin necesidad.
- Queda documentado si se usa URL, path o referencia equivalente.

## Resolucion

La estrategia elegida es una sola referencia por ejercicio almacenada en `image_url`, evitando una media library compleja y manteniendo la lectura simple desde admin, catalogo y modal.

## Validacion

- Verificar que la decision sea compatible con el stack actual.
- Verificar que la solucion no complique futuras lecturas o migraciones del MVP.

## Estado final

Completado.
