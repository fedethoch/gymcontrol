# Definir como convergen sesion y perfil entre OTP y Google: evitar dos modelos de usuario dentro de GymControl

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 5  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir como ambos metodos de login terminan en el mismo `auth user` y el mismo `profile`, sin crear una segunda tabla de usuario ni romper `type_rol`.

## Estado

Pendiente.

## Archivos

- `docs/DATABASE.md`
- `app/lib/auth.ts`
- `app/auth/`

## Pasos

1. Confirmar la relacion entre `auth.users` y `profiles`.
2. Definir el comportamiento esperado si un mismo email entra por OTP y Google.
3. Confirmar si el trigger de `profiles` cubre ambos casos.
4. Evitar duplicacion de identidad o de perfil.

## Criterios de aceptacion

- Los dos flujos convergen en un solo modelo de usuario.
- No se requieren tablas nuevas de perfil.
- El rol sigue resolviendose desde `profiles.type_rol`.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar consistencia con `docs/DATABASE.md`.
- Verificar que no aparezcan flujos de sync innecesarios por anticipacion.

## Estado final

No iniciado.
