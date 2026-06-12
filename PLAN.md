# Plan - indice y orden de ejecucion

Este archivo organiza el trabajo del MVP de GymControl en grupos, subgrupos y pasos. Su objetivo es definir primero lo que bloquea decisiones de implementacion y luego ordenar la construccion del producto hasta llegar a un MVP funcional, simple y mantenible.

El orden de ejecucion propuesto es secuencial por grupos. Dentro de cada grupo podran existir subgrupos y, mas adelante, cada paso tendra su propio archivo `.md` para ser ejecutado de forma aislada.

## Estado actual

| Grupo | Estado | Nota |
| --- | --- | --- |
| Grupo "G1" - Arquitectura | Completado | Pasos 1 al 10 completados; arquitectura consolidada como fuente de verdad. |
| Grupo "G2" - Base de datos | Completado con esquema aplicado | Pasos 1 al 10 completados; `docs/DATABASE.md` queda cerrado como fuente de verdad del modelo inicial y la migracion `20260601_g2_mvp_base_schema.sql` ya fue aplicada en Supabase. |
| Grupo "G3" - Skills y agentes | Completado | Pasos 1 al 8 completados; `docs/SKILLS_AND_AGENTS.md` queda cerrado como fuente de verdad operativa. |
| Grupo "G4" - Setup tecnico del MVP | Completado | Quedo lista la base tecnica del MVP con layout comun, navegacion inicial y esqueleto navegable para `auth`, `catalogo`, `dashboard` y `admin`. |
| Grupo "G4.5" - Frontend base y experiencia | Completado | Quedo implementado y validado el shell base con `shadcn/ui`, sidebar colapsable desktop, `Sheet` mobile y smoke tecnico cerrado con `pnpm lint`, `pnpm build` y verificacion HTTP local. |
| Grupo "G5" - Autenticacion y roles | Completado con validacion tecnica local | Quedo implementado Supabase Auth con magic link, autoregistro, callback, logout, guards server-side, visibilidad por rol y bootstrap admin manual documentado. La QA end-to-end real del flujo se revalida en G11. |
| Grupo "G5.5" - RLS y policies | Completado con validacion remota | Migracion `20260608_g55_mvp_rls_policies.sql` aplicada y verificada por MCP en Supabase remoto con RLS activo en las 6 tablas del MVP. |
| Grupo "G6" - Ejercicios admin | Completado con validacion tecnica local y Storage remoto | `/admin/ejercicios` ya quedo conectado a `public.exercises`, con server actions, validacion, upload a `exercise-images` y capa reusable de lectura para los siguientes grupos. |
| Grupo "G7" - Rutinas admin | Completado con validacion tecnica local | `/admin/rutinas` ya quedo conectado a `routine_templates`, `routine_days` y `routine_items`, con builder, edicion, validacion y lectura completa de la estructura semanal. |
| Grupo "G10" - Modal de ejercicio | Completado con validacion tecnica local | Quedo consolidado un modal reutilizable de ejercicio compartido entre catalogo y detalle diario del dashboard, con foco, cierre y lectura consistentes. |
| Grupo "G8" - Catalogo de rutinas | Completado con validacion tecnica local | `app/catalogo/` ya expone el listado, el detalle semanal, la apertura de ejercicio en modal y el punto de accion preparado para guardar la rutina mas adelante en G9. |
| Grupo "G9" - Dashboard de usuario | Completado con validacion tecnica local y ajuste remoto de esquema | Queda operativo sobre `saved_routines`, con guardado desde catalogo, unique por usuario+plantilla, renombrado owner-only y detalle semanal/diario real con modal reutilizado. |
| Grupo "G11" - Integracion y QA del MVP | Completado con QA autenticada end-to-end | Quedaron verificados con sesiones reales de Supabase Auth los flujos `admin` y `user`, la no duplicacion de `saved_routines`, el modal transversal, los estados vacios y los permisos; tambien se cerraron `pnpm lint` y `pnpm build` al final de la ronda. |
| Grupo "G12" - Cierre del MVP | Completado | README y PLAN quedan alineados al estado final del MVP; el cierre funcional base queda respaldado por `G11`. |
| Grupo "G13" - Transicion de auth dual | Completado con validacion tecnica local | Quedo implementada la migracion de `magic link` a `OTP por email + Google OAuth`, con endpoints dedicados, callback SSR reservado a Google, rate limit minimo en memoria y continuidad sobre `profiles.type_rol`. |

