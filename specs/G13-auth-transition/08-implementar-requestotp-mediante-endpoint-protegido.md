# Implementar requestOtp mediante endpoint protegido: desacoplar la solicitud de codigo del magic link actual

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 8  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Crear el endpoint protegido que reciba la solicitud de codigo OTP y dispare el envio via Supabase Auth con validacion de entrada suficiente.

## Estado

Pendiente.

## Archivos

- `app/api/auth/` si se crea
- `app/auth/`
- `app/lib/supabase/`

## Pasos

1. Crear el endpoint para pedir OTP.
2. Validar payload minimo esperado.
3. Invocar `signInWithOtp` sin depender de `emailRedirectTo` como flujo principal.
4. Devolver estados y errores compatibles con la nueva UI.

## Criterios de aceptacion

- Existe un endpoint claro para solicitar OTP.
- El endpoint no depende del flujo de callback por email.
- La respuesta es usable por la UI de login.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que el endpoint dispare envio OTP y no `magic link`.
- Verificar que la salida del endpoint sea suficiente para mostrar feedback de usuario.

## Estado final

No iniciado.
