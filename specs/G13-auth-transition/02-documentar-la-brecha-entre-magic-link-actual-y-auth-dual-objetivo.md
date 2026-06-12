# Documentar la brecha entre magic link actual y auth dual objetivo: dejar claro que cambia y que se conserva

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 2  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Comparar el flujo actual de `magic link` con el objetivo `OTP + Google OAuth`, para identificar piezas reutilizables, piezas a retirar y piezas nuevas necesarias.

## Estado

Pendiente.

## Archivos

- `app/auth/`
- `app/lib/auth.ts`
- `app/lib/supabase/`
- `PLAN.md`

## Pasos

1. Identificar las partes actuales dependientes de `magic link`.
2. Identificar las partes que pueden conservarse.
3. Identificar nuevas piezas requeridas para OTP y Google OAuth.
4. Documentar los gaps sin mezclar implementacion prematura.

## Criterios de aceptacion

- La brecha entre estado actual y objetivo queda explicitada.
- Se entiende que debe retirarse y que debe mantenerse.
- El grupo puede avanzar sin ambiguedad sobre la base actual.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que la comparacion no omita callback, middleware, guards ni perfil.
- Verificar que el gap documentado sea suficiente para derivar specs tecnicos.

## Estado final

No iniciado.