## Grupo "G1" - Arquitectura

Objetivo del grupo: definir la arquitectura funcional y tecnica del proyecto antes de avanzar en implementacion.

### Subgrupo "G1.1" - Alcance y modulos

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Delimitar el alcance final del MVP y confirmar que queda fuera. | Completado |
| 2 | Definir los modulos principales del producto: landing o acceso inicial, catalogo, dashboard de usuario, admin dashboard, auth y capa de datos. | Completado |
| 3 | Definir responsabilidades por modulo y fronteras entre UI, logica de aplicacion y persistencia. | Completado |

### Subgrupo "G1.2" - Flujos principales

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Documentar el flujo admin para crear ejercicios. | Completado |
| 5 | Documentar el flujo admin para crear rutinas semanales con multiples dias. | Completado |
| 6 | Documentar el flujo usuario para explorar, elegir, guardar y renombrar rutinas. | Completado |
| 7 | Documentar el flujo de apertura del detalle emergente de ejercicio sin abandonar la pagina. | Completado |

### Subgrupo "G1.3" - Convenciones tecnicas

| Orden | Spec | Estado |
| --- | --- | --- |
| 8 | Definir estructura de carpetas y convenciones de nombres del proyecto. | Completado |
| 9 | Definir estrategia de componentes, vistas, acciones de servidor y validaciones. | Completado |
| 10 | Guardar la arquitectura pactada en `docs/ARCHITECTURE.md`. | Completado |

Nota: este grupo debe mantener la arquitectura lo mas simple posible y evitar capas innecesarias.

## Grupo "G2" - Base de datos

Objetivo del grupo: definir un modelo de datos simple, consistente y suficiente para el MVP.

### Subgrupo "G2.1" - Entidades base

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Listar entidades minimas necesarias para cubrir el MVP. | Completado |
| 2 | Definir atributos minimos por entidad, evitando campos prematuros. | Completado |
| 3 | Definir como representar `type_rol` y su uso en permisos. | Completado |

### Subgrupo "G2.2" - Relaciones y reglas

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Definir relacion entre rutina, dias de rutina y filas de ejercicios. | Completado |
| 5 | Definir relacion entre usuarios y rutinas guardadas, contemplando multiples rutinas por usuario y nombres propios. | Completado |
| 6 | Definir estrategia para imagenes de ejercicios sin complejizar el esquema. | Completado |
| 7 | Revisar si el modelo puede simplificarse aun mas sin perder cobertura funcional. | Completado |

### Subgrupo "G2.3" - Documento y criterio de simplicidad

| Orden | Spec | Estado |
| --- | --- | --- |
| 8 | Redactar el documento de base de datos con decisiones y limites del esquema. | Completado |
| 9 | Guardar el acuerdo de manipular la base de datos lo menos posible, priorizando simplicidad. | Completado |
| 10 | Cerrar `docs/DATABASE.md` como fuente de verdad del modelo inicial. | Completado |

Nota: este grupo debe resolver estructura, no optimizaciones avanzadas ni modelados futuros.

### Bajada operativa de G2 a Supabase

Con G2 ya cerrado a nivel de diseno, la implementacion real en Supabase se ejecutara como una secuencia operativa separada dentro de `specs/G2.1/`.

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Traducir `docs/DATABASE.md` a reglas SQL concretas. | Completado |
| 2 | Definir utilidades comunes minimas del esquema. | Completado |
| 3 | Crear tabla `profiles`. | Completado |
| 4 | Crear tabla `exercises`. | Completado |
| 5 | Crear tablas `routine_templates` y `routine_days`. | Completado |
| 6 | Crear tabla `routine_items`. | Completado |
| 7 | Crear tabla `saved_routines`. | Completado |
| 8 | Agregar constraints e indices minimos finales. | Completado |
| 9 | Generar migracion SQL final de G2. | Completado |
| 10 | Aplicar migracion en Supabase y verificar esquema real. | Completado |
| 11 | Sincronizar documentacion operativa de G2. | Completado |

