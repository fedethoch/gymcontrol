# Revisar permisos para evitar acciones admin desde no admin: validar la seguridad funcional del MVP

**Grupo:** G11 - Integracion y QA del MVP  
**Orden:** 6  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Revisar que usuarios no admin no puedan acceder a vistas ni ejecutar acciones administrativas dentro del MVP.

## Estado

Pendiente.

## Archivos

- implementacion de autenticacion y roles
- admin dashboard
- acciones administrativas
- `PLAN.md`

## Pasos

1. Probar acceso de visitante y usuario comun a vistas admin.
2. Probar intentos de ejecutar acciones administrativas sin rol.
3. Confirmar bloqueos y respuestas esperadas.
4. Registrar huecos de seguridad funcional si aparecieran.

## Criterios de aceptacion

- Un usuario no admin no puede entrar ni actuar como admin.
- Las protecciones funcionan tanto en UI como en acciones sensibles.
- No hay huecos evidentes de permisos en el MVP.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar acceso permitido solo con `type_rol = "admin"`.
- Verificar que las rutas y acciones queden cubiertas.

## Estado final

No iniciado.
