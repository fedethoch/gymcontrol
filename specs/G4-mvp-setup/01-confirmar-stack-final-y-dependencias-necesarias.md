# Confirmar stack final y dependencias necesarias: cerrar la base tecnica del MVP

**Grupo:** G4 - Setup tecnico del MVP  
**Orden:** 1  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Confirmar el stack tecnico final del proyecto y definir solo las dependencias realmente necesarias para construir el MVP.

## Estado

Completado.

## Archivos

- `package.json`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/WORKING_AGREEMENTS.md`
- `PLAN.md`

## Pasos

1. Revisar el stack ya presente en el repo.
2. Compararlo con las necesidades definidas en arquitectura y base de datos.
3. Listar las dependencias indispensables para el MVP.
4. Descartar librerias opcionales o prematuras.
5. Registrar la decision tecnica base.

## Criterios de aceptacion

- El stack final queda claro.
- Solo se consideran dependencias necesarias para el MVP.
- No se agregan librerias por comodidad si no aportan valor real.

## Resolucion

El stack tecnico base del MVP queda definido por:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint con `eslint-config-next`
- Supabase para autenticacion y base de datos
- `@supabase/supabase-js`
- `@supabase/ssr`
- `zod`

Se mantienen las dependencias ya presentes para soporte de UI y tooling base.

Se descartan por ahora dependencias accesorias como `react-hook-form`, `lucide-react`, `clsx` o `tailwind-merge` porque no son indispensables para arrancar el MVP.

## Validacion

- Verificar que el stack cubra UI, autenticacion, acceso a datos y validacion.
- Verificar que no introduzca complejidad evitable.

## Estado final

Completado.