Estado operativo adicional de G2:

- Diseno del esquema: completado y vigente en `docs/DATABASE.md`.
- Verificacion real en Supabase: completada; `public` ya contiene `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines`.
- Estado del MCP en G2: quedo validado para lecturas, consultas SQL y aplicacion de migraciones en ese momento.
- Migracion aplicada: `supabase/migrations/20260601_g2_mvp_base_schema.sql`.
- Siguiente endurecimiento completado: `G5.5 - RLS y policies` queda versionado en `supabase/migrations/20260608_g55_mvp_rls_policies.sql`.

## Grupo "G3" - Skills y agentes

Objetivo del grupo: definir el set minimo de skills y agentes necesarios para trabajar bien sin desperdiciar tokens.

### Subgrupo "G3.1" - Necesidad real

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Identificar que tareas recurrentes justifican una skill o un agente. | Completado |
| 2 | Separar necesidades reales de ideas accesorias o prematuras. | Completado |
| 3 | Decidir que puede resolverse sin skill dedicada. | Completado |

### Subgrupo "G3.2" - Diseno minimo

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Definir la cantidad minima de skills necesarias. | Completado |
| 5 | Definir si hace falta algun agente adicional y con que responsabilidad puntual. | Completado |
| 6 | Definir lineamientos de instrucciones cortas y optimizadas en tokens. | Completado |

### Subgrupo "G3.3" - Documento de referencia

| Orden | Spec | Estado |
| --- | --- | --- |
| 7 | Documentar responsibilities, limites y criterio de uso de cada skill o agente. | Completado |
| 8 | Guardar la definicion en `docs/SKILLS_AND_AGENTS.md`. | Completado |

Nota: si una skill o agente no genera una mejora clara de trabajo, no debe crearse.

## Grupo "G4" - Setup tecnico del MVP

Objetivo del grupo: preparar la base tecnica del proyecto segun lo definido en arquitectura y base de datos.

### Subgrupo "G4.1" - Preparacion del entorno

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Confirmar stack final del proyecto y dependencias necesarias para el MVP. | Completado |
| 2 | Instalar y configurar las librerias imprescindibles. | Completado |
| 3 | Limpiar el boilerplate inicial que no aporte al producto. | Completado |

### Subgrupo "G4.2" - Estructura de proyecto

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Crear la estructura de carpetas pactada para app, componentes, datos y utilidades. | Completado |
| 5 | Configurar manejo base de estilos y UI compartida. | Completado |
| 6 | Configurar acceso a base de datos y manejo de entorno. | Completado |

### Subgrupo "G4.3" - Base de trabajo

| Orden | Spec | Estado |
| --- | --- | --- |
| 7 | Crear layout base y navegacion inicial del producto. | Completado |
| 8 | Dejar un esqueleto navegable para catalogo, dashboard y admin dashboard. | Completado |

Nota: este grupo no debe implementar logica funcional final; solo dejar una base ordenada y operativa.

## Grupo "G4.5" - Frontend base y experiencia

Objetivo del grupo: redefinir la base visual y estructural del frontend del MVP antes de implementar auth y logica funcional.

### Subgrupo "G4.5.1" - Arquitectura de experiencia

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Definir shell principal con panel lateral izquierdo. | Completado |
| 2 | Definir navegacion base para usuario y admin. | Completado |
| 3 | Definir mapa real de vistas y transiciones. | Completado |
| 4 | Confirmar fronteras entre agregar rutinas, mis rutinas, ejercicio y admin. | Completado |

### Subgrupo "G4.5.2" - Sistema visual base

| Orden | Spec | Estado |
| --- | --- | --- |
| 5 | Definir direccion visual general del producto. | Completado |
| 6 | Definir tipografia, paleta, superficies y espaciado base. | Completado |
| 7 | Definir patron visual del panel lateral y area de contenido. | Completado |
| 8 | Definir estilo base de tabla de rutina y modal de ejercicio. | Completado |

