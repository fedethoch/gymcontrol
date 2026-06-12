# Aplicar migracion en Supabase y verificar esquema real

**Grupo:** G2.1 - Implementacion de G2 en Supabase  
**Orden:** 10  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Aplicar la migracion de G2 en el proyecto Supabase y verificar con evidencia real que el esquema implementado coincide con lo pactado.

## Estado

Completado.

## Archivos

- `supabase/migrations/`
- `docs/DATABASE.md`
- `docs/MCP_SUPABASE_SETUP.md`
- `PLAN.md`

## Pasos

1. Aplicar la migracion usando el alias `supabase_gymcontrol`.
2. Verificar tablas, columnas, relaciones, constraints e indices reales.
3. Confirmar que el estado remoto coincide con el acuerdo de G2.
4. Registrar cualquier diferencia real antes de dar el paso por cerrado.

## Criterios de aceptacion

- La migracion queda aplicada en Supabase.
- El esquema remoto coincide con el diseño pactado.
- La verificacion se hace sobre el proyecto real y no solo sobre el archivo SQL.

## Validacion

- Usar MCP para listar tablas y revisar estructura real.
- Verificar que no falten ni sobren piezas respecto de G2.

## Estado final

Completado.
