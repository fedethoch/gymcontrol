# Confirmar fronteras entre agregar rutinas, mis rutinas, ejercicio y admin: evitar mezclar modulos en el frontend

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 4  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Confirmar las fronteras funcionales y visuales entre las secciones `Agregar rutinas`, `Mis rutinas`, `Ejercicio` y `Admin dashboard`.

## Estado

Completado.

## Archivos

- `docs/ARCHITECTURE.md`
- `PLAN.md`
- specs de `G8`, `G9` y `G10`

## Pasos

1. Definir que responsabilidad vive en `Agregar rutinas`.
2. Definir que responsabilidad vive en `Mis rutinas`.
3. Definir que responsabilidad vive en `Ejercicio`.
4. Definir como se separa lo administrativo del flujo de usuario.

## Criterios de aceptacion

- Cada seccion tiene una responsabilidad clara.
- No hay solapamiento innecesario entre modulos.
- La separacion ayuda a implementar despues sin ambiguedad.

## Resolucion

Se confirmaron las fronteras funcionales y visuales en `docs/architecture/07-frontend-experience.md`.

Decision:

- `Agregar rutinas` queda reservado para exploracion del catalogo y entrada al detalle de rutinas disponibles
- `Mis rutinas` queda reservado para rutinas guardadas, rutina activa y gestion personal
- `Ejercicio` queda reservado para la lectura semanal y el detalle diario del entrenamiento activo
- `Admin dashboard` queda reservado para administracion global de rutinas y ejercicios
- ninguna de estas secciones debe absorber responsabilidades principales de otra

La separacion queda fijada para que G8, G9, G10 y la capa admin implementen sus pantallas sin ambiguedad.

## Validacion

- Verificar que las fronteras coincidan con el modelo funcional del MVP.
- Verificar que no se creen vistas redundantes.

## Estado final

Completado.
