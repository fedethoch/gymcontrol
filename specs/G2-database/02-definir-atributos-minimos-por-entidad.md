# Definir atributos minimos por entidad: acordar los campos necesarios sin sobrecargar el esquema

**Grupo:** G2 - Base de datos  
**Orden:** 2  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir los atributos minimos de cada entidad del MVP para que el esquema soporte correctamente las funcionalidades pedidas y evite campos innecesarios.

## Estado

Completado.

## Archivos

- `docs/PROJECT_FOUNDATIONS.md`
- `docs/ARCHITECTURE.md` si ya existe
- `PLAN.md`
- resultado del spec `01-listar-entidades-minimas-necesarias.md`

## Pasos

1. Tomar la lista de entidades definidas en el paso anterior.
2. Definir los campos minimos obligatorios por entidad.
3. Diferenciar campos requeridos de campos opcionales.
4. Eliminar campos que representen suposiciones no validadas por el MVP.
5. Documentar el resultado de forma clara.

## Criterios de aceptacion

- Cada entidad tiene solo los campos necesarios.
- Los campos cubren los requerimientos funcionales del MVP.
- No se agregan atributos pensados para features futuras no confirmadas.

## Resolucion

Definidos los atributos minimos por entidad en `docs/DATABASE.md`, manteniendo el esquema simple y sin campos prematuros.

## Validacion

- Verificar que ejercicio soporte nombre, descripcion e imagen.
- Verificar que rutina y sus partes soporten la estructura semanal requerida.

## Estado final

Completado.
