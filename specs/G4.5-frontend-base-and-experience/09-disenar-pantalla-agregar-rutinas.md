# Disenar pantalla agregar rutinas: preparar la vista de exploracion y seleccion del usuario

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 9  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Diseñar la pantalla `Agregar rutinas` como puerta de entrada a todas las rutinas disponibles para el usuario.

## Estado

Completado.

## Archivos

- rutas de `app/catalogo/`
- `docs/ARCHITECTURE.md`
- specs de `G8`

## Pasos

1. Definir estructura principal de la pantalla.
2. Definir como se presentan las rutinas disponibles.
3. Definir el punto de entrada al detalle de rutina.
4. Evitar implementar aun la logica final de guardado.

## Criterios de aceptacion

- La pantalla `Agregar rutinas` queda claramente definida.
- La vista se entiende como catalogo de entrada.
- La base visual sirve luego para G8.

## Resolucion

Se definio la pantalla `Agregar rutinas` en `docs/architecture/07-frontend-experience.md`.

Decision:

- `Agregar rutinas` sera la puerta de entrada al catalogo
- la pantalla tendra encabezado breve, listado principal de rutinas y estado vacio claro
- cada rutina mostrara informacion minima util y una entrada clara al detalle
- la accion dominante sera entrar al detalle de rutina
- el guardado queda preparado, pero no domina esta vista
- la pantalla no debe mezclar rutinas guardadas del usuario ni expandir todo el detalle en el listado inicial

## Validacion

- Verificar que la vista priorice exploracion y claridad.
- Verificar que no se mezcle con `Mis rutinas`.

## Estado final

Completado.
