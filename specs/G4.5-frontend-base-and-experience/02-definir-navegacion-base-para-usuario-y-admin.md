# Definir navegacion base para usuario y admin: ordenar el acceso principal del producto

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 2  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.5

## Objetivo

Definir la navegacion principal del producto para usuario y admin, manteniendo un flujo simple y legible desde el panel lateral izquierdo.

## Estado

Completado.

## Archivos

- `docs/ARCHITECTURE.md`
- `PLAN.md`
- rutas actuales de `app/`

## Pasos

1. Definir las entradas principales visibles para usuario.
2. Definir donde y como aparece la entrada administrativa.
3. Confirmar si la navegacion comparte shell pero cambia opciones segun rol.
4. Evitar duplicar estructuras de menu sin necesidad real.

## Criterios de aceptacion

- La navegacion base de usuario queda clara.
- La entrada admin queda contemplada sin romper simplicidad.
- El flujo puede evolucionar luego con auth y permisos.

## Resolucion

Se definio la navegacion base en `docs/architecture/07-frontend-experience.md`.

Decision:

- la navegacion principal vive en el panel lateral izquierdo
- usuario normal tiene entradas `Agregar rutinas`, `Mis rutinas` y `Ejercicio`
- admin conserva las entradas de usuario y suma `Admin dashboard`
- el area de acceso o sesion vive como zona secundaria del panel
- la visibilidad real por rol se implementara en G5
- la UI puede ocultar entradas, pero las protecciones reales deben vivir fuera de la interfaz
- la seccion activa se determina por la ruta actual y no cambia por abrir el modal de ejercicio

## Validacion

- Verificar que la navegacion no mezcle responsabilidades de usuario y admin.
- Verificar que la estructura ayude a los grupos funcionales siguientes.

## Estado final

Completado.
