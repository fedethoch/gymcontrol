# Working Agreements

## Objetivo de este documento

Dejar pactadas las reglas de trabajo del repositorio antes de definir arquitectura, base de datos y plan de implementacion.

## Reglas generales

- Mantener el proyecto simple mientras el MVP lo permita.
- Evitar sobreingenieria.
- Cada decision debe justificar su costo tecnico.
- Priorizar consistencia y facilidad de mantenimiento.
- Documentar decisiones importantes antes o junto con su implementacion.

## Regla de simplicidad

La consigna principal del proyecto sera:

> intentar manipular lo menos posible la complejidad del sistema, manteniendo soluciones simples siempre y cuando cumplan correctamente el objetivo del MVP.

Esto aplica a:

- arquitectura
- modelo de datos
- UI
- permisos
- skills
- agentes
- automatizaciones

## Acuerdos sobre documentacion

La documentacion de trabajo debe:

- vivir dentro del repo
- estar escrita en Markdown
- servir como fuente de verdad operativa
- actualizarse cuando cambie una decision relevante

## Orden de definicion previsto

Las proximas definiciones se trabajaran en este orden:

1. Arquitectura del proyecto
2. Base de datos
3. Skills y agentes necesarios
4. Plan detallado de ejecucion del MVP

## Criterios para arquitectura

Cuando se defina la arquitectura, debe cumplir estos criterios:

- ser entendible rapido
- separar claramente responsabilidades
- facilitar control de acceso por rol
- soportar catalogo, dashboard y admin dashboard
- permitir evolucion sin rehacer todo
- no introducir capas innecesarias

## Criterios para base de datos

Cuando se defina la base de datos, debe cumplir estos criterios:

- modelo simple
- relaciones minimas necesarias
- nombres claros
- soporte directo para ejercicios, rutinas semanales, dias y asignaciones de usuario
- evitar tablas o abstracciones prematuras

## Criterios para skills y agentes

Cuando se definan skills y agentes, deben cumplir estos criterios:

- crear solo los necesarios
- evitar solapamientos
- optimizar uso de tokens
- mantener instrucciones cortas y utiles
- no fragmentar el trabajo en demasiados agentes

## Criterios para el plan de ejecucion

El plan debe:

- estar dividido por grupos de trabajo
- mostrar estado actual por grupo
- tener pasos concretos y ejecutables
- permitir pedir a la IA la ejecucion de un paso leyendo su archivo `.md`
- dejar trazabilidad clara del avance

## Regla sobre nuevas decisiones

Si en el futuro aparece una solucion mas compleja que la actual, primero debe justificarse por alguna de estas razones:

- reduce riesgo real
- simplifica mantenimiento
- destraba una necesidad del MVP
- evita rehacer una parte importante en el corto plazo

Si no cumple alguna de esas razones, se debe preferir la opcion mas simple.

## Stack tecnico base del MVP

El stack tecnico final del proyecto queda definido como:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint con `eslint-config-next`
- Supabase para autenticacion y base de datos
- `@supabase/supabase-js`
- `@supabase/ssr`
- `zod`

Dependencias ya presentes en el repo y que se mantienen:

- `@tailwindcss/postcss`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `tailwindcss`

Dependencias descartadas por ahora:

- `react-hook-form`
- `lucide-react`
- `clsx`
- `tailwind-merge`
- cualquier libreria de estado o data fetching adicional

Motivo:

- la app puede avanzar con server actions, validacion simple y componentes de Tailwind sin sumar piezas superfluas
- Supabase cubre autenticacion y persistencia del MVP
- `zod` alcanza para validar entradas de forma consistente en el servidor y en formularios
- cualquier dependencia adicional debe justificarse por una necesidad real del MVP, no por comodidad
