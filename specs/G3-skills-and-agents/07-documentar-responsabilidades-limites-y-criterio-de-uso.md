# Documentar responsabilidades, limites y criterio de uso: dejar cada skill o agente bien acotado

**Grupo:** G3 - Skills y agentes  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Documentar para cada skill o agente aprobado su responsabilidad, sus limites y cuando debe usarse para evitar ambiguedades y solapamientos.

## Estado

Completado.

## Archivos

- resultados previos del grupo G3
- `docs/SKILLS_AND_AGENTS.md` si ya existe
- `PLAN.md`

## Pasos

1. Tomar la lista final de skills y agentes aprobados.
2. Definir para cada uno su proposito concreto.
3. Definir que no debe hacer cada uno.
4. Definir en que escenarios se debe invocar y en cuales no.
5. Ordenar todo en una estructura facil de consultar.

## Criterios de aceptacion

- Cada skill o agente tiene alcance claro.
- Se reducen superposiciones y dudas de uso.
- El documento sirve como referencia practica para futuras ejecuciones.

## Resolucion

Se documentaron responsabilidades, limites y criterio de uso para la estrategia real del proyecto: Codex normal por defecto, skills de sesion cuando agregan valor claro y sin skills locales propias versionadas mientras no exista una necesidad concreta.

## Validacion

- Verificar que alguien pueda decidir rapidamente si usar o no cada skill o agente.
- Verificar que los limites eviten expansiones innecesarias.

## Estado final

Completado.
