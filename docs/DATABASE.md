# Database

## Objetivo

Definir el modelo de datos inicial del MVP de GymControl con la menor cantidad posible de entidades, manteniendo suficiente cobertura para el flujo admin, el catalogo de rutinas, el dashboard de usuario y el modal de ejercicio.

## Principio rector

La base de datos debe mantenerse simple siempre que sea posible.

No se deben agregar tablas, relaciones o abstracciones prematuras si no resuelven una necesidad real del MVP.

## Acuerdo de minima manipulacion

La base de datos de GymControl debe manipularse lo menos posible durante el MVP.

Eso significa:

- no agregar complejidad estructural por anticipacion
- no crear tablas nuevas si una estructura existente ya cubre el caso
- no introducir sistemas configurables si una regla fija del MVP alcanza
- no mover datos a nuevas entidades sin una necesidad funcional clara

Solo se justifica agregar complejidad si ocurre al menos una de estas condiciones:

- resuelve un requerimiento real del MVP
- reduce un riesgo tecnico concreto
- simplifica mantenimiento inmediato
- evita rehacer una parte importante en el corto plazo

## Resumen del modelo

El modelo inicial del MVP queda compuesto por:

- `auth.users` como identidad base de autenticacion
- `profiles` para datos de aplicacion y rol
- `exercises` para ejercicios creados por admin
- `routine_templates` para rutinas plantilla
- `routine_days` para los dias de cada rutina semanal
- `routine_items` para las filas de trabajo dentro de cada dia
- `saved_routines` para las rutinas guardadas por cada usuario
- `workout_sessions` para una sesion diaria real por usuario, rutina guardada, dia y fecha
- `workout_session_items` para reps, peso y estado completado por ejercicio dentro de cada sesion

## Relacion general del modelo

- un `auth.user` tiene un `profile`
- un `profile` define si el usuario es `admin` o `user`
- un `routine_template` tiene muchos `routine_days`
- un `routine_day` tiene muchos `routine_items`
- un `routine_item` referencia un `exercise`
- un usuario puede tener muchas `saved_routines`
- cada `saved_routine` referencia una `routine_template`
- un `saved_routine` puede tener muchas `workout_sessions`
- cada `workout_session` pertenece a un usuario, a una rutina guardada y a un dia concreto
- cada `workout_session_item` pertenece a una sesion y referencia una fila real de `routine_items`

## Entidades minimas necesarias

### 1. Usuario auth

- Fuente externa provista por Supabase Auth.
- No se duplica como tabla propia si no hace falta.
- Sirve como identidad base para autenticacion y relacion con datos de aplicacion.

### 2. Perfil de usuario

- Guarda los datos de aplicacion que no viven en `auth.users`.
- Necesario para almacenar el rol `type_rol`.
- Base para distinguir entre `admin` y usuario normal.
- `type_rol` vive aqui como un campo simple y directo.
- Valores permitidos iniciales:
  - `admin`
  - `user`
- Regla minima:
  - si `type_rol = admin`, el usuario puede acceder y escribir en areas administrativas
  - si `type_rol = user`, el usuario solo accede a las vistas de consumo y gestion personal permitidas
- Atributos minimos:
  - `id`
  - `user_id`
  - `type_rol`
  - `created_at`
  - `updated_at`

#### Provisionamiento de perfil

- cuando se crea un usuario nuevo en `auth.users`, se crea automaticamente su fila en `profiles`
- si ya existen usuarios en `auth.users`, se contempla un backfill inicial para no dejar cuentas sin perfil
- este comportamiento mantiene la relacion 1 a 1 entre autenticacion y datos de aplicacion sin requerir un flujo manual adicional

## type_rol y permisos

La representacion elegida para el MVP es la mas simple posible:

- `type_rol` se guarda en `profiles`
- no se crea tabla extra de permisos
- no se crea sistema de roles multiples
- no se crea matriz de permisos configurable

La logica de acceso del MVP queda asi:

- `admin` habilita acceso y acciones administrativas
- `user` habilita el flujo normal de catalogo y dashboard personal

La decision se mantiene intencionalmente simple porque el MVP solo necesita distinguir dos escenarios de acceso.