### Subgrupo "G4.5.3" - Flujo de usuario

| Orden | Spec | Estado |
| --- | --- | --- |
| 9 | Disenar pantalla agregar rutinas. | Completado |
| 10 | Disenar pantalla mis rutinas con rutina activa. | Completado |
| 11 | Disenar pantalla ejercicio con organigrama semanal. | Completado |
| 12 | Disenar pantalla de detalle diario de rutina. | Completado |
| 13 | Disenar comportamiento del modal de ejercicio. | Completado |

### Subgrupo "G4.5.4" - Flujo admin

| Orden | Spec | Estado |
| --- | --- | --- |
| 14 | Integrar acceso admin en el shell general. | Completado |
| 15 | Disenar base visual de admin dashboard. | Completado |
| 16 | Disenar entradas para gestion de ejercicios y rutinas. | Completado |

### Subgrupo "G4.5.5" - Implementacion y validacion

| Orden | Spec | Estado |
| --- | --- | --- |
| 17 | Implementar shell navegable definitivo del frontend base. | Completado |
| 18 | Implementar vistas base y placeholders del nuevo flujo. | Completado |
| 19 | Validar navegacion, responsive y smoke tecnico del frontend base. | Completado |

Nota: este grupo define y aterriza la nueva experiencia del frontend sin anticipar auth final ni persistencia funcional completa.

## Grupo "G5" - Autenticacion y roles

Objetivo del grupo: implementar Supabase Auth como solucion cerrada del MVP, con sesion server-side, guards por rol y redirecciones consistentes.

### Subgrupo "G5.1" - Sesion con Supabase Auth

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Implementar autenticacion base con Supabase Auth y `@supabase/ssr`. | Completado |
| 2 | Integrar `type_rol` al flujo de acceso y sesion. | Completado |
| 3 | Definir redirecciones segun estado autenticado y rol. | Completado |

### Subgrupo "G5.2" - Proteccion de areas

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Proteger el admin dashboard para usuarios con rol `admin`. | Completado |
| 5 | Proteger acciones de creacion y edicion administrativas del lado servidor. | Completado |
| 6 | Validar acceso normal al dashboard de usuario autenticado. | Completado |

### Subgrupo "G5.3" - Verificacion

| Orden | Spec | Estado |
| --- | --- | --- |
| 7 | Probar escenarios basicos de acceso permitido y denegado. | Completado |
| 8 | Ajustar mensajes o UX minima ante accesos no permitidos. | Completado |

### Subgrupo "G5.4" - Bootstrap operativo

| Orden | Spec | Estado |
| --- | --- | --- |
| 9 | Dejar documentado y verificable al menos un usuario admin para QA manual. | Completado |

Nota: este grupo cierra la decision de auth del MVP. No se evalua Better Auth salvo cambio arquitectonico explicito. La validacion tecnica local de G5 ya quedo cerrada con `pnpm lint` y `pnpm build`; la verificacion real del circuito de email se vuelve a revisar en G11.

## Grupo "G5.5" - RLS y policies

Objetivo del grupo: cerrar la capa minima de seguridad de datos antes de CRUD real, habilitando RLS y policies consistentes con el MVP.

### Subgrupo "G5.5.1" - Estrategia base

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Definir estrategia minima de RLS y helper de rol admin sobre `profiles.type_rol`. | Completado |
| 2 | Habilitar RLS en las tablas del MVP sin romper el flujo de auth definido en G5. | Completado |
| 3 | Documentar que lecturas de catalogo quedan permitidas en el MVP y para que actores. | Completado |

### Subgrupo "G5.5.2" - Policies por dominio

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Aplicar policies para `profiles`. | Completado |
| 5 | Aplicar policies para `exercises`, `routine_templates`, `routine_days` y `routine_items`. | Completado |
| 6 | Aplicar policies para `saved_routines` con acceso solo del usuario dueno. | Completado |
| 7 | Restringir escrituras administrativas a usuarios con rol `admin`. | Completado |

