# Project Foundations

## Proposito del producto

GymControl sera una aplicacion web para gestion de rutinas de gimnasio con dos perfiles principales:

- Admin: crea y administra ejercicios y rutinas semanales.
- Usuario: explora rutinas, elige una o varias, las guarda en su cuenta y les asigna nombres propios.

## Vision inicial del MVP

El MVP debe permitir validar el flujo principal de administracion y consumo de rutinas sin agregar complejidad innecesaria.

### Alcance funcional inicial

#### 1. Gestion de ejercicios por admin

El admin, y solo el admin, debe poder:

- Crear ejercicios.
- Guardar cada ejercicio en base de datos.
- Definir para cada ejercicio:
  - nombre
  - descripcion o explicacion
  - imagen

#### 2. Gestion de rutinas por admin

El admin, y solo el admin, debe poder:

- Crear rutinas semanales.
- Guardarlas en base de datos.
- Organizar la rutina en multiples dias.
- Definir en cada fila de trabajo las columnas:
  - ejercicio
  - series
  - repeticiones
  - RIR
  - descanso

#### 3. Restriccion por rol

Todas las capacidades administrativas deben existir unicamente si el usuario autenticado tiene `type_rol = "admin"`.

Esto implica:

- acceso a admin dashboard
- proteccion de vistas administrativas
- proteccion de acciones de escritura

#### 4. Consumo de rutinas por usuario

El usuario debe poder:

- ver rutinas en formato catalogo
- elegir una o varias rutinas
- guardar esa seleccion en base de datos
- asignar nombres propios a sus rutinas desde su dashboard

#### 5. Consulta de detalle de ejercicio

En cualquier vista donde aparezca un ejercicio, debe existir la posibilidad de hacer click sobre el ejercicio para abrir un emergente sin abandonar la pagina actual.

Ese emergente debe mostrar una card con:

- nombre
- imagen
- descripcion o explicacion

## Entidades conceptuales del dominio

Sin definir aun el modelo final, el dominio minimo del producto gira alrededor de estas piezas:

- Usuario
- Rol de usuario
- Ejercicio
- Rutina plantilla creada por admin
- Dia de rutina semanal
- Item o fila de rutina
- Rutina asignada o guardada por usuario

## Principios del MVP

- Priorizar claridad de uso antes que sofisticacion.
- Resolver primero el flujo admin -> catalogo -> seleccion de rutina -> consulta de ejercicios.
- Mantener el numero de entidades y relaciones tan simple como sea viable.
- Evitar features que no aporten validacion temprana del producto.
- Disenar para crecer luego, pero implementar solo lo necesario ahora.

## Fuera de alcance por ahora

Estos puntos no quedan comprometidos en esta etapa:

- seguimiento avanzado de progreso
- metricas fisicas del usuario
- mensajeria interna
- planes de pago
- notificaciones complejas
- versionado avanzado de rutinas
- social features

## Resultado esperado de esta fase documental

Antes de construir el MVP se deben dejar definidos y guardados por separado:

- arquitectura completa
- base de datos
- skills y agentes necesarios
- plan de ejecucion por grupos y pasos
