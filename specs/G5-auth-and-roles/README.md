# G5 - Auth And Roles

Este grupo implementa la base de autenticacion y autorizacion del MVP sobre Supabase Auth.

## Objetivo del grupo

Permitir acceso autenticado con Supabase Auth, proteger correctamente admin dashboard, dashboard de usuario y acciones sensibles segun `type_rol`, y dejar un bootstrap admin verificable para QA.

## Orden recomendado

1. `01-implementar-autenticacion-base-de-usuario.md`
2. `02-integrar-type-rol-al-flujo-de-acceso-y-sesion.md`
3. `03-definir-redirecciones-segun-estado-y-rol.md`
4. `04-proteger-admin-dashboard-para-rol-admin.md`
5. `05-proteger-acciones-de-creacion-y-edicion-administrativas.md`
6. `06-validar-acceso-normal-al-dashboard-de-usuario.md`
7. `07-probar-escenarios-basicos-de-acceso-permitido-y-denegado.md`
8. `08-ajustar-mensajes-o-ux-minima-ante-accesos-no-permitidos.md`
9. `09-documentar-bootstrap-admin-verificable.md`

## Resultado esperado

Tener una base segura y simple sobre la que puedan apoyarse `G5.5`, `G6`, `G7`, `G8` y `G9`.

## Estado del grupo

Completado con validacion tecnica local. Queda pendiente revalidar el circuito real de email y acceso en `G11`.

## Decision cerrada

- proveedor de auth: Supabase Auth
- integracion web: `@supabase/ssr`
- rol de aplicacion: `profiles.type_rol`
- Better Auth no entra en el MVP salvo cambio arquitectonico explicito
