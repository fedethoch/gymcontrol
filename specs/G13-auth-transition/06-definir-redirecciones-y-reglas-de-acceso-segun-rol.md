# Definir redirecciones y reglas de acceso segun rol: mantener una navegacion segura durante la transicion auth

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 6  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir las redirecciones y reglas de acceso necesarias para que OTP y Google terminen en una experiencia coherente segun autenticacion y rol.

## Estado

Pendiente.

## Archivos

- `app/lib/auth.ts`
- `app/auth/`
- `docs/architecture/03-flows.md`

## Pasos

1. Definir comportamiento de visitante hacia rutas privadas.
2. Definir comportamiento de usuario no admin en rutas admin.
3. Definir destinos post-login para `admin` y `user`.
4. Definir comportamiento de usuario autenticado al entrar a login.

## Criterios de aceptacion

- Las reglas cubren OTP y Google.
- No hay redirecciones ambiguas.
- La experiencia sigue siendo simple y mantenible.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar consistencia con el rol de `profiles`.
- Verificar que login y logout respeten destinos coherentes.

## Estado final

No iniciado.
