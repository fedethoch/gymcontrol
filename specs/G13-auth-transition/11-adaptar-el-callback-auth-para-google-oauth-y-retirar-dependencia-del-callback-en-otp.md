# Adaptar el callback auth para Google OAuth y retirar dependencia del callback en OTP: separar correctamente ambos flujos

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 11  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Mantener un callback activo para Google OAuth, pero retirar del flujo OTP la dependencia del callback como paso principal de autenticacion.

## Estado

Pendiente.

## Archivos

- `app/auth/callback/route.ts`
- `app/auth/`
- `app/lib/supabase/server.ts`

## Pasos

1. Confirmar responsabilidad final del callback.
2. Mantener el exchange de sesion necesario para Google.
3. Quitar del flujo OTP la dependencia del callback por link.
4. Preservar compatibilidad con redirecciones y cookies de sesion.

## Criterios de aceptacion

- El callback sigue resolviendo Google OAuth.
- OTP ya no depende de abrir links del email.
- La sesion no se pierde por cambios en callback.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que Google pueda completar sesion con callback.
- Verificar que OTP no requiera callback para cerrar el login.

## Estado final

No iniciado.
