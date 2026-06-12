# Aplicar policies para catalogo base: cubrir exercises, routine_templates, routine_days y routine_items

**Grupo:** G5.5 - RLS y policies  
**Orden:** 5  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Aplicar las policies minimas para el catalogo base del MVP, cubriendo lectura del contenido y escrituras administrativas.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- migraciones o SQL de policies
- `PLAN.md`

## Pasos

1. Aplicar policies de lectura segun la decision de catalogo cerrada en el paso previo.
2. Cubrir `exercises`.
3. Cubrir `routine_templates`, `routine_days` y `routine_items`.
4. Mantener escrituras reservadas a administracion.

## Criterios de aceptacion

- El catalogo queda legible para los actores permitidos.
- Las escrituras globales quedan restringidas a admin.
- No quedan tablas del catalogo con politicas inconsistentes entre si.

## Resolucion

- el catalogo base quedo publico en lectura para `anon` y `authenticated`
- `insert`, `update` y `delete` en `exercises`, `routine_templates`, `routine_days` y `routine_items` quedaron reservados a `admin`
- `exercises.created_by` y `routine_templates.created_by` se validan contra el perfil actual del admin al insertar

## Validacion

- Verificar lectura permitida del catalogo.
- Verificar denegacion de escritura para usuarios sin rol admin.

## Estado final

Completado.
