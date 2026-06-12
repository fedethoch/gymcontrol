# Permitir que el usuario tenga mas de una rutina guardada: soportar multiples elecciones del catalogo

**Grupo:** G9 - Dashboard de usuario  
**Orden:** 2  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Asegurar que el modelo y la implementacion permitan que un mismo usuario guarde mas de una rutina en su cuenta.

## Estado

Pendiente.

## Archivos

- `docs/DATABASE.md`
- acciones de guardado de rutinas
- dashboard de usuario
- `PLAN.md`

## Pasos

1. Revisar la relacion usuario -> rutinas guardadas.
2. Confirmar que el guardado no quede limitado a una sola rutina.
3. Ajustar la logica de persistencia si fuera necesario.
4. Verificar que el dashboard soporte multiples rutinas.

## Criterios de aceptacion

- Un usuario puede guardar varias rutinas.
- Las rutinas guardadas no se pisan entre si sin motivo.
- La solucion es consistente con el modelo de datos definido.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que dos o mas rutinas puedan coexistir en la cuenta del mismo usuario.
- Verificar que la solucion siga siendo simple de consultar y mantener.

## Estado final

No iniciado.
