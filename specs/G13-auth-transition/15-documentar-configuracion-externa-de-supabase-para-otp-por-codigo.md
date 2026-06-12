# Documentar configuracion externa de Supabase para OTP por codigo: dejar operativa la parte fuera del repo

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 15  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Documentar la configuracion externa necesaria en Supabase para que el email de auth entregue un codigo OTP usable y no dependa de `ConfirmationURL`.

## Estado

Pendiente.

## Archivos

- `README.md`
- `docs/codex/ENV_INDEX.md`
- documentacion auth del proyecto si aplica

## Pasos

1. Documentar el requisito de template OTP por codigo.
2. Documentar el uso de `{{ .Token }}`.
3. Documentar el lugar donde revisar configuracion de email auth.
4. Evitar documentar secretos o configuraciones no verificables en repo.

## Criterios de aceptacion

- El repo deja claro como habilitar OTP real en Supabase.
- No se depende de conocimiento externo no documentado.
- La documentacion sigue corta y operativa.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que la documentacion permita distinguir OTP por codigo de `magic link`.
- Verificar que no se documenten secretos ni valores sensibles.

## Estado final

No iniciado.
