# Crear estructura de carpetas pactada: materializar la organizacion tecnica definida

**Grupo:** G4 - Setup tecnico del MVP  
**Orden:** 4  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Crear la estructura de carpetas acordada en la arquitectura para que el proyecto quede organizado antes de implementar funcionalidades reales.

## Estado

Completado.

## Archivos

- estructura del repositorio
- `docs/ARCHITECTURE.md`
- `PLAN.md`

## Pasos

1. Leer la estructura de carpetas definida en arquitectura.
2. Crear directorios base para app, componentes, modulos, datos, validaciones y utilidades segun corresponda.
3. Mantener la estructura lo mas simple posible.
4. Verificar que la organizacion sea coherente con el MVP.

## Criterios de aceptacion

- La estructura de carpetas existe y coincide con la arquitectura pactada.
- La organizacion facilita ubicar responsabilidades.
- No se crean carpetas vacias o conceptuales sin uso probable.

## Resolucion

Se materializo la estructura base dentro de `app/` con carpetas para `admin`, `auth`, `catalogo`, `dashboard`, `components`, `data`, `lib` y `validations`.

Se dejaron subcarpetas alineadas al MVP para ejercicios, rutinas, modales y login, usando archivos `.gitkeep` solo para fijar la estructura hasta que exista codigo real.

## Validacion

- Verificar que admin dashboard, catalogo y dashboard de usuario tengan un lugar claro dentro del repo.
- Verificar que no haya fragmentacion excesiva.

## Estado final

Completado.