## RLS y policies del MVP

La estrategia activa de `G5.5` queda cerrada asi:

- `profiles.type_rol` sigue siendo la unica fuente de verdad de autorizacion del MVP
- el catalogo base (`exercises`, `routine_templates`, `routine_days`, `routine_items`) queda legible para `anon` y `authenticated`
- las escrituras globales del catalogo quedan reservadas a usuarios `admin`
- `saved_routines` queda estrictamente owner-only, incluso para admin
- `profiles` permite lectura del propio perfil, lectura administrativa y actualizacion del propio perfil sin abrir gestion de roles desde la app
- el bootstrap de admin sigue siendo manual via Supabase o MCP
- la auth dual implementada en `G13` no cambia esta fuente de verdad: `profiles.type_rol` sigue resolviendo autorizacion tanto para OTP como para Google OAuth

Implementacion tecnica minima:

- RLS habilitado en `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines`
- helpers internos `private.current_profile_id()` y `private.is_current_user_admin()` para evitar repetir logica en policies
- helper interno `private.can_update_own_profile(...)` para impedir cambios de `type_rol` desde clientes autenticados
- grants minimos por tabla para que `anon` solo lea catalogo y `authenticated` quede sujeto a policies explicitas

### 3. Ejercicio

- Representa cada ejercicio creado por el admin.
- Debe permitir guardar nombre, descripcion/explicacion e imagen.
- Es una entidad central porque aparece en catalogo, rutinas y modal emergente.
- Estrategia de imagen:
  - una sola referencia por ejercicio
  - se guarda como `image_url`
  - en la implementacion activa de `G6`, apunta a la URL publica final del bucket `exercise-images` en Supabase Storage
  - los uploads al bucket quedan reservados a admin; la lectura publica queda habilitada para consumo de catalogo, dashboard y modal
- Atributos minimos:
  - `id`
  - `name`
  - `description`
  - `image_url`
  - `created_by`
  - `created_at`
  - `updated_at`

### 4. Rutina plantilla

- Representa la rutina creada por el admin para ser publicada o usada como plantilla.
- Es la unidad principal que el usuario explora en el catalogo.
- Debe poder agrupar varios dias.
- Debe exponer metadata real de catalogo para filtrar por dificultad y objetivo.
- Relacion:
  - una rutina plantilla tiene muchos dias
  - cada dia pertenece a una sola rutina plantilla
- Atributos minimos:
  - `id`
  - `name`
  - `description` opcional
  - `difficulty`
  - `objective`
  - `created_by`
  - `created_at`
  - `updated_at`

Valores cerrados de metadata:

- `difficulty`:
  - `principiante`
  - `intermedio`
  - `avanzado`
- `objective`:
  - `hipertrofia`
  - `fuerza`
  - `mantenimiento`

#### Traduccion SQL

- `id uuid primary key`
- `name text not null`
- `description text`
- `difficulty text not null default 'intermedio' check (difficulty in ('principiante', 'intermedio', 'avanzado'))`
- `objective text not null default 'mantenimiento' check (objective in ('hipertrofia', 'fuerza', 'mantenimiento'))`
- `created_by uuid not null references public.profiles(id) on delete restrict`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 5. Dia de rutina

- Representa cada dia dentro de una rutina semanal.
- Permite organizar la rutina en multiples dias.
- Mantiene clara la estructura semanal del MVP.
- Relacion:
  - un dia pertenece a una sola rutina plantilla
  - un dia tiene muchas filas de ejercicios
- Atributos minimos:
  - `id`
  - `routine_id`
  - `day_order`
  - `day_name` opcional
  - `created_at`

#### Traduccion SQL

- `id uuid primary key`
- `routine_id uuid not null references routine_templates(id) on delete cascade`
- `day_order integer not null`
- `day_name text`
- `created_at timestamptz not null default now()`
- `unique (routine_id, day_order)`
- `day_order` debe ser mayor a `0`

### 6. Fila o item de rutina

- Representa cada linea de ejercicio dentro de un dia.
- Debe contener la referencia al ejercicio y las columnas funcionales del MVP.
- Es la pieza que materializa la tabla visible para el usuario.
- Relacion:
  - una fila pertenece a un solo dia de rutina
  - una fila referencia a un solo ejercicio
