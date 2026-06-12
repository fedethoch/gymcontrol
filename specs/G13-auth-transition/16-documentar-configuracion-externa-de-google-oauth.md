# Documentar configuracion externa de Google OAuth: preparar el proveedor alternativo fuera del repo

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 16  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Documentar la configuracion externa minima de Google OAuth en Supabase y el entorno del proyecto para poder habilitar el acceso alternativo por Google.

## Estado

Pendiente.

## Archivos

- `README.md`
- `docs/codex/ENV_INDEX.md`
- documentacion operativa auth si aplica

## Pasos

1. Documentar la necesidad de habilitar Google como provider.
2. Documentar callback URLs y redirects esperados.
3. Documentar variables o secretos operativos necesarios sin exponer valores.
4. Dejar un checklist reproducible por entorno.

## Criterios de aceptacion

- El equipo sabe que configurar fuera del repo para Google OAuth.
- La documentacion distingue claramente codigo local de setup externo.
- No quedan huecos operativos criticos para habilitar el provider.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que callback y redirects queden documentados.
- Verificar que no se confundan variables runtime con secretos externos.

## Estado final

No iniciado.
