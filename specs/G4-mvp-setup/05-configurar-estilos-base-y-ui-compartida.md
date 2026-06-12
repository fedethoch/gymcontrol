# Configurar estilos base y UI compartida: preparar la capa visual minima reutilizable

**Grupo:** G4 - Setup tecnico del MVP  
**Orden:** 5  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir y preparar la base visual del proyecto, incluyendo estilos globales y piezas compartidas necesarias para comenzar el MVP con consistencia.

## Estado

Completado.

## Archivos

- `app/globals.css`
- `app/layout.tsx`
- estructura de componentes compartidos
- `docs/ARCHITECTURE.md`

## Pasos

1. Revisar la base actual de estilos.
2. Definir tokens o reglas visuales minimas para el MVP.
3. Preparar una capa simple de UI compartida.
4. Evitar sobredisenar el sistema visual en esta fase.
5. Dejar la base lista para reutilizar en pantallas futuras.

## Criterios de aceptacion

- Existe una base visual coherente y reutilizable.
- Se pueden construir vistas del MVP sin improvisar estilos en cada pantalla.
- No se crea un design system excesivo.

## Resolucion

Se definio una base visual minima en `app/globals.css` con tokens de color, superficies, radios y fondo general para el MVP.

Tambien se crearon primitivas simples en `app/components/ui/` para layout y piezas compartidas iniciales, evitando un design system excesivo.

La portada de `app/page.tsx` fue ajustada para consumir esas piezas y validar que la base visual ya es reutilizable.

## Validacion

- Verificar que la base funcione tanto para admin como para usuario.
- Verificar que la solucion sea simple de extender sin reescritura.

## Estado final

Completado.
