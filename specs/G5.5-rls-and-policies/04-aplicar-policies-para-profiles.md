# Aplicar policies para profiles: limitar lectura y edicion del perfil de aplicacion

**Grupo:** G5.5 - RLS y policies  
**Orden:** 4  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Aplicar las policies minimas para `profiles`, permitiendo acceso al propio perfil y acceso administrativo cuando corresponda.

## Estado

Completado.

## Archivos

- `docs/DATABASE.md`
- migraciones o SQL de policies
- `PLAN.md`

## Pasos

1. Definir lectura del propio perfil por usuario autenticado.
2. Definir actualizacion minima del propio perfil si el MVP la necesita.
3. Definir lectura o gestion administrativa cuando haga falta.
4. Evitar exposicion horizontal entre usuarios comunes.

## Criterios de aceptacion

- Un usuario no puede leer o editar perfiles ajenos sin permiso.
- El admin conserva la capacidad que el MVP necesite.
- `profiles` queda alineada con `type_rol`.

## Resolucion

- `select`: el usuario puede leer su propio perfil y admin puede leer todos
- `update`: el usuario solo puede actualizar su propio perfil y sin cambiar `type_rol`
- no se habilitaron `insert` ni `delete` desde clientes

## Validacion

- Verificar lectura del propio perfil.
- Verificar denegacion para perfiles ajenos.

## Estado final

Completado.
