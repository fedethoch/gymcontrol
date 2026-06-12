# Delimitar alcance final del MVP: confirmar que entra en la primera version y que queda fuera

**Grupo:** G1 - Arquitectura  
**Orden:** 1  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Dejar asentado el alcance funcional exacto del MVP de GymControl y confirmar de forma explicita que funcionalidades quedan fuera de esta primera version.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/WORKING_AGREEMENTS.md`
- `PLAN.md`
- `docs/ARCHITECTURE.md` si ya existe

## Pasos

1. Leer la documentacion base del proyecto.
2. Extraer la lista de funcionalidades obligatorias del MVP.
3. Detectar ambiguedades o puntos que puedan inflar el alcance.
4. Definir una seccion clara de "incluido" y otra de "fuera de alcance".
5. Guardar la definicion final en el documento de arquitectura o en el documento acordado para esta fase.

## Criterios de aceptacion

- El alcance funcional del MVP queda listado de manera clara.
- Se explicita que no formara parte del MVP.
- No quedan mezcladas funcionalidades futuras con funcionalidades obligatorias.
- La definicion respeta la regla de simplicidad del proyecto.

## Resolucion

El alcance del MVP quedo delimitado en `docs/architecture/01-scope.md`, dejando dentro admin, catalogo, dashboard de usuario, auth, rutinas y modal de ejercicio, y dejando fuera progreso, pagos, mensajeria y features avanzadas.

## Validacion

- Verificar que el alcance incluido cubra admin, rutinas, catalogo, dashboard de usuario y modal de ejercicio.
- Verificar que no se agreguen features no pedidas como progreso, pagos o mensajeria.

## Estado final

Completado.
