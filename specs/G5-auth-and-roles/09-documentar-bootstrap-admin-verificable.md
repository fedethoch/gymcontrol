# Documentar bootstrap admin verificable: asegurar una cuenta admin util para QA del MVP

**Grupo:** G5 - Autenticacion y roles  
**Orden:** 9  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Dejar documentado y verificable el bootstrap minimo de al menos un usuario admin para poder validar auth, RLS y flujos administrativos sin seeds permanentes.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `PLAN.md`
- documentacion operativa de auth o Supabase si aplica

## Pasos

1. Definir como se promociona o crea el primer usuario admin.
2. Evitar introducir seeds permanentes si todavia no hacen falta.
3. Dejar el procedimiento listo para QA manual o validacion por MCP.
4. Confirmar que el usuario admin resultante sea verificable.

## Criterios de aceptacion

- Existe un procedimiento corto para disponer de un admin real.
- El procedimiento no obliga a introducir complejidad permanente.
- Queda claro como reutilizarlo en G5.5, G6, G7 y G11.

## Resolucion

El bootstrap admin quedo documentado en `docs/DATABASE.md`: ingresar una cuenta por magic link, verificar creacion automatica de `profiles`, promocionar manualmente `type_rol = 'admin'` en Supabase o MCP y volver a entrar para validar la experiencia admin.

## Validacion

- Verificar que exista al menos una cuenta admin comprobable.
- Verificar que el procedimiento quede documentado y sea reproducible.

## Estado final

Completado.
