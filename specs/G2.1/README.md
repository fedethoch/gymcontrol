# G2.1 - Implementacion de G2 en Supabase

Este grupo operacionaliza en Supabase lo ya pactado en `docs/DATABASE.md` para el MVP de GymControl.

## Objetivo del grupo

Traducir el acuerdo cerrado de G2 a una implementacion real, simple y verificable dentro del proyecto Supabase, sin expandir alcance ni introducir complejidad prematura.

## Limites del grupo

- no redefinir el modelo pactado en `docs/DATABASE.md`
- no agregar tablas fuera de `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines`
- no implementar RLS en esta tanda
- no crear buckets o reglas de storage
- no cargar seeds
- no agregar politicas de permisos

## Orden recomendado

1. `01-traducir-database-md-a-reglas-sql-concretas.md`
2. `02-definir-utilidades-comunes-minimas-del-esquema.md`
3. `03-crear-tabla-profiles.md`
4. `04-crear-tabla-exercises.md`
5. `05-crear-tablas-routine-templates-y-routine-days.md`
6. `06-crear-tabla-routine-items.md`
7. `07-crear-tabla-saved-routines.md`
8. `08-agregar-constraints-e-indices-minimos-finales.md`
9. `09-generar-migracion-sql-final-de-g2.md`
10. `10-aplicar-migracion-en-supabase-y-verificar-esquema-real.md`
11. `11-sincronizar-documentacion-operativa-de-g2.md`

## Resultado esperado

Tener el esquema de G2 implementado en Supabase, con una migracion versionada, validacion real por MCP y documentacion sincronizada con el estado efectivo.
