# Refactorizar la capa auth y guards sin romper roles: mantener un unico punto de verdad para acceso y autorizacion

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 13  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Adaptar la capa auth del repo para soportar OTP y Google sin romper `getOptionalAuthContext`, `requireUser`, `requireAdmin` ni la resolucion actual de rol.

## Estado

Pendiente.

## Archivos

- `app/lib/auth.ts`
- `app/dashboard/`
- `app/admin/`

## Pasos

1. Revisar como se obtiene el usuario autenticado.
2. Ajustar la capa auth para el nuevo flujo dual.
3. Confirmar que `requireUser` y `requireAdmin` siguen siendo suficientes.
4. Evitar duplicar logica de acceso en rutas o acciones.

## Criterios de aceptacion

- La capa auth sigue centralizada.
- Los guards siguen funcionando sobre `profiles.type_rol`.
- La migracion de login no desordena el resto del repo.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar compatibilidad con rutas privadas y acciones admin.
- Verificar que la capa siga siendo simple y legible.

## Estado final

No iniciado.
