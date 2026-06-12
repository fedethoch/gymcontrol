# Proposito

Este documento define la base arquitectonica del proyecto GymControl.

Su primer bloque fija el alcance del MVP y luego servira para detallar modulos, fronteras, flujos y convenciones tecnicas.

## Alcance del MVP

GymControl, en su primera version, se enfoca en un flujo simple de gimnasio con dos roles principales:

- Admin, que crea ejercicios y rutinas semanales.
- Usuario, que explora rutinas, las guarda en su cuenta y les asigna nombres propios.

### Incluido en el MVP

- Gestion de ejercicios por admin.
- Creacion y guardado de ejercicios con nombre, descripcion o explicacion e imagen.
- Creacion de rutinas semanales por admin.
- Rutinas compuestas por multiples dias.
- Rutinas con filas que incluyan ejercicio, series, repeticiones, RIR y descanso.
- Restriccion de acceso administrativo mediante `type_rol = "admin"`.
- Catalogo de rutinas para exploracion del usuario.
- Guardado de una o varias rutinas en la cuenta del usuario.
- Asignacion y edicion de nombres propios para rutinas guardadas por el usuario.
- Modal o card emergente para ver el detalle de un ejercicio sin abandonar la pagina actual.

### Fuera de alcance por ahora

Las siguientes capacidades quedan excluidas del MVP inicial:

- seguimiento avanzado de progreso
- metricas fisicas del usuario
- mensajeria interna
- planes de pago
- notificaciones complejas
- versionado avanzado de rutinas
- social features

## Principios de arquitectura

- Mantener el sistema simple mientras el MVP lo permita.
- Evitar sobreingenieria.
- Separar claramente responsabilidades.
- Proteger las acciones administrativas por rol.
- Disenar para evolucionar sin rehacer todo.
- No introducir capas innecesarias.
