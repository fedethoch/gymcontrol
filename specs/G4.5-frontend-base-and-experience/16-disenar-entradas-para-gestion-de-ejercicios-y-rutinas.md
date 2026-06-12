# Disenar entradas para gestion de ejercicios y rutinas: preparar el punto de partida administrativo real

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 16  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Diseñar las entradas administrativas para gestion de ejercicios y rutinas, dejando visible como se accede a cada flujo sin implementar aun su logica completa.

## Estado

Completado.

## Archivos

- rutas de `app/admin/`
- specs de `G6` y `G7`
- `docs/ARCHITECTURE.md`

## Pasos

1. Definir acceso a gestion de ejercicios.
2. Definir acceso a gestion de rutinas.
3. Confirmar la relacion entre listado, alta y edicion basica.
4. Mantener la base lista para CRUDs posteriores.

## Criterios de aceptacion

- Los puntos de entrada admin quedan definidos.
- La experiencia ayuda a G6 y G7 sin rearmar vistas.
- No se introduce logica avanzada prematura.

## Resolucion

Quedan definidos los puntos de entrada administrativos desde `Admin dashboard` hacia `Gestion de rutinas` y `Gestion de ejercicios`. En ambos casos, el modulo se organiza alrededor de un listado principal con una accion clara de alta y una entrada directa a edicion basica desde cada item, dejando la base preparada para los CRUDs de G6 y G7.

## Validacion

- Verificar claridad de acceso a cada flujo admin.
- Verificar consistencia con el resto del frontend.

## Estado final

Completado.