### Subgrupo "G5.5.3" - Validacion

| Orden | Spec | Estado |
| --- | --- | --- |
| 8 | Validar escenarios `anon`, `authenticated`, `admin` y propietario segun corresponda. | Completado |
| 9 | Confirmar bootstrap manual de admin y criterio de QA hasta que existan seeds reales. | Completado |

Nota: este grupo queda implementado en repo con la migracion `supabase/migrations/20260608_g55_mvp_rls_policies.sql`, aplicado en Supabase remoto y revalidado por SQL/MCP junto con el estado real de policies y RLS.

## Grupo "G6" - Ejercicios admin

Objetivo del grupo: permitir al admin gestionar ejercicios usando la tabla `exercises` ya existente, con acceso a datos, validaciones, permisos y UI minima.

### Subgrupo "G6.1" - Acceso a datos y validacion

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Implementar acceso a datos y acciones sobre `exercises` sin redefinir el esquema. | Completado |
| 2 | Implementar validaciones de alta y edicion de ejercicios. | Completado |
| 3 | Resolver `image_url` o referencia de imagenes de forma simple. | Completado |

### Subgrupo "G6.2" - Admin UI

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Crear vista de listado de ejercicios en admin dashboard. | Completado |
| 5 | Crear formulario para alta de ejercicio. | Completado |
| 6 | Crear edicion basica de ejercicio si se considera necesaria para el MVP. | Completado |

### Subgrupo "G6.3" - Integracion y permisos

| Orden | Spec | Estado |
| --- | --- | --- |
| 7 | Exponer los datos de ejercicio para catalogo, builder de rutinas y modal. | Completado |
| 8 | Verificar persistencia, recuperacion, permisos e `image_url` correcto. | Completado |

Nota: este grupo queda cerrado con la capa server-only `app/lib/exercises.ts`, el upload cliente a Supabase Storage y la migracion `supabase/migrations/20260608_g6_exercise_images_storage.sql` aplicada en remoto.

## Grupo "G7" - Rutinas admin

Objetivo del grupo: permitir al admin crear rutinas semanales usando las tablas ya existentes, con builder simple, persistencia transaccional y lectura completa.

### Subgrupo "G7.1" - Acceso a datos e integridad

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Implementar acceso a datos sobre `routine_templates` sin redefinir el esquema. | Completado |
| 2 | Implementar persistencia de dias de rutina semanal con integridad de orden. | Completado |
| 3 | Implementar persistencia de filas con ejercicio, series, repeticiones, RIR y descanso. | Completado |

### Subgrupo "G7.2" - Builder admin

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Crear listado de rutinas en admin dashboard. | Completado |
| 5 | Crear builder o formulario para crear una rutina semanal. | Completado |
| 6 | Permitir agregar multiples dias dentro de una misma rutina. | Completado |
| 7 | Permitir agregar multiples filas de ejercicios dentro de cada dia. | Completado |

### Subgrupo "G7.3" - Lectura completa y referencias

| Orden | Spec | Estado |
| --- | --- | --- |
| 8 | Validar que una rutina pueda recuperarse y mostrarse con su estructura completa. | Completado |
| 9 | Verificar consistencia de referencias a ejercicios y permisos asociados. | Completado |

Nota: este grupo queda cerrado en repo con `app/lib/routines.ts`, `app/admin/rutinas/actions.ts` y `app/admin/rutinas/RoutineAdminClient.tsx`; la QA end-to-end real completa se revalida en G11.

## Grupo "G10" - Modal de ejercicio

Objetivo del grupo: unificar primero la experiencia de detalle de ejercicio en un componente reutilizable para evitar retrabajo al integrar catalogo y dashboard.

### Subgrupo "G10.1" - Componente base

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Disenar e implementar el componente base de modal o emergente. | Completado |
| 2 | Mostrar nombre, imagen y descripcion del ejercicio. | Completado |
| 3 | Permitir apertura y cierre sin abandonar la pagina actual. | Completado |

