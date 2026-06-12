# Integrar acceso admin en el shell general: unificar la entrada administrativa sin duplicar la experiencia base

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 14  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Integrar el acceso a administracion dentro del shell general del producto, contemplando que el admin tambien usa la experiencia base de usuario.

## Estado

Completado.

## Archivos

- `app/layout.tsx`
- componentes de navegacion compartida
- `docs/ARCHITECTURE.md`

## Pasos

1. Definir donde aparece el acceso admin en el shell.
2. Confirmar que no haga falta un layout separado completo.
3. Reservar el lugar para control por rol posterior.
4. Mantener la navegacion simple y coherente.

## Criterios de aceptacion

- La entrada admin queda resuelta dentro del shell general.
- La decision no agrega duplicacion innecesaria.
- G5 puede proteger el acceso sin rehacer navegacion.

## Resolucion

El acceso admin queda integrado dentro del shell general, en el mismo bloque de navegacion lateral que usa el usuario. No se crea un layout administrativo separado; G5 solo va a controlar la visibilidad y el acceso por rol.

## Validacion

- Verificar consistencia con la experiencia del usuario.
- Verificar que la integracion no ensucie el menu principal.

## Estado final

Completado.
