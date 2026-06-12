# Implementar verificacion de OTP y creacion de sesion: cerrar el acceso passwordless dentro de la app

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 10  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Implementar la verificacion del codigo OTP y la creacion correcta de sesion SSR para que el usuario quede autenticado sin depender de `magic link`.

## Estado

Pendiente.

## Archivos

- `app/auth/`
- `app/lib/supabase/`
- `app/lib/auth.ts`

## Pasos

1. Verificar el OTP con Supabase.
2. Confirmar que la sesion quede disponible para SSR y guards.
3. Resolver errores por codigo invalido o expirado.
4. Redirigir segun rol al finalizar.

## Criterios de aceptacion

- El OTP inicia sesion real dentro de la app.
- La sesion queda visible para server components y rutas protegidas.
- Los errores de verificacion son tratables por la UI.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar acceso real a dashboard o admin tras OTP valido.
- Verificar rechazo consistente ante OTP invalido o expirado.

## Estado final

No iniciado.