- Atributos minimos:
  - `id`
  - `routine_day_id`
  - `exercise_id`
  - `series`
  - `repetitions`
  - `rir`
  - `rest`
  - `row_order`
  - `created_at`

#### Traduccion SQL

- `id uuid primary key`
- `routine_day_id uuid not null references routine_days(id) on delete cascade`
- `exercise_id uuid not null references exercises(id) on delete restrict`
- `series integer not null`
- `repetitions text not null`
- `rir integer not null`
- `rest text not null`
- `row_order integer not null`
- `created_at timestamptz not null default now()`
- `unique (routine_day_id, row_order)`
- `series` debe ser mayor a `0`
- `rir` debe ser mayor o igual a `0`
- `row_order` debe ser mayor a `0`

### 7. Rutina guardada por usuario

- Representa la seleccion de una rutina plantilla dentro de la cuenta del usuario.
- Permite que un usuario tenga mas de una rutina guardada.
- Debe soportar nombre propio o renombrado desde el dashboard.
- Relacion:
  - un usuario puede tener muchas rutinas guardadas
  - cada rutina guardada pertenece a un solo usuario
  - cada rutina guardada referencia a una sola rutina plantilla
- La rutina guardada no duplica toda la estructura semanal salvo que mas adelante se necesite una razon fuerte para hacerlo.
- Atributos minimos:
  - `id`
  - `user_id`
  - `routine_template_id`
  - `custom_name` opcional
  - `is_active`
  - `saved_at`
  - `updated_at`

