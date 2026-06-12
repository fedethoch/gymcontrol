# Retirar el flujo principal de magic link: limpiar el acceso antiguo sin romper compatibilidad necesaria

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 14  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Retirar `magic link` como flujo principal de acceso y limpiar las piezas de UI, errores y acciones que queden obsoletas tras la transicion.

## Estado

Pendiente.

## Archivos

- `app/auth/login/`
- `app/auth/callback/`
- `README.md`

## Pasos

1. Identificar referencias activas a `magic link`.
2. Reemplazar copy y estados obsoletos.
3. Retirar o reducir acciones ya innecesarias.
4. Mantener solo lo que siga siendo util para Google OAuth o compatibilidad minima.

## Criterios de aceptacion

- `magic link` deja de figurar como flujo principal.
- No quedan mensajes contradictorios en login o docs.
- La limpieza no elimina piezas necesarias para Google.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que el login visible ya no prometa apertura por link.
- Verificar que el callback no quede roto para Google.

## Estado final

No iniciado.
