# Definir mapa real de vistas y transiciones: dejar explicito como se recorre el frontend

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 3  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.5

## Objetivo

Definir que vistas existen realmente en el frontend del MVP y como se transiciona entre ellas desde navegacion, seleccion de rutina, detalle diario y modal de ejercicio.

## Estado

Completado.

## Archivos

- `docs/ARCHITECTURE.md`
- `PLAN.md`
- grupo `specs/G4.5-frontend-base-and-experience/`

## Pasos

1. Enumerar las vistas reales del flujo de usuario.
2. Enumerar las vistas reales del flujo admin.
3. Definir transiciones entre vistas.
4. Distinguir navegacion de pagina, retorno y modal superpuesto.

## Criterios de aceptacion

- Existe un mapa claro de vistas del MVP.
- Las transiciones principales quedan definidas.
- No se mezclan modales con navegacion profunda sin justificacion.

## Resolucion

Se definio el mapa real de vistas y transiciones en `docs/architecture/07-frontend-experience.md`.

Decision:

- el flujo de usuario queda compuesto por `Agregar rutinas`, `Detalle de rutina disponible`, `Mis rutinas`, `Ejercicio`, `Detalle diario de rutina` y `Modal de ejercicio`
- el flujo admin queda compuesto por `Admin dashboard`, `Gestion de rutinas`, `Crear rutina`, `Modificar rutina`, `Gestion de ejercicios`, `Agregar ejercicio` y `Modificar ejercicio`
- el panel lateral dispara navegacion principal y actualiza la seccion activa
- las transiciones internas de detalle, listado o formulario son navegacion secundaria y mantienen activa la seccion principal
- los retornos deben volver al contexto funcional anterior
- el modal de ejercicio no cambia ruta principal ni seccion activa

## Validacion

- Verificar que el mapa refleje fielmente la experiencia deseada.
- Verificar que sirva como base para implementar rutas reales despues.

## Estado final

Completado.
