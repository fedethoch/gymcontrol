# Documentar flujo de apertura del detalle emergente de ejercicio: definir la interaccion sin abandonar la pagina

**Grupo:** G1 - Arquitectura  
**Orden:** 7  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir la interaccion esperada cuando el usuario hace click en un ejercicio y se abre una card emergente con su detalle sin salir de la vista actual.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `PLAN.md`

## Pasos

1. Identificar todas las vistas del MVP donde aparece un ejercicio clickeable.
2. Definir el comportamiento de apertura del emergente.
3. Definir el contenido minimo de la card emergente.
4. Definir el comportamiento de cierre sin perder contexto de pagina.
5. Registrar este flujo en arquitectura.

## Criterios de aceptacion

- El flujo deja claro que el detalle no reemplaza la pagina actual.
- El contenido minimo incluye nombre, imagen y descripcion.
- El patron puede reutilizarse en catalogo, dashboard y otras vistas del MVP.

## Resolucion

El flujo de apertura y retorno del modal de ejercicio quedo documentado en `docs/architecture/03-flows.md` como patron transversal del MVP.

## Validacion

- Verificar que el flujo sea consistente en todas las vistas donde aparezca un ejercicio.
- Verificar que no dependa de navegacion compleja ni rutas innecesarias.

## Estado final

Completado.
