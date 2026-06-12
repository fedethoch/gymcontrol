# Documentar flujo usuario para explorar, elegir, guardar y renombrar rutinas: describir el recorrido principal del usuario

**Grupo:** G1 - Arquitectura  
**Orden:** 6  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Describir el flujo principal del usuario desde la exploracion del catalogo hasta el guardado de una o varias rutinas y su posterior renombrado en dashboard.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `docs/DATABASE.md` si ya existe
- `PLAN.md`

## Pasos

1. Describir como el usuario descubre rutinas en el catalogo.
2. Describir como accede al detalle de una rutina.
3. Describir la accion de guardar rutina en su cuenta.
4. Describir la posibilidad de guardar varias rutinas.
5. Describir como asigna o edita nombres propios desde su dashboard.
6. Registrar el flujo completo en la documentacion de arquitectura.

## Criterios de aceptacion

- El flujo cubre exploracion, seleccion, guardado y renombrado.
- Queda claro que un usuario puede tener mas de una rutina.
- Se diferencia bien la rutina plantilla de la rutina guardada por usuario.

## Resolucion

El flujo de usuario para explorar, guardar y luego gestionar rutinas quedo documentado en `docs/architecture/03-flows.md` y conecta catalogo, dashboard y rutina activa.

## Validacion

- Verificar que el flujo sea coherente con el modelo de datos pensado.
- Verificar que la experiencia no dependa de funcionalidad fuera de alcance.

## Estado final

Completado.
