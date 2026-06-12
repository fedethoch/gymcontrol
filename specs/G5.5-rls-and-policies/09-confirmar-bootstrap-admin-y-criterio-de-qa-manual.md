# Confirmar bootstrap admin y criterio de QA manual: cerrar la operativa minima para validar permisos

**Grupo:** G5.5 - RLS y policies  
**Orden:** 9  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Confirmar que existe un admin verificable y dejar claro como se valida manualmente la seguridad hasta que el proyecto necesite seeds o automatizacion adicional.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- `PLAN.md`
- documentacion operativa relacionada con Supabase

## Pasos

1. Confirmar disponibilidad de un usuario admin real.
2. Referenciar el bootstrap definido en G5.
3. Dejar claro como se ejecuta la QA manual minima de permisos.
4. Evitar institucionalizar seeds permanentes sin necesidad real.

## Criterios de aceptacion

- Existe admin verificable para las pruebas.
- El criterio de QA manual queda documentado.
- El cierre operativo de seguridad no depende de supuestos tacitos.

## Resolucion

- el bootstrap admin sigue siendo manual via Supabase o MCP
- la promocion continua documentada como `update public.profiles set type_rol = 'admin' where user_id = '<auth_user_id>'`
- no se agregaron seeds permanentes ni UI de roles en esta etapa

## Validacion

- Verificar que el bootstrap admin sea reproducible.
- Verificar que la QA manual minima quede explicitada.

## Estado final

Completado.
