# Agregar rate limit minimo para solicitud de OTP: reducir abuso basico del endpoint de acceso

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 9  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Agregar un rate limit minimo sobre la solicitud de OTP para reducir spam, abuso y agotamiento de cuota de auth.

## Estado

Pendiente.

## Archivos

- endpoint de `requestOtp`
- utilidades compartidas si hicieran falta
- `docs/codex/TEST_MATRIX.md`

## Pasos

1. Definir limitacion por IP.
2. Definir limitacion por email.
3. Definir mensajes de rechazo operativos y breves.
4. Mantener la solucion simple y util para el proyecto actual.

## Criterios de aceptacion

- La solicitud OTP tiene freno basico de abuso.
- El usuario recibe feedback entendible ante exceso de intentos.
- La solucion no introduce complejidad desproporcionada.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que el endpoint no quede expuesto a llamadas ilimitadas triviales.
- Verificar que el feedback no filtre detalles internos innecesarios.

## Estado final

No iniciado.
