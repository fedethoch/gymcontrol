# Aplicar policies para saved_routines: aislar las rutinas guardadas por usuario

**Grupo:** G5.5 - RLS y policies  
**Orden:** 6  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Aplicar las policies minimas para `saved_routines`, garantizando que cada usuario solo vea y modifique sus propias rutinas guardadas.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- migraciones o SQL de policies
- `PLAN.md`

## Pasos

1. Definir lectura por propietario.
2. Definir insercion y actualizacion por propietario.
3. Definir borrado por propietario si el MVP lo incluye.
4. Evitar acceso cruzado entre usuarios.

## Criterios de aceptacion

- Cada usuario solo accede a sus propias filas.
- Las acciones de guardado y renombrado quedan soportadas.
- No se expone informacion de otras cuentas.

## Resolucion

- `select`, `insert`, `update` y `delete` quedaron limitados a filas donde `auth.uid() = user_id`
- no se agrego bypass administrativo transversal
- el comportamiento soporta guardado, renombrado y borrado por propietario

## Validacion

- Verificar lectura y escritura del propio usuario.
- Verificar denegacion sobre filas ajenas.

## Estado final

Completado.
