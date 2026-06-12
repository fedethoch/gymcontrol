# Documentar lecturas de catalogo del MVP: cerrar que actores pueden consultar el contenido base

**Grupo:** G5.5 - RLS y policies  
**Orden:** 3  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir explicitamente que lecturas de catalogo quedan permitidas en el MVP para `exercises`, `routine_templates`, `routine_days` y `routine_items`.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `PLAN.md`
- SQL o migraciones de policies

## Pasos

1. Revisar que necesita leer el usuario en catalogo y dashboard.
2. Definir si la lectura sera publica o solo autenticada segun el MVP.
3. Dejar la decision documentada antes de escribir las policies finales.

## Criterios de aceptacion

- Queda definido el alcance de lectura del catalogo.
- La decision es compatible con G8 y G9.
- No quedan ambiguedades entre docs y SQL.

## Resolucion

- `exercises`, `routine_templates`, `routine_days` y `routine_items` quedan legibles por `anon` y `authenticated`
- la decision se reflejo en `docs/DATABASE.md`, `PLAN.md` y la migracion de `G5.5`
- no se habilitaron lecturas extra sobre `profiles` ni `saved_routines`

## Validacion

- Verificar que la decision quede reflejada en `docs/DATABASE.md` o documentacion operativa equivalente.
- Verificar que no se habiliten lecturas innecesarias.

## Estado final

Completado.