### Subgrupo "G10.2" - Integracion en vistas

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Integrar el modal en catalogo de rutinas. | Completado |
| 5 | Integrar el modal en dashboard de usuario. | Completado |
| 6 | Integrar el modal en cualquier otra vista donde aparezca un ejercicio dentro del MVP. | Completado |

### Subgrupo "G10.3" - UX y accesibilidad minima

| Orden | Spec | Estado |
| --- | --- | --- |
| 7 | Asegurar comportamiento claro en desktop y mobile. | Completado |
| 8 | Revisar accesibilidad minima de foco, cierre y lectura del contenido. | Completado |

Nota: este grupo queda cerrado en repo con `app/components/shared/ExerciseDetailModal.tsx`, el refactor de `app/catalogo/rutinas/[id]/RoutineDetailClient.tsx` y la integracion del detalle diario via `app/components/shared/RoutineTablePreview.tsx`; la revalidacion end-to-end completa sigue en G11.

## Grupo "G8" - Catalogo de rutinas

Objetivo del grupo: permitir que usuarios vean las rutinas disponibles y entiendan su contenido usando el modal ya resuelto en G10.

### Subgrupo "G8.1" - Exploracion

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Crear vista catalogo de rutinas disponibles. | Completado |
| 2 | Mostrar informacion minima util de cada rutina para seleccion. | Completado |
| 3 | Permitir entrar al detalle de una rutina sin perder claridad de navegacion. | Completado |

### Subgrupo "G8.2" - Consumo del contenido

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Mostrar la estructura semanal de la rutina elegida. | Completado |
| 5 | Integrar los ejercicios con el modal resuelto en G10. | Completado |
| 6 | Preparar el punto de accion para guardar la rutina en cuenta del usuario. | Completado |

Nota: este grupo queda cerrado en repo con `app/catalogo/page.tsx`, `app/catalogo/RoutineCatalogClient.tsx` y `app/catalogo/rutinas/[id]/`; el guardado real de rutina sigue diferido a G9.

## Grupo "G9" - Dashboard de usuario

Objetivo del grupo: permitir que el usuario gestione sus rutinas elegidas dentro de su cuenta con acceso al modal ya existente.

### Subgrupo "G9.1" - Guardado de rutinas

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Implementar la accion para guardar una rutina del catalogo en la cuenta del usuario. | Completado |
| 2 | Permitir que el usuario tenga mas de una rutina guardada. | Completado |
| 3 | Definir como se representa la relacion entre rutina plantilla y rutina guardada por usuario. | Completado |

### Subgrupo "G9.2" - Personalizacion

| Orden | Spec | Estado |
| --- | --- | --- |
| 4 | Permitir asignar nombre propio a cada rutina guardada. | Completado |
| 5 | Permitir editar ese nombre desde el dashboard. | Completado |

### Subgrupo "G9.3" - Visualizacion

| Orden | Spec | Estado |
| --- | --- | --- |
| 6 | Crear dashboard de usuario con listado de rutinas guardadas. | Completado |
| 7 | Permitir ver el detalle de cada rutina guardada. | Completado |
| 8 | Mantener acceso al modal de detalle de ejercicio desde estas vistas. | Completado |

Nota: el dashboard ya cubre guardado, renombrado y consulta sobre `saved_routines`; no agrega seguimiento de progreso ni rutina activa persistida.

## Grupo "G11" - Integracion y QA del MVP

Objetivo del grupo: verificar que todos los flujos del MVP funcionen de punta a punta.

### Subgrupo "G11.1" - Flujos criticos

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Probar flujo admin de creacion de ejercicios. | Completado |
| 2 | Probar flujo admin de creacion de rutinas semanales. | Completado |
| 3 | Probar flujo usuario de exploracion, guardado y renombrado de rutinas. | Completado |
| 4 | Probar apertura del modal de ejercicio desde multiples contextos. | Completado |

### Subgrupo "G11.2" - Consistencia y errores

| Orden | Spec | Estado |
| --- | --- | --- |
| 5 | Revisar validaciones, mensajes de error y estados vacios esenciales. | Completado |
| 6 | Revisar permisos para evitar acciones admin desde usuarios no admin. | Completado |
| 7 | Revisar consistencia visual minima entre vistas del MVP. | Completado |

