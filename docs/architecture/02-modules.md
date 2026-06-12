# Modulos principales del producto

### 1. Acceso y sesion

Objetivo del modulo:

- resolver autenticacion de usuario
- identificar el `type_rol` del usuario autenticado
- controlar acceso base a dashboard de usuario y admin dashboard

Incluye:

- login o flujo de acceso equivalente
- OTP por email de 6 digitos como acceso principal
- Google OAuth como acceso alternativo
- sesion autenticada
- resolucion de rol
- redirecciones y protecciones basicas
- convergencia al mismo `auth user` y `profile` cuando el email coincide

No incluye:

- sistema avanzado de permisos por capacidad
- recuperacion compleja de cuenta
- flujos de seguridad fuera del alcance del MVP

### 2. Catalogo de rutinas

Objetivo del modulo:

- mostrar al usuario las rutinas disponibles creadas por admin
- permitir explorar el detalle de cada rutina
- ofrecer el punto de entrada para guardar una rutina en la cuenta del usuario

Incluye:

- listado de rutinas
- detalle de rutina
- visualizacion de estructura semanal
- acceso al detalle de ejercicio desde la rutina

No incluye:

- filtros avanzados
- recomendaciones personalizadas
- busquedas complejas

### 3. Dashboard de usuario

Objetivo del modulo:

- mostrar las rutinas guardadas por el usuario
- permitir asignar y editar nombres propios
- permitir consultar el detalle de las rutinas guardadas

Incluye:

- listado de rutinas guardadas
- detalle de rutina guardada
- accion de renombrado
- acceso al detalle de ejercicio

No incluye:

- seguimiento de progreso
- historial de entrenamiento
- estadisticas personales

### 4. Admin dashboard

Objetivo del modulo:

- concentrar todas las capacidades exclusivas del rol admin
- permitir gestionar ejercicios y rutinas semanales

Incluye:

- listado y alta de ejercicios
- posible edicion basica de ejercicios si el MVP la requiere
- listado de rutinas
- creacion de rutinas semanales con multiples dias y filas

No incluye:

- paneles analiticos
- permisos avanzados entre distintos tipos de admin
- herramientas de gestion no requeridas por el MVP

### 5. Detalle de ejercicio

Objetivo del modulo:

- mostrar el detalle de un ejercicio sin sacar al usuario de la vista actual

Incluye:

- modal o card emergente reutilizable
- nombre del ejercicio
- imagen
- descripcion o explicacion

No incluye:

- pagina dedicada compleja por ejercicio
- contenido multimedia adicional no requerido

### 6. Capa de datos

Objetivo del modulo:

- centralizar persistencia y recuperacion de usuarios, ejercicios, rutinas y rutinas guardadas

Incluye:

- acceso a base de datos
- lectura y escritura de entidades del MVP
- soporte para relaciones entre rutinas, dias, filas y usuarios

No incluye:

- modelados avanzados fuera del MVP
- integraciones externas innecesarias

## Criterio de modularidad

La aplicacion debe mantenerse dividida por modulos funcionales claros, pero sin crear capas o submodulos artificiales.

La regla a seguir es:

- si una responsabilidad pertenece claramente a admin, vive en admin dashboard
- si pertenece al flujo del usuario final, vive en catalogo o dashboard de usuario
- si sirve en varios lugares, se resuelve como pieza compartida simple
- si solo agrega complejidad conceptual sin mejorar el trabajo, no se crea como modulo separado
