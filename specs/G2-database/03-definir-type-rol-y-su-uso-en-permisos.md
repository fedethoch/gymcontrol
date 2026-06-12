# Definir type_rol y su uso en permisos: representar el control minimo de acceso en datos

**Grupo:** G2 - Base de datos  
**Orden:** 3  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Definir como se representa `type_rol` en el modelo de datos y como esa definicion soporta los permisos requeridos por el MVP.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `PLAN.md`

## Pasos

1. Revisar el requerimiento de acceso exclusivo del admin.
2. Definir si `type_rol` vive directamente en usuario o si necesita otra representacion.
3. Elegir la opcion mas simple que cubra el MVP.
4. Documentar como se usara este campo en autenticacion y autorizacion.

## Criterios de aceptacion

- `type_rol` queda representado de forma simple y clara.
- La decision soporta el acceso exclusivo al admin dashboard y a acciones administrativas.
- No se introduce un sistema de permisos mas complejo del necesario.

## Resolucion

`type_rol` queda representado como un campo directo en `profiles`, con valores iniciales `admin` y `user`, sin introducir una capa adicional de permisos.

## Validacion

- Verificar que el modelo permita distinguir admin de usuario normal sin ambiguedad.
- Verificar que la decision sea coherente con la arquitectura del proyecto.

## Estado final

Completado.
