# Capas minimas del sistema

Para este MVP, la arquitectura se apoya en estas capas minimas:

- UI y vistas
- componentes compartidos
- logica de aplicacion
- validacion
- persistencia y acceso a datos

No se deben agregar capas intermedias adicionales salvo que aparezca una necesidad real y concreta.

## Responsabilidades por capa

### 1. UI y vistas

Esta capa debe encargarse de:

- renderizar pantallas y secciones del producto
- organizar la experiencia visual del usuario
- disparar acciones de lectura o escritura
- mostrar estados de carga, error, vacio y exito
- conectar interacciones del usuario con la logica correspondiente

Esta capa no debe encargarse de:

- reglas de negocio importantes
- permisos reales de escritura
- decisiones de persistencia
- transformaciones complejas de datos

### 2. Componentes compartidos

Esta capa debe encargarse de:

- encapsular piezas reutilizables de interfaz
- unificar patrones visuales y de interaccion
- recibir datos ya preparados desde las vistas o la logica

Esta capa no debe encargarse de:

- conocer detalles de base de datos
- contener logica de dominio acoplada a un flujo especifico
- ejecutar permisos o escrituras sensibles por su cuenta

### 3. Logica de aplicacion

Esta capa debe encargarse de:

- orquestar los casos de uso del MVP
- resolver flujos como crear ejercicio, crear rutina, guardar rutina o renombrarla
- aplicar reglas funcionales del producto
- decidir que operaciones de datos ejecutar
- centralizar protecciones funcionales ligadas a autenticacion y rol

Esta capa no debe encargarse de:

- renderizado de interfaz
- detalles de presentacion visual
- consultas SQL o persistencia embebida directamente en la UI

### 4. Validacion

Esta capa debe encargarse de:

- validar entradas de formularios y acciones
- asegurar integridad basica de datos antes de persistir
- devolver errores claros y consistentes

Esta capa no debe encargarse de:

- renderizar la respuesta final al usuario
- reemplazar la logica de negocio completa
- asumir persistencia por si sola

### 5. Persistencia y acceso a datos

Esta capa debe encargarse de:

- leer y escribir en base de datos
- resolver relaciones entre entidades del MVP
- exponer operaciones claras para usuarios, ejercicios, rutinas y rutinas guardadas

Esta capa no debe encargarse de:

- decisiones de UX
- reglas de presentacion
- permisos definidos solo por interfaz

## Fronteras operativas

Para mantener el proyecto simple, deben respetarse estas fronteras:

- la UI pide datos o dispara acciones, pero no define la persistencia
- la logica de aplicacion decide el flujo funcional, pero no renderiza vistas
- la validacion corre antes de escribir y no debe quedar solo en la interfaz si el dato es sensible
- la capa de datos persiste y recupera informacion, pero no decide experiencia de usuario

## Fronteras de lectura y escritura

### Lectura

La lectura debe seguir este camino:

- la vista solicita informacion
- la logica o capa de lectura prepara lo necesario
- la capa de datos resuelve la consulta
- la vista renderiza el resultado

### Escritura

La escritura debe seguir este camino:

- la vista captura la accion del usuario
- la validacion revisa la entrada
- la logica de aplicacion verifica reglas y permisos
- la capa de datos ejecuta la persistencia
- la vista muestra el resultado

## Regla especial para permisos

Todo permiso relevante para admin debe controlarse fuera de la UI.

Eso significa:

- ocultar botones ayuda, pero no alcanza
- crear o editar ejercicios y rutinas debe estar protegido en la capa de logica o servidor
- el acceso al admin dashboard debe resolverse mediante autenticacion y rol, no solo navegacion visual

## Regla de implementacion

Si durante el desarrollo aparece una duda sobre donde ubicar algo, la decision recomendada es:

- si muestra informacion o captura interaccion, va en UI
- si reutiliza presentacion, va en componente compartido
- si define comportamiento del producto, va en logica de aplicacion
- si valida entradas, va en validacion
- si toca base de datos, va en persistencia
