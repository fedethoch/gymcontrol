# Definir patron visual del panel lateral y area de contenido: ordenar la composicion principal del producto

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir el patron visual del panel lateral izquierdo y del area principal de contenido para que el frontend tenga una jerarquia clara y consistente.

## Estado

Completado.

## Archivos

- `app/layout.tsx`
- `app/components/shared/`
- `app/globals.css`

## Pasos

1. Definir dimensiones y comportamiento base del panel lateral.
2. Definir relacion visual entre panel y contenido.
3. Definir estados abiertos, colapsados o compactos si aplican.
4. Confirmar que el area de contenido mantenga foco y legibilidad.

## Criterios de aceptacion

- El patron compositivo principal queda definido.
- El panel lateral tiene comportamiento claro.
- El contenido principal conserva protagonismo y orden.

## Resolucion

Se definio el patron visual del panel lateral y del area principal de contenido en `docs/architecture/07-frontend-experience.md`.

Decision:

- el shell se compone de panel lateral izquierdo y area principal de contenido
- el panel lateral funciona como ancla de orientacion, con composicion superior, central e inferior
- en desktop el panel es persistente; en mobile se comporta como drawer superpuesto
- el contenido principal debe sentirse mas amplio, abierto y dominante que la navegacion
- la separacion entre regiones debe resolverse por contraste, borde o espaciado, no por decoracion excesiva
- el patron admite estado expandido y compacto en desktop si la implementacion lo justifica

## Validacion

- Verificar que el patron funcione en desktop y mobile.
- Verificar que la estructura no obligue a hacks de layout luego.

## Estado final

Completado.
