# Documentation Roadmap

## Objetivo

Este documento enumera los archivos estrategicos que deben crearse en la siguiente etapa para consolidar la base del proyecto.

No define todavia su contenido final. Solo deja pactado que estos documentos existiran y para que servira cada uno.

## Documentos a crear

### 1. Arquitectura

Archivo sugerido:

- `docs/ARCHITECTURE.md`

Proposito:

- definir estructura general del sistema
- establecer modulos y responsabilidades
- pactar dashboards, catalogo, auth, permisos y flujo de datos

### 2. Base de datos

Archivo sugerido:

- `docs/DATABASE.md`

Proposito:

- definir entidades, relaciones y reglas de modelado
- dejar explicita la prioridad de simplicidad del esquema
- registrar decisiones para minimizar cambios innecesarios

### 3. Skills y agentes

Archivo sugerido:

- `docs/SKILLS_AND_AGENTS.md`

Proposito:

- decidir que skills o agentes realmente hacen falta
- limitar su cantidad
- optimizar su uso de tokens
- evitar duplicacion de responsabilidades

### 4. Plan maestro del MVP

Archivo obligatorio:

- `PLAN.md`

Proposito:

- organizar la ejecucion en grupos
- mostrar estado general
- listar pasos concretos por grupo
- servir como tablero textual del proyecto

## Estructura pactada para `PLAN.md`

El archivo debera contener:

- `# Plan - indice y orden de ejecucion`
- `## Estado actual`
- un `## Grupo "X"` por cada grupo
- `## Lectura recomendada`

### Estado actual

Debe incluir una tabla con esta estructura:

| Grupo "X" | Estado | Nota |
| --- | --- | --- |

### Cada grupo

Cada grupo debe incluir:

- una tabla con formato `| Orden | Spec | Estado |`
- una nota breve al final
- subdivisiones internas o subgrupos cuando haga falta

## Archivos por paso

Cada paso del plan debe tener su propio archivo `.md` para poder ser ejecutado de forma aislada.

Ubicacion sugerida:

- `docs/steps/`

Nombre sugerido:

- `NN-nombre-del-paso.md`

## Plantilla pactada para cada paso

Cada archivo de paso debera usar esta estructura:

```md
# nombre del paso: descripcion breve de lo que hay que hacer

**Grupo:** 
**Orden:** 
**Esfuerzo:** 
**Modelo recomendado:** gpt 5.4 mini / gpt 5.4 / gpt 5.5

## Objetivo

## Estado

## Archivos

## Pasos

## Criterios de aceptacion

## Resolucion

## Validacion

## Estado final
```

## Lectura recomendada futura

Cuando exista el plan, debe recordar que antes de ejecutar un paso conviene leer:

- `README.md`
- `docs/PROJECT_FOUNDATIONS.md`
- `docs/WORKING_AGREEMENTS.md`
- el documento de arquitectura
- el documento de base de datos
- el archivo especifico del paso a ejecutar

## Nota final

Este roadmap no reemplaza los documentos pendientes. Su funcion es dejar asentada la estructura de documentacion que vamos a seguir para mantener orden y contexto dentro del repo.
