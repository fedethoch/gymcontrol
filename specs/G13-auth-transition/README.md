# G13 - Auth Transition

Este grupo planifica y ejecuta la transicion del acceso actual por `magic link` hacia una autenticacion dual basada en Supabase Auth.

## Objetivo del grupo

Implementar `OTP por email de 6 digitos` como flujo principal y `Google OAuth` como flujo alternativo, manteniendo sesion SSR, `profiles.type_rol`, guards server-side y bootstrap admin existentes.

## Orden recomendado

1. `01-definir-el-contrato-de-auth-dual-para-gymcontrol.md`
2. `02-documentar-la-brecha-entre-magic-link-actual-y-auth-dual-objetivo.md`
3. `03-definir-el-flujo-otp-por-email-de-6-digitos.md`
4. `04-definir-el-flujo-alternativo-de-google-oauth.md`
5. `05-definir-como-convergen-sesion-y-perfil-entre-otp-y-google.md`
6. `06-definir-redirecciones-y-reglas-de-acceso-segun-rol.md`
7. `07-disenar-la-nueva-pantalla-de-auth-dual.md`
8. `08-implementar-requestotp-mediante-endpoint-protegido.md`
9. `09-agregar-rate-limit-minimo-para-solicitud-de-otp.md`
10. `10-implementar-verificacion-de-otp-y-creacion-de-sesion.md`
11. `11-adaptar-el-callback-auth-para-google-oauth-y-retirar-dependencia-del-callback-en-otp.md`
12. `12-confirmar-si-el-trigger-actual-de-profiles-alcanza-sin-capa-extra-de-sync.md`
13. `13-refactorizar-la-capa-auth-y-guards-sin-romper-roles.md`
14. `14-retirar-el-flujo-principal-de-magic-link.md`
15. `15-documentar-configuracion-externa-de-supabase-para-otp-por-codigo.md`
16. `16-documentar-configuracion-externa-de-google-oauth.md`
17. `17-revalidar-compatibilidad-con-profiles-bootstrap-admin-y-rls.md`
18. `18-validar-flujos-auth-duales-y-logout.md`
19. `19-ejecutar-validacion-tecnica-de-la-transicion-auth.md`
20. `20-actualizar-documentacion-final-y-contexto-del-repo-tras-cerrar-g13.md`

## Resultado esperado

Tener un frente de trabajo completo, ordenado y ejecutable para migrar GymControl desde `magic link` a auth dual `OTP + Google`, incluyendo codigo, configuracion externa y actualizacion documental.

## Decision inicial del grupo

- proveedor de auth: Supabase Auth
- acceso principal: OTP por email de 6 digitos
- acceso alternativo: Google OAuth
- sesion web: `@supabase/ssr`
- rol de aplicacion: `profiles.type_rol`
- Better Auth no entra
- password no entra
- `magic link` deja de ser el flujo principal
