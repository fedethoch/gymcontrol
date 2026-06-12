# G6 - Admin Exercises

Este grupo implementa la gestion de ejercicios desde el admin dashboard sobre la tabla `exercises` ya existente.

## Objetivo del grupo

Permitir al admin crear y consultar ejercicios persistidos con nombre, descripcion e imagen, y dejar esos datos listos para reutilizacion transversal sin redefinir esquema.

## Orden recomendado

1. `01-implementar-modelo-persistente-de-ejercicio.md`
2. `02-implementar-validaciones-de-alta-y-edicion.md`
3. `03-resolver-almacenamiento-o-referencia-de-imagenes.md`
4. `04-crear-vista-de-listado-de-ejercicios-en-admin-dashboard.md`
5. `05-crear-formulario-para-alta-de-ejercicio.md`
6. `06-crear-edicion-basica-de-ejercicio-si-aplica.md`
7. `07-exponer-datos-de-ejercicio-para-consumo-transversal.md`
8. `08-verificar-persistencia-y-recuperacion-correcta.md`

## Resultado esperado

Tener el recurso ejercicio estable y reutilizable para rutinas, catalogo y modal.

## Dependencias

- `G2` aplicado en Supabase
- `G5` cerrado con Supabase Auth
- `G5.5` cerrado con RLS y policies minimas
