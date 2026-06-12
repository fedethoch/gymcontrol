# Definir shell principal con panel lateral izquierdo: establecer la estructura visual base del producto

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 1  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.5

## Objetivo

Definir el shell principal del producto alrededor de un panel lateral izquierdo desplegable y un area de contenido principal que soporte toda la experiencia del MVP.

## Estado

Completado.

## Archivos

- `docs/ARCHITECTURE.md`
- `PLAN.md`
- rutas y layout actuales de `app/`

## Pasos

1. Definir la estructura principal del shell del producto.
2. Confirmar el rol del panel lateral como pieza persistente de navegacion.
3. Delimitar el area de contenido principal y sus estados base.
4. Verificar que el shell soporte usuario y admin sin duplicar layout.

## Criterios de aceptacion

- El shell del producto queda definido con claridad.
- El panel lateral izquierdo tiene un rol estructural explicito.
- La base no obliga a rehacer layout en grupos posteriores.

## Resolucion

Se definio el shell principal del producto en `docs/architecture/07-frontend-experience.md`.

Decision:

- la app usara un shell unico para usuario y admin
- el panel lateral izquierdo sera la pieza persistente de navegacion
- el contenido principal se mostrara en un area de trabajo amplia y enfocada
- en desktop el panel debe permanecer visible o compactable
- en mobile el panel debe comportarse como drawer desplegable
- la entrada admin vive en el mismo shell y queda preparada para control por rol en G5

El paso no implementa auth, permisos, persistencia ni CRUDs. Esas piezas quedan para los grupos funcionales posteriores.

## Validacion

- Verificar que el shell soporte responsive y crecimiento funcional.
- Verificar que el shell sirva tanto para rutas de usuario como de admin.

## Estado final

Completado.
