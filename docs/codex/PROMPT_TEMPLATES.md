# Prompt Templates

Todos los prompts deben devolver:

1. diagnostico
2. archivos
3. validacion
4. riesgos

## Diagnosticar bug

```text
Diagnostica este bug con exploracion minima.
Usa rg antes de abrir archivos.
No leas todo el repo ni carpetas generadas.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos

Bug: <bug>
Ruta o feature: <ruta/feature>
```

## Patch minimo

```text
Hace el patch minimo para <problema>.
No refactorices.
No toques archivos no relacionados.
Lee solo lo necesario.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Revisar cambios

```text
Revisa los cambios actuales con enfoque de code review.
Si no hay git disponible, usa los archivos modificados o un diff provisto.
Prioriza bugs, riesgos y regresiones.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Auditar feature

```text
Audita la feature <feature>.
Consulta primero docs/codex/ROUTING_GRAPH.md y FILE_OWNERSHIP.md.
Despues usa rg para ubicar la superficie real.
No explores areas no relacionadas.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Debug deploy / env

```text
Debuggea un problema de deploy o env.
Usa primero docs/codex/ENV_INDEX.md y COMMANDS.md.
No inventes variables ni comandos.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Pedir plan antes de editar

```text
Primero arma un plan y no edites nada.
Usa rg antes de abrir archivos.
Limita la lectura a maximo 10 archivos.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Tarea chica sin subagent

```text
Resuelve esta tarea chica sin usar subagents.
Usa solo Codex normal y docs/codex.
No leas el repo entero.
Usa rg antes de abrir archivos.
Valida segun docs/codex/TEST_MATRIX.md.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Tarea mediana con una skill

```text
Resuelve esta tarea usando una sola skill: <skill>.
Limita la exploracion al area afectada.
No leas el repo entero.
Usa rg antes de abrir archivos.
Valida segun docs/codex/TEST_MATRIX.md.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Bug desconocido con debugger

```text
Investiga este bug usando `debugger` como subagent principal.
No leas el repo entero.
Usa rg para aislar la superficie primero.
Si aparece una causa clara, no sumes mas subagents salvo necesidad real.
Valida segun docs/codex/TEST_MATRIX.md.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Supabase o RLS

```text
Trabaja este problema con `postgres-pro` y usa `security-auditor` solo si hay riesgo de auth, RLS o permisos.
No leas el repo entero.
Usa rg antes de abrir archivos.
Contrasta con docs/codex/ENV_INDEX.md y docs/DATABASE.md.
Valida segun docs/codex/TEST_MATRIX.md.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## UI con skill o subagent

```text
Resuelve esta tarea de UI con `frontend-design`.
Usa `ui-designer` solo si la calidad visual es una parte importante del riesgo.
No leas el repo entero.
Usa rg antes de abrir archivos.
Valida segun docs/codex/TEST_MATRIX.md.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Deploy o env

```text
Investiga este problema de deploy o entorno con `deployment-engineer`.
No leas el repo entero.
Usa primero docs/codex/COMMANDS.md y docs/codex/ENV_INDEX.md.
Usa rg antes de abrir archivos.
Valida segun docs/codex/TEST_MATRIX.md.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Review con code-reviewer

```text
Revisa estos cambios con `code-reviewer`.
No leas el repo entero.
Usa el diff o los archivos cambiados como superficie principal.
Valida segun docs/codex/TEST_MATRIX.md cuando aplique.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```

## Context optimization

```text
Optimiza esta capa de contexto usando `context-manager`.
Limita la lectura a AGENTS.md, docs/codex y archivos estrictamente relacionados.
No leas el repo entero.
Usa rg antes de abrir archivos.
Valida consistencia segun docs/codex/TEST_MATRIX.md.
Devolve solo:
1. diagnostico
2. archivos
3. validacion
4. riesgos
```
