# Ajustar mensajes o UX minima ante accesos no permitidos: cerrar la experiencia de bloqueo con claridad

**Grupo:** G5 - Autenticacion y roles  
**Orden:** 8  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Mejorar la experiencia minima de usuario cuando ocurre un acceso no permitido, evitando estados confusos o silenciosos.

## Estado

Completado.

## Archivos

- vistas o componentes de acceso denegado
- implementacion de redirecciones y protecciones
- `PLAN.md`

## Pasos

1. Revisar como responde actualmente la app ante accesos no permitidos.
2. Ajustar mensajes, redirecciones o estados de error minimos.
3. Mantener una UX simple y directa.
4. Evitar crear flujos sofisticados de permisos en esta fase.

## Criterios de aceptacion

- Los accesos denegados no dejan al usuario en un estado ambiguo.
- Existe una respuesta clara y minima para cada caso principal.
- La UX sigue siendo simple y consistente con el MVP.

## Resolucion

Se agrego feedback minimo y directo para auth requerida, acceso admin denegado, envio de magic link, cierre de sesion y errores basicos del callback, sin crear pantallas extra ni una UX compleja.

## Validacion

- Verificar que el usuario entienda que paso cuando no puede acceder.
- Verificar que la solucion no agregue pantallas o logicas innecesarias.

## Estado final

Completado.
