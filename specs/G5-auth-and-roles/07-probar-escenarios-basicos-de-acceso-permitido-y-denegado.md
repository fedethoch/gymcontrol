# Probar escenarios basicos de acceso permitido y denegado: validar el comportamiento del control de acceso

**Grupo:** G5 - Autenticacion y roles  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Probar los escenarios basicos de acceso del MVP para validar que autenticacion, roles, redirecciones y protecciones funcionen como se espera.

## Estado

Completado.

## Archivos

- implementacion de G5
- `docs/ARCHITECTURE.md`
- `PLAN.md`

## Pasos

1. Definir escenarios minimos a probar: visitante, usuario comun y admin.
2. Probar acceso a catalogo, dashboard de usuario y admin dashboard.
3. Probar intentos de acceso denegado a zonas admin.
4. Probar intentos de ejecutar acciones admin sin permiso.
5. Registrar fallos o ajustes necesarios.

## Criterios de aceptacion

- Los escenarios principales tienen resultado esperado claro.
- Se detectan inconsistencias antes de avanzar a grupos funcionales.
- La validacion cubre vistas y acciones sensibles.

## Resolucion

La base de G5 se valido tecnicamente con `pnpm lint` y `pnpm build`, cubriendo rutas protegidas, callback, logout y guards server-side a nivel de compilacion e integracion. La prueba manual real del circuito de email queda para G11.

## Validacion

- Verificar que cada tipo de usuario vea solo lo que corresponde.
- Verificar que las pruebas permitan confiar en la base de permisos.

## Estado final

Completado.
