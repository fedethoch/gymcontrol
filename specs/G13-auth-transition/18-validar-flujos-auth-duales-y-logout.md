# Validar flujos auth duales y logout: comprobar que OTP y Google funcionen de punta a punta

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 18  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Validar manualmente y, si aplica, con apoyo de browser testing, que ambos metodos de login y el logout funcionen segun lo esperado.

## Estado

Pendiente.

## Archivos

- `app/auth/`
- `docs/codex/TEST_MATRIX.md`
- evidencia operativa del grupo si aplica

## Pasos

1. Probar solicitud y verificacion OTP.
2. Probar errores y reenvio OTP.
3. Probar Google OAuth exitoso y fallido.
4. Probar logout, sesion persistida y redirects por rol.

## Criterios de aceptacion

- OTP y Google permiten autenticar correctamente.
- Logout cierra sesion de forma consistente.
- Las redirecciones siguen respetando rol y protecciones.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar escenarios `user` y `admin`.
- Verificar que no reaparezcan rutas privadas sin sesion.

## Estado final

No iniciado.
