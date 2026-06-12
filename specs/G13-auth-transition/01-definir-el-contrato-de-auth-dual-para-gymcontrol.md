# Definir el contrato de auth dual para GymControl: fijar el nuevo modelo de acceso del proyecto

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 1  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Cerrar la decision de migrar GymControl desde `magic link` hacia un esquema dual de autenticacion con `OTP por email de 6 digitos` y `Google OAuth`, manteniendo Supabase Auth, sesion SSR y autorizacion sobre `profiles.type_rol`.

## Estado

Pendiente.

## Archivos

- `PLAN.md`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/SKILLS_AND_AGENTS.md`

## Pasos

1. Confirmar el proveedor y la estrategia general de auth.
2. Definir el metodo principal y el metodo alternativo de acceso.
3. Confirmar que `profiles.type_rol` sigue siendo la fuente de verdad de autorizacion.
4. Confirmar que no entran password ni Better Auth.

## Criterios de aceptacion

- El proyecto tiene un contrato claro de auth dual.
- No quedan dudas sobre proveedor, rol, sesion y flujos admitidos.
- La decision queda alineada con la arquitectura futura del repo.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar consistencia con `docs/DATABASE.md`.
- Verificar que no se introduzcan decisiones de auth fuera de Supabase Auth.

## Estado final

No iniciado.
