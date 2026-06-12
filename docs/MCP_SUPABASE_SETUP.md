# MCP Supabase Setup For GymControl

## Objetivo

Dejar claro como conectar Codex a Supabase para este repo cuando existan multiples MCP disponibles, y como indicar de forma explicita cual debe usarse para `gymcontrol`.

## Estado actual detectado

- El repo `gymcontrol` no tiene todavia un archivo local `.mcp.json`.
- La configuracion global activa de Codex en `C:\Users\fedet\.codex\config.toml` no expone hoy ningun servidor `supabase`.
- El backup de configuracion muestra que antes existieron dos aliases de Supabase:
  - `supabase`
  - `supabase_otro_proyecto`

Actualizacion real del repo al 2026-06-01:

- el repo si tiene `.mcp.json`
- el repo si tiene `.codex/config.toml`
- ambos apuntan al alias `supabase_gymcontrol`
- `.mcp.json` ya estaba en `read_only=false`
- `.codex/config.toml` fue alineado a `read_only=false`
- en esta sesion las herramientas MCP de `supabase_gymcontrol` quedaron expuestas y respondieron correctamente
- la conexion activa reporto `transaction_read_only=off` y `default_transaction_read_only=off`
- la migracion base del MVP ya fue aplicada en Supabase
- `apply_migration` ya pudo ejecutar una prueba real de `create table`, `alter table` y `drop table`

Esto confirma que, si vamos a trabajar con mas de un proyecto Supabase, conviene usar un alias dedicado para este repo y no depender de nombres ambiguos.

## Convencion recomendada para este repo

Usar un alias exclusivo:

- `supabase_gymcontrol`

No reutilizar `supabase` a secas si en tu entorno vas a seguir trabajando con varios proyectos.

## Ubicacion pactada en GymControl

Este repo sigue el mismo criterio que otros proyectos tuyos:

- configuracion principal en `.codex/config.toml`
- espejo simple en `.mcp.json`

Archivos concretos:

- `C:\Users\fedet\Documents\GitHub\gymcontrol\.codex\config.toml`
- `C:\Users\fedet\Documents\GitHub\gymcontrol\.mcp.json`

## Paso a paso

### 1. Obtener el `project_ref`

Saca el `project_ref` del proyecto Supabase de `gymcontrol`.

Normalmente lo ves:

- en la URL del dashboard del proyecto
- en la configuracion general del proyecto

Ejemplo de forma esperada:

```text
abcdefghijklmnopqrs
```

### 2. Registrar el MCP en la config local del repo

Abrir:

```text
C:\Users\fedet\Documents\GitHub\gymcontrol\.codex\config.toml
```

Agregar o mantener un bloque con alias especifico para este repo:

```toml
[mcp_servers.supabase_gymcontrol]
url = "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF&read_only=false&features=database,docs"
```

Notas:

- `project_ref=...` limita el MCP a un unico proyecto.
- `read_only=false` es necesario cuando haga falta ejecutar cambios reales del esquema del MVP.
- `features=database,docs` deja habilitado solo lo necesario para esta etapa.

### 3. Si usas autenticacion manual por token

Solo si tu flujo no usa autenticacion web/OAuth del servidor MCP, agregar:

```toml
[mcp_servers.supabase_gymcontrol]
url = "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF&read_only=false&features=database,docs"
bearer_token_env_var = "SUPABASE_ACCESS_TOKEN_GYMCONTROL"
```

Y definir en Windows la variable de entorno:

```powershell
setx SUPABASE_ACCESS_TOKEN_GYMCONTROL "TU_TOKEN"
```

Luego cerrar y volver a abrir Codex.

### 3. Mantener el espejo en `.mcp.json`

Abrir:

```text
C:\Users\fedet\Documents\GitHub\gymcontrol\.mcp.json
```

Mantener el mismo alias y la misma URL:

```json
{
  "mcpServers": {
    "supabase_gymcontrol": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF&read_only=false&features=database,docs"
    }
  }
}
```

## 4. Reiniciar Codex

Despues de guardar `config.toml`:

1. cerrar Codex Desktop completamente
2. volver a abrirlo

## 5. Autenticar el servidor

Si el cliente o el servidor lo piden:

1. iniciar sesion en Supabase en el navegador
2. autorizar el acceso del MCP
3. confirmar la organizacion correcta

## 6. Convencion local dentro del repo

Como recordatorio y configuracion pactada del proyecto, existe un `.mcp.json` en la raiz del repo.

Ejemplo:

```json
{
  "mcpServers": {
    "supabase_gymcontrol": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF&read_only=false&features=database,docs"
    }
  }
}
```

Importante:

- En esta sesion, la configuracion confirmada para seguir el mismo criterio de tus otros proyectos es la configuracion local del repo.
- El `.mcp.json` sirve como espejo simple y contexto visible del repo.
- Debe reflejar exactamente el mismo alias y URL pactados en `.codex/config.toml`.

## 7. Como pedirle a la IA que use el MCP correcto

Cuando tengas mas de un MCP Supabase configurado, usa prompts explicitos como estos:

```text
Usa el MCP `supabase_gymcontrol` para este repo.
```

```text
No uses `supabase_otro_proyecto`. Para `gymcontrol` usa solo `supabase_gymcontrol`.
```

```text
Antes de tocar la base de datos de este repo, valida todo contra el MCP `supabase_gymcontrol`.
```

## 8. Como sabremos que quedo bien

La conexion esta bien cuando ocurra esto:

1. Codex vuelve a exponer herramientas de Supabase en la sesion.
2. Podemos pedir algo como:

```text
Usa el MCP `supabase_gymcontrol` y lista las tablas del proyecto.
```

3. La IA responde usando el proyecto correcto y no otro.

## Recomendacion operativa para GymControl

Para este proyecto, la recomendacion es:

- crear `supabase_gymcontrol`
- usarlo para inspeccionar esquema, tablas, relaciones y decisiones de permisos
- mantener `read_only=false` solo cuando la tarea realmente requiera cambios versionados en schema o policies
- contrastar siempre cambios con `docs/DATABASE.md`

## Estado verificado en esta sesion

En la revision actual del MCP:

- la sesion expuso herramientas MCP de `supabase_gymcontrol`
- se pudo ejecutar SQL real contra el proyecto
- se aplico la migracion final de G2 en Supabase
- se verifico que `public` quedo con las 6 tablas del MVP de G2
- la conexion reporto `transaction_read_only=off`
- ya existe registro de migracion en Supabase para la migracion operativa final

Nota operativa:

- el repo sigue preparado en `read_only=false`
- la capacidad de escritura por migracion quedo validada y aplicada
- RLS sigue deshabilitado en las 6 tablas del esquema
- el siguiente paso de seguridad ya definido es `G5.5 - RLS y policies`

## Referencias

- OpenAI Codex local config detectada en este equipo: `C:\Users\fedet\.codex\config.toml`
- Supabase MCP docs: https://supabase.com/docs/guides/getting-started/mcp
- Supabase MCP overview: https://supabase.com/mcp
