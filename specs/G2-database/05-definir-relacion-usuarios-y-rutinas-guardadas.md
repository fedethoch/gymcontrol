# Definir relacion entre usuarios y rutinas guardadas: soportar multiples rutinas con nombre propio

**Grupo:** G2 - Base de datos  
**Orden:** 5  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir como un usuario guarda una o varias rutinas del catalogo y como puede asignarles nombres propios dentro de su dashboard.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `PLAN.md`
- resultados de entidades y relaciones previas

## Pasos

1. Diferenciar rutina plantilla de rutina guardada por usuario.
2. Definir la relacion entre usuario y rutinas guardadas.
3. Definir como se almacena el nombre personalizado de la rutina del usuario.
4. Confirmar que un usuario puede tener mas de una rutina guardada.
5. Elegir la representacion mas simple posible para este caso.

## Criterios de aceptacion

- El modelo soporta multiples rutinas guardadas por usuario.
- Se puede almacenar un nombre propio por rutina guardada.
- Queda clara la separacion entre datos administrados por el admin y datos personalizados del usuario.

## Resolucion

Se definio una tabla de asignacion entre usuario y rutina plantilla que permite multiples rutinas guardadas por usuario y nombre propio sin duplicar la estructura semanal.

## Validacion

- Verificar que el modelo no duplique toda la rutina sin necesidad si no hace falta.
- Verificar que el dashboard de usuario pueda leerse a partir de esta relacion.

## Estado final

Completado.