#### Traduccion SQL

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `routine_template_id uuid not null references routine_templates(id) on delete cascade`
- `custom_name text`
- `is_active boolean not null default false`
- `saved_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## Rutinas guardadas por usuario

La tabla de rutinas guardadas funciona como capa de asignacion entre el usuario y la plantilla elegida.

Eso permite:

- guardar una o varias rutinas por usuario
- renombrar la rutina desde el dashboard sin tocar la plantilla original
- marcar una sola rutina guardada como activa por usuario
- mantener una sola fuente de verdad para la estructura semanal
- evitar duplicacion innecesaria de dias y filas

La rutina guardada debe leer el contenido de la plantilla asociada, no replicarlo por defecto.

## Decisiones de simplicidad aprobadas

- no se crea tabla separada de roles
- no se crea sistema de permisos configurable
- no se duplica toda la rutina cuando el usuario la guarda
- no se crea media library avanzada
- no se agregan tablas auxiliares de tags, categorias o estados
- no se agregan analytics, notas avanzadas ni tracking por serie

## Entidades que no entran por ahora

- analytics de uso
- progreso fisico
- mediciones corporales
- historial avanzado visible para el usuario
- mensajeria interna
- pagos
- notificaciones complejas
- versionado avanzado de rutinas
- funciones sociales

## Campos que se mantienen fuera por ahora

Para evitar sobrecargar el modelo, no se agregan en este punto campos como:

- estados de progreso avanzados
- metricas fisicas
- notas extensas por ejercicio
- tags complejos
- prioridad de rutina
- versionado de plantillas
- historial de cambios por fila
- configuraciones avanzadas de visibilidad
- media library compleja
- galerias multiples por ejercicio
- variantes de imagen por formato o resolucion

## Regla de estructura semanal

La rutina semanal del MVP queda representada asi:

- `routine_templates` como contenedor principal
- `routine_days` como particion por dia
- `routine_items` como filas con ejercicios y sus parametros

Esta estructura permite:

- construir rutinas con varios dias
- agregar varias filas por dia
- recuperar la rutina completa sin duplicar informacion
- mantener el modelo legible para catalogo, dashboard y admin

## Revision de simplificacion

Se reviso si el modelo podia reducirse aun mas y la conclusion es:

- `profiles` se mantiene porque el rol de aplicacion no debe depender solo de `auth.users`
- `routine_days` se mantiene porque una rutina semanal necesita multiples dias de forma clara
- `routine_items` se mantiene porque las filas tienen datos propios y orden propio
- `saved_routines` se mantiene porque el usuario necesita guardar varias rutinas y asignarles nombre propio

Conclusion:

El modelo actual ya esta en un punto razonablemente minimo para cubrir el MVP sin perder claridad ni obligarnos a meter datos estructurados en campos menos adecuados.

## Resultado de esta etapa

Con este paso queda pactado el conjunto minimo de piezas de datos que necesitaremos para seguir con los atributos, relaciones y reglas del modelo.

## Fuente de verdad

Este documento queda establecido como la fuente de verdad del modelo de datos inicial del MVP de GymControl.

Mientras el alcance del MVP no cambie, los grupos tecnicos posteriores deben apoyarse en este documento para implementar:

- configuracion inicial de base de datos
- autenticacion y roles
- persistencia de ejercicios
- persistencia de rutinas semanales
- relacion entre usuarios y rutinas guardadas

Si en el futuro se necesita modificar el esquema, primero debe actualizarse este documento junto con la justificacion correspondiente.

## Estado de implementacion real en Supabase

Estado al 2026-06-01:

- el esquema pactado en este documento no fue redisenado
- se aplico la migracion final `supabase/migrations/20260601_g2_mvp_base_schema.sql` en el proyecto Supabase
- se verifico por MCP que el esquema `public` del proyecto estaba vacio antes de aplicar la migracion
- la migracion local quedo consolidada como version final de G2.1 antes de aplicar en Supabase
- la implementacion real en Supabase quedo completada desde el alias `supabase_gymcontrol`

Estado confirmado despues de aplicar:

- `public` quedo con `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines`
- la migracion quedo registrada en Supabase como `20260601_g2_mvp_base_schema`
- el esquema remoto coincide con la version consolidada de G2.1
- la sesion MCP reporto que RLS estaba deshabilitado en las 6 tablas del esquema antes de `G5.5`

Estado confirmado de seguridad despues de `G5.5`:

- `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items` y `saved_routines` quedan con RLS habilitado
- el catalogo base queda publico en lectura para `anon` y `authenticated`
- las escrituras administrativas sobre catalogo quedan cerradas a `admin`
- `saved_routines` queda aislada por `auth.uid() = user_id`
- `profiles` queda limitado a lectura propia, lectura admin y actualizacion propia sin cambios de `type_rol`
- el esquema base de `G2.1` no cambia; solo se endurece acceso y grants
- la migracion remota activa es `supabase/migrations/20260608_g55_mvp_rls_policies.sql`

Estado confirmado de alineacion despues de `G9`:

- `saved_routines` queda alineada con esta fuente de verdad mediante la migracion `supabase/migrations/20260609_g9_saved_routines_unique.sql`
- existe la constraint unica `saved_routines_user_id_routine_template_id_key` sobre `(user_id, routine_template_id)`
- el comportamiento esperado queda fijado en una sola plantilla guardable por usuario

Estado confirmado de metadata de rutinas despues de la transicion visual del catalogo:

- `routine_templates` incorpora `difficulty` y `objective`
- ambas columnas quedan con `not null`, defaults de backfill y `check` cerrado de valores permitidos
- la migracion versionada es `supabase/migrations/20260609_g8_routine_template_metadata.sql`
- la UI admin pasa a exigir esta metadata y el catalogo la consume como filtro real

Estado confirmado de rutina activa despues del rediseño de `/dashboard`:

- `saved_routines` incorpora `is_active boolean not null default false`
- existe un indice unico parcial para permitir como maximo una rutina activa por usuario
- el backfill marca como activa la primera rutina guardada de cada usuario
- `is_active` no duplica la estructura semanal ni agrega tracking de progreso

Estado confirmado de storage despues de `G6`:

- existe el bucket publico `exercise-images`
- `storage.buckets` fija `file_size_limit = 5242880` y `allowed_mime_types = ['image/jpeg', 'image/png', 'image/webp']`
- `storage.objects` permite lectura publica del bucket y escritura, actualizacion y borrado solo para usuarios admin autenticados
- `exercises.image_url` guarda la URL publica final del objeto subido

Estado confirmado de tracking despues de la vista diaria interactiva:

- existen `workout_sessions` y `workout_session_items` con RLS owner-only
- `workout_sessions` fija una sola sesion por `(user_id, saved_routine_id, routine_day_id, training_date)`
- `workout_session_items` guarda `performed_reps`, `used_weight` (texto, valores por serie separados por `/`) nullable e `is_completed` por `routine_item_id`
- las migraciones versionadas son `supabase/migrations/20260609_g15_workout_tracking.sql`, `supabase/migrations/20260609_g16_workout_tracking_policy_hardening.sql` y `workout_session_items_text_reps_weight`

Bootstrap admin minimo:

- debe existir al menos un usuario verificable con `type_rol = admin` antes de validar G5, G5.5, G6 o G7
- por ahora no se agrega un seed permanente al repo
- el alta o promocion inicial de admin se documenta como bootstrap manual controlado via Supabase o MCP mientras el MVP siga chico

Procedimiento operativo actual:

1. crear o autenticar una cuenta desde la app por `OTP por email` o `Google OAuth`
2. confirmar que el trigger `handle_new_user()` haya creado su fila en `public.profiles`
3. promocionar la cuenta con `update public.profiles set type_rol = 'admin' where user_id = '<auth_user_id>'`
4. cerrar sesion y volver a entrar para validar redireccion y visibilidad admin

Nota de continuidad:

- `G13` ya reemplazo el acceso principal por `OTP por email + Google OAuth`
- el bootstrap admin sigue dependiendo de que la cuenta autenticada termine con fila valida en `profiles`
- no se creo una tabla `users` separada para esta transicion
- se conserva el trigger `handle_new_user()` sobre `auth.users`
- la convergencia entre OTP y Google se apoya en el identity linking automatico de Supabase cuando el email coincide

Conclusion operativa:

- el diseno G2 sigue cerrado y vigente
- la implementacion fisica de G2 ya quedo aplicada en Supabase
- `G5.5` ya quedo aplicado con validacion remota
- `G6` agrega el bucket `exercise-images` y deja cerrado el flujo base de imagenes para ejercicios

## Traduccion SQL preliminar para G2.1

Esta seccion fija el criterio tecnico minimo para pasar el modelo a Supabase sin cambiar el alcance funcional pactado.

### Criterios comunes

- usar `uuid` como tipo de clave primaria en tablas propias
- usar `gen_random_uuid()` como default para nuevos IDs
- usar `timestamptz` para marcas de tiempo
- usar `now()` como default para `created_at`
- mantener `updated_at` como columna presente en tablas editables y actualizarla por trigger de base
- usar `text` para campos de contenido libre
- usar `integer` para ordenes y contadores simples

### Utilidades comunes

- habilitar `pgcrypto` para disponer de `gen_random_uuid()`
- crear una funcion reutilizable `set_updated_at()` para reasignar `updated_at = now()`
- usar un trigger `before update` en cada tabla editable para invocar esa funcion
- no crear mas helpers compartidos que los estrictamente necesarios para este MVP

### `profiles`

- `id uuid primary key`
- `user_id uuid not null unique references auth.users(id) on delete cascade`
- `type_rol text not null check (type_rol in ('admin', 'user'))`
- `display_name text` (g26, nombre para mostrar/personalizar la UI)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `exercises`

- `id uuid primary key`
- `name text not null`
- `description text not null`
- `image_url text not null`
- `created_by uuid not null references public.profiles(id) on delete restrict`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `muscle_group text check (muscle_group in ('Pecho','Espalda','Piernas','Hombros','Biceps','Triceps','Core'))`
- `equipment text check (equipment in ('Barra','Mancuernas','Maquina','Polea','Peso corporal','Kettlebell'))`
- `video_url text`
- `min_reps integer` / `max_reps integer` (rango de reps ideales; ambos null o ambos definidos con `min_reps >= 1 and min_reps <= max_reps`, via `exercises_rep_range_check`)
- `steps text[] not null default '{}'` (pasos de ejecucion, tab Tecnica)
- `tips text[] not null default '{}'` (claves de tecnica, tab Tecnica)

### `routine_templates`

- `id uuid primary key`
- `name text not null`
- `description text`
- `difficulty text not null default 'intermedio'`
- `objective text not null default 'mantenimiento'`
- `created_by uuid not null references public.profiles(id) on delete restrict`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `routine_days`

- `id uuid primary key`
- `routine_id uuid not null references routine_templates(id) on delete cascade`
- `day_order integer not null`
- `day_name text`
- `created_at timestamptz not null default now()`
- unique por rutina y orden de dia

### `routine_items`

- `id uuid primary key`
- `routine_day_id uuid not null references routine_days(id) on delete cascade`
- `exercise_id uuid not null references exercises(id) on delete restrict`
- `series integer not null`
- `repetitions integer not null`
- `rir integer not null`
- `rest integer not null`
- `row_order integer not null`
- `created_at timestamptz not null default now()`
- unique por dia y orden de fila

### `saved_routines`

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `routine_template_id uuid not null references routine_templates(id) on delete cascade`
- `custom_name text`
- `is_active boolean not null default false`
- `saved_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- unique por usuario y rutina plantilla

