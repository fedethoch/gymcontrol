# Revalidar compatibilidad con profiles, bootstrap admin y RLS: confirmar que la transicion auth no rompa el modelo del MVP

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 17  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Confirmar que el nuevo acceso dual no rompe `profiles`, el bootstrap manual de admin ni las policies owner-only y admin-only ya vigentes.

## Estado

Pendiente.

## Archivos

- `docs/DATABASE.md`
- `supabase/migrations/`
- `app/lib/auth.ts`

## Pasos

1. Revalidar el rol de `profiles.type_rol`.
2. Revalidar el bootstrap admin manual.
3. Revalidar compatibilidad con `saved_routines` y policies existentes.
4. Documentar cualquier ajuste operativo requerido.

## Criterios de aceptacion

- La transicion auth no rompe el modelo actual.
- El bootstrap admin sigue siendo reproducible.
- RLS y permisos siguen alineados con el repo.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar compatibilidad con `docs/DATABASE.md`.
- Verificar que no sea necesario redisenar el esquema por este cambio.

## Estado final

No iniciado.
