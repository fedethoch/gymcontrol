# AGENTS.md (Gymcontrol)

Router corto de contexto. Regla principal: no explorar todo el repo por defecto.

## Global agent rules

Antes de cualquier tarea, leer y aplicar tambien `C:\Users\fedet\.codex\AGENTS.md` como contexto global, salvo conflicto con instrucciones de mayor prioridad.

## Context router

Do not read all files. Pick only the relevant source from this map.

1. `docs/codex/ROUTING_GRAPH.md`
2. `docs/codex/FILE_OWNERSHIP.md`
3. `docs/codex/COMMANDS.md`
4. `docs/codex/ENV_INDEX.md` si aplica
5. `docs/codex/TEST_MATRIX.md` si aplica
6. `README.md`
7. `PLAN.md`
8. `docs/ARCHITECTURE.md`
9. `docs/DATABASE.md`
10. `docs/SKILLS_AND_AGENTS.md`
11. `specs/` si la tarea sigue un spec

## Reglas de ahorro

- usar `rg` antes de abrir archivos
- leer solo lo necesario
- no leer `node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `.venv/`, `__pycache__/`
- preferir la validacion minima mas barata
- no pegar logs largos
- devolver outputs compactos

## Fuentes de verdad

- mapas tacticos: `docs/codex/`
- arquitectura: `docs/ARCHITECTURE.md` y `docs/architecture/`
- base de datos: `docs/DATABASE.md`
- skills/agentes: `docs/SKILLS_AND_AGENTS.md`
- plan y specs: `PLAN.md`, `specs/`

Si cambia una decision, actualizar primero su fuente de verdad.

## Supabase

Si la tarea toca Supabase, usar solo `supabase_gymcontrol` y contrastar con `docs/DATABASE.md`. Configuracion: `.codex/config.toml`, `.mcp.json`, `docs/MCP_SUPABASE_SETUP.md`.

## Skills

- `graphify`: arquitectura, relaciones entre archivos, dudas sobre el codigo y updates del grafo.
- `frontend-design` / `impeccable`: UI nueva, redisenos, polish visual, responsive y accesibilidad.
- `ui-ux-pro-max`: planificar o implementar UI/UX con stack, paletas, patrones, tablas, forms y dashboards.
- `web-design-guidelines`: auditoria de accesibilidad, UX, responsive y buenas practicas web.
- `micro-interactions`: estados hover/press/loading, toggles, validacion, badges y feedback fino.
- `playwright-cli`: validar pantallas, flujos auth, responsive, overflow e interacciones.
- `browser:control-in-app-browser`: abrir e inspeccionar localhost o sitios en el browser integrado.
- `shadcn-ui`: componentes shadcn, formularios, dialogs, tablas, menus y patrones accesibles.
- `openai-docs`: solo para dudas sobre OpenAI/Codex/API con docs oficiales.
- `github:github`: contexto general de issues, repos y PRs.
- `github:gh-address-comments`: resolver comentarios accionables de review en un PR.
- `github:gh-fix-ci`: investigar y arreglar checks fallidos de GitHub Actions.
- `github:yeet`: commit, push y draft PR cuando el usuario pida publicar cambios.
- `notion:*`: specs, documentacion, decisiones, research o tareas que vivan en Notion.
- `pdf:pdf`: leer, crear, renderizar o verificar PDFs.
- `documents:documents`: crear/editar `.docx` con verificacion visual.
- `presentations:Presentations`: crear o editar PowerPoint/Slides.
- `spreadsheets:Spreadsheets`: crear, analizar o modificar `.xlsx`, `.csv` o Google Sheets.
- `imagegen`: generar o editar imagenes bitmap cuando haga falta un asset visual.
- `skill-creator` / `plugin-creator` / `skill-installer`: crear, actualizar o instalar skills/plugins de Codex.
- Regla: usar la skill minima necesaria; no cargar skills no relacionadas.

## Agentes

- `ui-designer`: decisiones UX/layout en tareas UI no triviales.
- `frontend-developer`: implementacion React/Tailwind/shadcn.
- `ui-ux-tester`: revision visual/responsive final.
- `nextjs-developer`: rutas App Router, server/client boundaries, middleware y API routes.
- `typescript-pro`: errores TS complejos o tipos compartidos.
- `backend-developer`: server logic, endpoints y acciones de dominio.
- `database-administrator` / `postgres-pro`: schema, migraciones, SQL, RLS y Supabase/Postgres.
- `security-auditor`: auth, roles, RLS, secrets o datos sensibles.
- `code-reviewer`: despues de cambios relevantes o para reviews.

## Formato de salida

1. Diagnostico
2. Archivos cambiados
3. Tests ejecutados
4. Riesgos

## Codex context layer maintenance

Files under `docs/codex/` are tactical routing files for Codex, not full documentation.

Do not expand them unless the change helps future agents:
- decide what file to read
- decide what file to edit
- decide what command to run
- avoid duplicated exploration

When modifying `docs/codex/`:
- keep entries short
- prefer tables/lists over prose
- link to source-of-truth docs instead of copying explanations
- do not document speculative features
- do not add categories that do not exist yet
- keep `AGENTS.md` as a router, not a manual

## graphify

- **graphify** (`.codex/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Frontend
- Do not finish only because it compiles: open the changed screen, check layout/overflow/responsiveness/navigation, then make one visual refinement pass if needed.
- Stack: React + Tailwind. Base components: shadcn/ui. Icons: `lucide-react` only.
- Prefer existing components and shadcn primitives. Do not create custom components when a project/shadcn component already fits.
- Use Framer Motion for subtle microinteractions when useful: hover, press, selection changes, tabs, loading, drawers/modals, and icon transitions.
- Keep UI premium/minimal: clear hierarchy, balanced spacing, restrained violet accents, consistent radius/shadows, readable contrast.
- Avoid generic AI UI: excessive gradients, random glows, cheap glassmorphism, oversized cards, inconsistent spacing, and decorative noise.
- Always mobile-first, but do not just stack desktop sections vertically; design a thoughtful mobile layout.
- Do not modify mobile/PWA bottom navbar size, position, or behavior unless explicitly requested.
- Keep changes surgical unless the user explicitly asks for a redesign.


## Plan mode
- siempre que te ejecute en plan mode y me devuelvas el plan dime que skills usaras y para que cada una.
- siempre que te ejecute en plan mode y me devuelvas el plan dime que mcp usaras, considera que tienen costo de tokens asi que solo usalo si son necesarios y garantizar una considerable mejora del resultado. dime para que cada uno
- siempre que te ejecute en plan mode y me devuelvas el plan dime que subagentes desplegaras, considera que tienen costo de tokens asi que solo usalo si son necesarios y garantizar una considerable mejora del resultado. dime para que cada uno



## Admin account
- You can find the credentials in .env.local at the name of "EMAIL" and "EMAIL_PASSWORD"
