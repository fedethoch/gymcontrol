# Definir el flujo OTP por email de 6 digitos: cerrar la experiencia passwordless principal

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 3  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir el flujo principal de acceso por codigo OTP de 6 digitos enviado por email, incluyendo solicitud, verificacion, reenvio y cambio de email.

## Estado

Pendiente.

## Archivos

- `docs/architecture/03-flows.md`
- `app/auth/`
- `PLAN.md`

## Pasos

1. Definir el paso de solicitud de codigo.
2. Definir el paso de ingreso y verificacion del codigo.
3. Definir reenvio y cambio de email.
4. Definir errores y estados minimos del flujo.

## Criterios de aceptacion

- El flujo OTP queda definido de punta a punta.
- Se entiende donde empieza y termina la sesion.
- El flujo es compatible con el resto del producto.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que el flujo no dependa de `magic link`.
- Verificar que el flujo contemple expiracion e invalidez del codigo.

## Estado final

No iniciado.
