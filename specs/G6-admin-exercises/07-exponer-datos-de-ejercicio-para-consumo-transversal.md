# Exponer datos de ejercicio para consumo transversal: habilitar reutilizacion en catalogo, rutinas y modal

**Grupo:** G6 - Ejercicios admin  
**Orden:** 7  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Dejar preparados los datos de ejercicio para que puedan ser consumidos de forma consistente desde las distintas areas funcionales del MVP.

## Estado

Pendiente.

## Archivos

- consultas o acciones de lectura de ejercicio
- componentes o modulos que reutilizaran ejercicios
- `docs/ARCHITECTURE.md`
- `PLAN.md`

## Pasos

1. Identificar que vistas necesitara consumir datos de ejercicio.
2. Definir la forma simple y reutilizable de exponer esos datos.
3. Evitar duplicar logica de lectura en multiples lugares.
4. Alinear la salida de datos con las necesidades del catalogo, builder y modal.

## Criterios de aceptacion

- Los datos de ejercicio quedan reutilizables desde otras areas.
- La lectura de ejercicios no queda dispersa de forma innecesaria.
- La solucion es coherente con la arquitectura pactada.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que catalogo, rutinas y modal puedan apoyarse en esta capa sin redefinir consultas.
- Verificar que no se expongan mas datos de los necesarios.

## Estado final

No iniciado.