### Subgrupo "G11.3" - Ajustes finales

| Orden | Spec | Estado |
| --- | --- | --- |
| 8 | Resolver bugs detectados en pruebas finales. | Completado |
| 9 | Ejecutar validacion tecnica final del MVP. | Completado |

Nota: este grupo quedo cerrado con QA autenticada end-to-end sobre cuentas reales `admin` y `user`, incluyendo alta y edicion admin, guardado y renombrado en dashboard, no duplicacion por `(user_id, routine_template_id)`, modal desde catalogo/semana/dia, estados vacios, logout y bloqueos por rol. La validacion tecnica final cerro con `pnpm lint` y `pnpm build`.

## Grupo "G12" - Cierre del MVP

Objetivo del grupo: dejar el MVP listo para ser retomado, presentado o extendido con base ordenada.

### Subgrupo "G12.1" - Documentacion final

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Actualizar README y documentos principales segun lo implementado. | Completado |
| 2 | Registrar decisiones finales y desvio respecto del plan original si existieran. | Completado |

### Subgrupo "G12.2" - Checklist de entrega

| Orden | Spec | Estado |
| --- | --- | --- |
| 3 | Confirmar que el MVP cumple el alcance funcional pactado. | Completado |
| 4 | Confirmar que quedan explicitados los pendientes post-MVP. | Completado |
| 5 | Dejar listo el backlog de la siguiente iteracion. | Completado |

Nota: este grupo queda cerrado. El MVP de GymControl queda formalmente completado y su validacion funcional base queda respaldada por `G11`.

### Cierre formal del MVP

Estado final:

- El MVP queda cerrado formalmente a nivel funcional y documental.
- La referencia de validacion funcional base es `G11`, con QA autenticada end-to-end sobre flujos `admin` y `user`.
- El siguiente trabajo del repo pasa a continuidad post-MVP, no a cierre del MVP.

Desvios relevantes respecto del recorrido original:

- `saved_routines` se consolida como relacion liviana a `routine_templates`, sin duplicar la estructura semanal.
- La semana activa del dashboard se deriva temporalmente de la primera rutina guardada, sin seleccion persistida de rutina activa.
- El cierre original del MVP se resolvio con Supabase Auth + magic link; `G13` luego migra ese acceso a `OTP por email + Google OAuth` sin introducir Better Auth.
- El dashboard y el modal quedan dentro del MVP, pero sin persistencia de progreso ni tracking de entrenamiento.

### Checklist de alcance del MVP

Referencia: `docs/PROJECT_FOUNDATIONS.md`

| Bloque | Estado | Nota |
| --- | --- | --- |
| Ejercicios admin | Cumplido | Alta, edicion basica, persistencia y soporte de imagen. |
| Rutinas admin | Cumplido | Builder semanal, multiples dias y filas, persistencia y lectura. |
| Restriccion por rol | Cumplido | Guards server-side, proteccion de vistas y escrituras admin. |
| Catalogo de rutinas | Cumplido | Listado, detalle semanal y consumo publico del catalogo base. |
| Guardado y renombrado en dashboard | Cumplido | Guardado owner-only sobre `saved_routines`, sin duplicados por plantilla y con renombrado propio. |
| Modal de detalle de ejercicio | Cumplido | Disponible desde catalogo, semana y detalle diario. |

Limites operativos conocidos del MVP:

- la semana activa usa temporalmente la primera rutina guardada
- no existe progreso de usuario ni rutina activa persistida
- el bootstrap de admin sigue siendo manual

### Pendientes post-MVP

- progreso del usuario y seguimiento de entrenamiento
- rutina activa persistida y seleccion explicita desde dashboard
- ampliar QA automatizada y fixtures sobre el circuito de auth dual
- mejoras no criticas de UX, accesibilidad y performance
- seeds, fixtures y automatizacion de QA mas robusta

### Backlog inicial de la siguiente iteracion

Alta:

- persistir una rutina activa real por usuario y desacoplarla de la primera rutina guardada
- agregar seguimiento de progreso por dia o ejercicio sin romper la simplicidad del esquema
- endurecer el circuito de acceso por email para QA y operacion real de cuentas

