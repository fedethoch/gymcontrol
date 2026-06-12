# Flujos principales

### Flujo admin para crear ejercicios

Objetivo del flujo:

- permitir que un admin cree un ejercicio nuevo desde el admin dashboard

Secuencia esperada:

1. el admin entra al admin dashboard
2. abre la seccion de ejercicios
3. accede al formulario de alta
4. completa nombre, descripcion o explicacion e imagen
5. la validacion revisa los datos ingresados
6. la logica de aplicacion verifica que el usuario tenga rol admin
7. la capa de datos guarda el ejercicio
8. la vista confirma el exito y actualiza el listado

Puntos de control:

- el flujo solo debe ser accesible para `type_rol = "admin"`
- la validacion debe ocurrir antes de guardar
- el resultado debe quedar visible luego en el listado de ejercicios
- el flujo debe volver a una vista util para seguir administrando

No incluye:

- edicion avanzada de ejercicios
- gestion de multiples imagenes
- versionado del recurso
- variantes de formulario fuera del MVP

### Flujo admin para crear rutinas semanales

Objetivo del flujo:

- permitir que un admin cree una rutina semanal nueva desde el admin dashboard

Secuencia esperada:

1. el admin entra al admin dashboard
2. abre la seccion de rutinas
3. accede al builder o formulario de rutina
4. define la rutina como contenedor semanal
5. agrega uno o mas dias dentro de la rutina
6. agrega filas de ejercicios dentro de cada dia
7. completa ejercicio, series, repeticiones, RIR y descanso
8. la validacion revisa la estructura y los datos ingresados
9. la logica de aplicacion verifica que el usuario tenga rol admin
10. la capa de datos guarda la rutina, sus dias y sus filas
11. la vista confirma el exito y actualiza el listado de rutinas

Puntos de control:

- el flujo solo debe ser accesible para `type_rol = "admin"`
- la rutina debe conservar estructura semanal
- cada dia debe poder contener multiples filas
- las filas deben referenciar ejercicios existentes
- el flujo debe volver a una vista util para seguir administrando

No incluye:

- builder visual complejo
- duplicacion automatica avanzada
- versionado de rutinas
- plantillas dinamicas fuera del MVP

### Flujo usuario para explorar, elegir, guardar y renombrar rutinas

Objetivo del flujo:

- permitir que un usuario explore el catalogo, vea una rutina, la guarde en su cuenta y luego la renombre desde su dashboard

Secuencia esperada:

1. el usuario entra al catalogo de rutinas
2. revisa el listado de rutinas disponibles
3. abre el detalle de una rutina
4. revisa su estructura semanal
5. puede abrir el detalle de ejercicios desde el contenido de la rutina
6. decide guardar la rutina en su cuenta
7. la logica de aplicacion verifica que exista sesion de usuario autenticado
8. la capa de datos crea la relacion entre usuario y rutina guardada
9. la vista confirma el guardado exitoso
10. el usuario entra a su dashboard
11. ve las rutinas guardadas
12. asigna o edita un nombre propio a una rutina guardada
13. la validacion revisa el cambio
14. la capa de datos persiste el nuevo nombre
15. la vista confirma el cambio y actualiza el listado

Puntos de control:

- el usuario puede guardar mas de una rutina
- el nombre personalizado pertenece a la rutina guardada del usuario, no a la plantilla global
- el flujo debe mantenerse simple y no depender de funciones fuera de alcance
- el detalle del ejercicio debe seguir disponible desde esta experiencia

No incluye:

- seguimiento de progreso
- historial de entrenamiento
- duplicacion automatica avanzada
- recomendaciones personalizadas
- rutinas compartidas socialmente

### Flujo del modal de detalle de ejercicio

Objetivo del flujo:

- permitir que el usuario consulte el detalle de un ejercicio sin abandonar la vista actual

Secuencia esperada:

1. el usuario ve una rutina o listado donde aparecen ejercicios clickeables
2. hace click sobre un ejercicio
3. la interaccion abre un modal o card emergente reutilizable
4. la vista conserva el contexto de la pagina original
5. el modal muestra nombre, imagen y descripcion o explicacion del ejercicio
6. el usuario puede cerrar el modal cuando termina de consultar
7. al cerrar, vuelve exactamente al contexto donde estaba trabajando

Puntos de control:

- el modal debe funcionar en catalogo, dashboard de usuario y otras vistas donde se muestre un ejercicio
- el detalle no debe reemplazar la pagina actual
- el componente debe ser reutilizable y no depender de una sola vista
- el contenido minimo es suficiente para resolver dudas del usuario

No incluye:

- pagina dedicada compleja por ejercicio
- contenido multimedia adicional no requerido
- navegacion profunda o modal encadenado
- variantes distintas de detalle por contexto

### Flujo de acceso vigente

El acceso vigente usa Supabase Auth con dos entradas compatibles entre si:

- `OTP por email de 6 digitos` como flujo principal
- `Google OAuth` como flujo alternativo
- la misma resolucion final de rol sobre `profiles.type_rol`
- callback SSR reservado a `Google OAuth`