### `workout_sessions`

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `saved_routine_id uuid not null references saved_routines(id) on delete cascade`
- `routine_day_id uuid not null references routine_days(id) on delete cascade`
- `training_date date not null`
- `status text not null default 'in_progress'`
- `completed_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- unique por `user_id`, `saved_routine_id`, `routine_day_id`, `training_date`

### `workout_session_items`

- `id uuid primary key`
- `workout_session_id uuid not null references workout_sessions(id) on delete cascade`
- `routine_item_id uuid not null references routine_items(id) on delete cascade`
- `performed_reps text` (valores por serie separados por `/`, ej. `"12/10/8"`)
- `used_weight text` (valores por serie separados por `/`, ej. `"40/40/35"`)
- `is_completed boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- unique por `workout_session_id`, `routine_item_id`

### Observaciones de implementacion

- `profiles` es la unica tabla del modelo que debe quedar estrictamente 1 a 1 con `auth.users`
- `routine_days` y `routine_items` necesitan constraints de unicidad para sostener orden estable
- `saved_routines` no duplica estructura semanal
- `workout_sessions` no duplica la plantilla: solo registra ejecucion real por fecha
- `workout_sessions` necesita unique por fecha para evitar sesiones duplicadas del mismo dia
- `workout_session_items` necesita unique por sesion y fila para sostener correcciones simples
- G2.1 no agrega RLS, storage, seeds ni tablas auxiliares
- RLS y policies se resuelven inmediatamente despues de auth en `G5.5`

