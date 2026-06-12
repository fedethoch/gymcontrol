# Definir el flujo alternativo de Google OAuth: agregar un segundo acceso sin romper la estrategia principal

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 4  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir el flujo alternativo de autenticacion con Google OAuth, incluyendo boton de acceso, callback, fallos y redireccion final.

## Estado

Pendiente.

## Archivos

- `app/auth/`
- `docs/architecture/03-flows.md`
- `PLAN.md`

## Pasos

1. Definir el punto de entrada visual para Google.
2. Definir el callback y el intercambio de sesion.
3. Definir que ocurre ante cancelacion o error.
4. Definir convergencia final con perfil y redireccion por rol.

## Criterios de aceptacion

- El flujo de Google queda claramente definido.
- No compite ni contradice al flujo OTP.
- Su cierre de sesion y redireccion es coherente con el resto de auth.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que Google OAuth termine en la misma capa de sesion y perfil.
- Verificar que el callback quede cubierto documentalmente.

## Estado final

No iniciado.
