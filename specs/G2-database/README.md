# G2 - Database

Este grupo define el modelo de datos inicial del MVP.

## Objetivo del grupo

Dejar una base de datos simple, suficiente y alineada con el alcance real del producto.

## Orden recomendado

1. `01-listar-entidades-minimas-necesarias.md`
2. `02-definir-atributos-minimos-por-entidad.md`
3. `03-definir-type-rol-y-su-uso-en-permisos.md`
4. `04-definir-relacion-rutina-dias-y-filas.md`
5. `05-definir-relacion-usuarios-y-rutinas-guardadas.md`
6. `06-definir-estrategia-para-imagenes-de-ejercicios.md`
7. `07-revisar-si-el-modelo-puede-simplificarse.md`
8. `08-redactar-documento-de-base-de-datos.md`
9. `09-guardar-acuerdo-de-minima-manipulacion.md`
10. `10-cerrar-database-md-como-fuente-de-verdad.md`

## Resultado esperado

Tener `docs/DATABASE.md` como fuente de verdad del esquema inicial del MVP.

## Bajada operativa

La implementacion real de este diseno en Supabase se ejecuta aparte en `specs/G2.1/`.

Ese subgrupo toma el modelo ya cerrado en `docs/DATABASE.md` y lo traduce a migracion, verificacion y documentacion operativa sin redefinir decisiones de fondo.
