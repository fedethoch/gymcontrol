# Disenar la nueva pantalla de auth dual: unificar OTP y Google en una sola entrada de acceso

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Disenar la nueva pantalla de acceso para que combine el flujo OTP como camino principal y Google OAuth como opcion alternativa, con estados claros y copy corto.

## Estado

Pendiente.

## Archivos

- `app/auth/login/page.tsx`
- componentes de auth si hicieran falta
- `docs/architecture/07-frontend-experience.md`

## Pasos

1. Definir estructura visual en dos pasos para OTP.
2. Definir ubicacion y prioridad del boton Google.
3. Definir mensajes y feedback minimos.
4. Evitar arrastrar copy obsoleto de `magic link`.

## Criterios de aceptacion

- La pantalla deja claro como acceder.
- El usuario distingue OTP y Google sin confusion.
- La UI no depende de decisiones visuales fuera del alcance del grupo.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar claridad entre solicitar codigo, verificarlo y usar Google.
- Verificar que la pantalla siga siendo compatible con mobile y desktop.

## Estado final

No iniciado.
