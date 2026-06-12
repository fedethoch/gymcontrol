# G7 - Admin Routines

Este grupo implementa la creacion y gestion de rutinas semanales desde administracion sobre las tablas ya creadas en G2.

## Objetivo del grupo

Permitir al admin crear rutinas con multiples dias y filas de ejercicios, manteniendo una estructura simple y consistente sin redefinir el modelo.

## Orden recomendado

1. `01-implementar-persistencia-de-rutina-plantilla.md`
2. `02-implementar-persistencia-de-dias-de-rutina-semanal.md`
3. `03-implementar-persistencia-de-filas-de-ejercicio.md`
4. `04-crear-listado-de-rutinas-en-admin-dashboard.md`
5. `05-crear-builder-o-formulario-de-rutina-semanal.md`
6. `06-permitir-agregar-multiples-dias-a-una-rutina.md`
7. `07-permitir-agregar-multiples-filas-de-ejercicios-por-dia.md`
8. `08-validar-recuperacion-de-rutina-con-estructura-completa.md`
9. `09-verificar-consistencia-de-referencias-a-ejercicios.md`

## Resultado esperado

Tener rutinas semanales completas y listas para ser publicadas en catalogo.

## Dependencias

- `G2` aplicado en Supabase
- `G5` cerrado con Supabase Auth
- `G5.5` cerrado con RLS y policies minimas