### Constraints e indices minimos finales

El esquema queda cerrado con estas reglas adicionales, que ya forman parte de la base minima de G2.1:

- `profiles.user_id` es `unique`
- `routine_days` tiene `unique (routine_id, day_order)`
- `routine_items` tiene `unique (routine_day_id, row_order)`
- `day_order`, `series` y `row_order` tienen `check` de positividad
- `rir` tiene `check` de no negatividad
- se agregan indices simples sobre las columnas de referencia mas consultadas:
  - `exercises.created_by`
  - `routine_templates.created_by`
  - `routine_days.routine_id`
  - `routine_items.routine_day_id`
  - `routine_items.exercise_id`
  - `saved_routines.user_id`
  - `saved_routines.routine_template_id`
  - `saved_routines(user_id) where is_active`
  - `workout_sessions.user_id`
  - `workout_sessions.saved_routine_id`
  - `workout_sessions.training_date`
  - `workout_sessions.routine_day_id`
  - `workout_session_items.workout_session_id`
  - `workout_session_items.routine_item_id`

No se agregan indices compuestos ni optimizaciones prematuras.

## Apartado de nutricion (G18)

Migraciones: `20260613_g18_nutrition_core.sql` (esquema + RLS + storage), `20260613_g19_nutrition_seed.sql` (seed de alimentos y dietas).

### `foods`

