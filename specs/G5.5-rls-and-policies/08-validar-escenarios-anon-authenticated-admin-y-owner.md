# Validar escenarios anon, authenticated, admin y owner: comprobar el comportamiento real de las policies

**Grupo:** G5.5 - RLS y policies  
**Orden:** 8  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Validar los escenarios criticos de permisos del MVP para asegurar que la capa de policies refleje exactamente el alcance pactado.

## Estado

Implementado localmente; pendiente validacion remota.

## Archivos

- `docs/DATABASE.md`
- migraciones o SQL de policies
- `PLAN.md`

## Pasos

1. Probar lectura como `anon` si aplica al catalogo.
2. Probar lectura y escritura como usuario autenticado comun.
3. Probar capacidades administrativas con un usuario admin.
4. Probar aislamiento por propietario en `saved_routines`.

## Criterios de aceptacion

- Los escenarios criticos quedan comprobados.
- No aparecen permisos mas amplios que los pactados.
- La validacion deja util el camino para G6 a G9.

## Resolucion

- se dejo una consulta estructural prevista para confirmar RLS habilitado y policies instaladas
- se validaron localmente `pnpm lint` y `pnpm build` para descartar regresiones en la app
- la validacion remota via MCP/SQL quedo pendiente porque `supabase_gymcontrol` devolvio timeout incluso en consultas minimas

## Validacion

- Verificar escenarios `anon`, `authenticated`, `admin` y `owner`.
- Registrar cualquier desvio antes de seguir con CRUD real.

## Estado final

Pendiente validacion remota.