Media:

- incorporar seeds o fixtures reproducibles para roles, ejercicios y rutinas
- sumar una capa minima de pruebas automatizadas para flujos criticos del MVP
- mejorar feedback de estados vacios y recorridos principales del dashboard

Baja:

- refinar accesibilidad y pulido visual no bloqueante
- revisar oportunidades puntuales de performance en catalogo y dashboard
- ordenar bootstrap operativo y handoff de entorno para futuras rondas

## Grupo "G13" - Transicion de auth dual

Objetivo del grupo: reemplazar el flujo principal de `magic link` por una autenticacion dual basada en Supabase Auth, con `OTP por email de 6 digitos` como acceso principal y `Google OAuth` como alternativa, sin romper roles, guards, RLS ni bootstrap admin.

### Subgrupo "G13.1" - Contrato y alcance de auth

| Orden | Spec | Estado |
| --- | --- | --- |
| 1 | Definir el contrato de auth dual para GymControl. | Completado |
| 2 | Documentar la brecha entre `magic link` actual y auth dual objetivo. | Completado |
| 3 | Definir el flujo OTP por email de 6 digitos. | Completado |
| 4 | Definir el flujo alternativo de Google OAuth. | Completado |
| 5 | Definir como convergen sesion y perfil entre OTP y Google. | Completado |
| 6 | Definir redirecciones y reglas de acceso segun rol. | Completado |

### Subgrupo "G13.2" - UI y backend de autenticacion

| Orden | Spec | Estado |
| --- | --- | --- |
| 7 | Disenar la nueva pantalla de auth dual. | Completado |
| 8 | Implementar `requestOtp` mediante endpoint protegido. | Completado |
| 9 | Agregar rate limit minimo para solicitud de OTP. | Completado |
| 10 | Implementar verificacion de OTP y creacion de sesion. | Completado |
| 11 | Adaptar el callback auth para Google OAuth y retirar dependencia del callback en OTP. | Completado |
| 12 | Confirmar si el trigger actual de `profiles` alcanza sin capa extra de sync. | Completado |
| 13 | Refactorizar la capa auth y guards sin romper roles. | Completado |
| 14 | Retirar el flujo principal de `magic link`. | Completado |

### Subgrupo "G13.3" - Configuracion externa y compatibilidad

| Orden | Spec | Estado |
| --- | --- | --- |
| 15 | Documentar configuracion externa de Supabase para OTP por codigo. | Completado |
| 16 | Documentar configuracion externa de Google OAuth. | Completado |
| 17 | Revalidar compatibilidad con `profiles`, bootstrap admin y RLS. | Completado |

### Subgrupo "G13.4" - QA y cierre

| Orden | Spec | Estado |
| --- | --- | --- |
| 18 | Validar flujos auth duales y logout. | Completado |
| 19 | Ejecutar validacion tecnica de la transicion auth. | Completado |
| 20 | Actualizar documentacion final y contexto del repo tras cerrar `G13`. | Completado |

Nota: este grupo conserva Supabase Auth como proveedor. No introduce Better Auth ni password, y no cambia la fuente de verdad de autorizacion: `profiles.type_rol`. La implementacion final queda apoyada en `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`, `POST /auth/google/start` y `GET /auth/callback`, con rate limit minimo en memoria y callback SSR reservado a Google.

## Lectura recomendada

Antes de ejecutar cualquier paso, conviene leer en este orden:

1. `README.md`
2. `docs/PROJECT_FOUNDATIONS.md`
3. `docs/WORKING_AGREEMENTS.md`
4. `docs/ARCHITECTURE.md` cuando exista
5. `docs/DATABASE.md` cuando exista
6. `docs/SKILLS_AND_AGENTS.md` cuando exista
7. `PLAN.md`
8. el archivo `.md` especifico del paso a ejecutar cuando sea creado

Recordatorio: cada paso del plan tendra luego su propio archivo `.md` para poder pedir su ejecucion de manera aislada y con contexto acotado.
