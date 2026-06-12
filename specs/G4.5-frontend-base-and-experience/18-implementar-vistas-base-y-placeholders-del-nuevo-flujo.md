# Implementar vistas base y placeholders del nuevo flujo: dejar visibles las pantallas clave del frontend

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 18  
**Esfuerzo:** Alto  
**Modelo recomendado:** gpt 5.4

## Objetivo

Implementar las vistas base y placeholders del nuevo flujo de usuario y admin para que la experiencia completa ya pueda recorrerse sobre el frontend renovado.

## Estado

Completado.

## Archivos

- rutas principales de `app/`
- componentes base creados en G4 y G4.5
- `PLAN.md`

## Pasos

1. Implementar las vistas base del flujo de usuario.
2. Implementar las vistas base del flujo admin.
3. Reflejar en cada pantalla su responsabilidad real futura.
4. Evitar mezclar aun persistencia o auth final.

## Criterios de aceptacion

- Las pantallas principales del nuevo flujo existen.
- La experiencia puede recorrerse de punta a punta en modo base.
- La app queda lista para que G5+ agreguen logica real.

## Resolucion

Se implementaron las vistas base del nuevo flujo de usuario y admin sobre el shell renovado. El proyecto ahora recorre `Agregar rutinas`, `Detalle de rutina disponible`, `Mis rutinas`, `Ejercicio`, `Detalle diario de rutina`, `Admin dashboard`, `Gestion de rutinas`, `Gestion de ejercicios` y `Acceso`, manteniendo la logica real de auth, persistencia y modal final para grupos posteriores.

## Validacion

- Verificar coherencia entre vistas.
- Verificar que la estructura represente fielmente el frontend acordado.

## Estado final

Completado.
