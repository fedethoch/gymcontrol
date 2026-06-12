# Instalar y configurar librerias imprescindibles: preparar las dependencias reales del proyecto

**Grupo:** G4 - Setup tecnico del MVP  
**Orden:** 2  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Instalar y configurar unicamente las librerias imprescindibles para implementar el MVP segun lo definido en arquitectura, base de datos y stack final.

## Estado

Completado.

## Archivos

- `package.json`
- `pnpm-lock.yaml`
- archivos de configuracion del proyecto
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`

## Pasos

1. Tomar la lista final de dependencias necesarias.
2. Instalar cada dependencia requerida.
3. Realizar la configuracion minima para que quede operativa.
4. Evitar agregar librerias accesorias o experimentales.
5. Dejar registro de lo instalado y por que.

## Criterios de aceptacion

- Todas las dependencias necesarias quedan instaladas.
- Cada una tiene configuracion minima funcional.
- No quedan dependencias innecesarias agregadas en esta fase.

## Resolucion

Se instalaron como dependencias directas del MVP:

- `@supabase/supabase-js`
- `@supabase/ssr`
- `zod`

No se agregaron librerias accesorias.

La configuracion minima que faltara para dejarlas operativas dentro de la app queda reservada para:

- acceso a Supabase y variables de entorno en `G4/06`
- uso concreto de validaciones en formularios o acciones en grupos funcionales posteriores

## Validacion

- Verificar que el proyecto siga corriendo luego de la instalacion.
- Verificar que las librerias esten alineadas con el MVP y no con escenarios futuros.

## Estado final

Completado.