- `id uuid primary key`
- `name text not null`
- `image_url text not null` (sin uso por ahora, catalogo usa iconos por categoria)
- `category text not null check (category in ('protein','carb','fat','vegetable','mixed'))`
- `serving_g integer not null default 100 check (serving_g > 0)`
- `measure text not null default 'g' check (measure in ('g','unit'))` (medida por defecto, g22)
- `grams_per_unit numeric check (grams_per_unit is null or grams_per_unit > 0)` (g24; si esta seteado, el alimento se puede registrar tambien por unidades/porciones)
- `calories integer not null check (calories >= 0)`
- `protein_g integer not null check (protein_g >= 0)`
- `carbs_g integer not null check (carbs_g >= 0)`
- `fat_g integer not null check (fat_g >= 0)`
- `created_by uuid not null references profiles(id) on delete restrict`
- `created_at`, `updated_at`
- RLS: lectura publica (anon + authenticated), escritura solo admin (mismo patron que `exercises`)

### `nutrition_profiles`

- `id uuid primary key`
- `user_id uuid not null unique references auth.users(id) on delete cascade`
- `gender text not null check (gender in ('male','female'))`
- `age integer not null check (age > 0)`
- `height_cm numeric not null check (height_cm > 0)`
- `weight_kg numeric not null check (weight_kg > 0)`
- `body_fat_pct numeric` (nullable, `check (0 < body_fat_pct < 100)`)
- `activity_level text not null check (...)`, `goal text not null check (...)`
- columnas cacheadas del calculo: `bmr_kcal`, `maintenance_kcal`, `target_kcal`, `protein_g`, `carbs_g`, `fat_g` (todas `integer >= 0`)
- `created_at`, `updated_at`
- RLS: owner-only (`auth.uid() = user_id`) para select/insert/update/delete, mismo patron que `saved_routines`

### Storage `food-images`

Bucket publico (5MB, jpg/png/webp), mismas policies que `exercise-images` (lectura publica, escritura admin). Creado para uso futuro; el admin de alimentos actual no sube imagenes.

### Indices

- `foods.created_by`, `foods.category`

## Apartado de nutricion - extras (G21)

Migracion: `20260613_g21_nutrition_fase3.sql`. Nota: las dietas predefinidas (`diet_templates`, `diet_template_meals`, `saved_diets`) se eliminaron en `g25_drop_diets`, reemplazadas por el registro diario (`meal_logs`).

### `meal_logs`

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `log_date date not null`
- `created_at`, `updated_at`
- unique por `(user_id, log_date)`
- RLS: owner-only, mismo patron que `workout_sessions`

### `meal_log_meals` (g23)

- `id uuid primary key`
- `meal_log_id uuid not null references meal_logs(id) on delete cascade`
- `name text not null`, `position integer not null`
- agrupa los items de una comida del dia (ej. "Desayuno")

### `meal_log_items`

- `id uuid primary key`
- `meal_id uuid not null references meal_log_meals(id) on delete cascade`
- `food_id uuid not null references foods(id) on delete restrict`
- `grams numeric(7,1) not null check (grams > 0)` (valor autoritativo para macros)
- `measure text not null default 'g' check (measure in ('g','unit'))` (g24, lo que ingreso el usuario)
- `quantity numeric not null check (quantity > 0)` (g24, cantidad en `measure`)
- `created_at`
- RLS: owner-only via `meal_logs.user_id`, mismo patron que `workout_session_items`

### Indices

- `meal_logs.user_id`, `meal_logs.log_date`
- `meal_log_items.food_id`

## Recetas (G26-27)

### `recipes`

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `description text`
- `image_url text`
- `category text not null check (category in ('protein','carb','fat','vegetable','mixed'))`
- `servings integer not null default 1 check (servings > 0)`
- `created_by uuid references profiles(id)`
- `created_at`, `updated_at`
- RLS: lectura publica, escritura solo admin (mismo patron que `foods`)

### `recipe_items`

- `id uuid primary key default gen_random_uuid()`
- `recipe_id uuid not null references recipes(id) on delete cascade`
- `food_id uuid not null references foods(id) on delete restrict`
- `grams numeric(7,1) not null check (grams > 0)`
- macros del item se derivan en runtime: `food.{calories,protein_g,carbs_g,fat_g} * (grams / food.serving_g)`, mismo patron que `meal_log_items`
- RLS: lectura publica, escritura solo admin

### Indices

- `recipes.category`
- `recipe_items.recipe_id`, `recipe_items.food_id`
