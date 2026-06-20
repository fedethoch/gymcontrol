# Commands

Comandos versionados y ejecutables:

| Comando | Uso |
| --- | --- |
| `pnpm install` | instalar dependencias |
| `pnpm dev` | desarrollo |
| `pnpm start` | correr build existente |
| `pnpm lint` | lint |
| `pnpm build` | build |
| `pnpm check` | lint + build |
| `pnpm exercisedb:audit` | genera reporte dry-run de mapeo ExerciseDB; con `-- --apply` actualiza `exercises.exercisedb_id` para matches confiables |
| `pnpm validate:mobile` | validacion Playwright mobile autenticada; requiere `pnpm dev` o `pnpm start` activo y `.env.local` |
| `pnpm check:ui` | build + validacion mobile autenticada |

No existe comando versionado para: deploy, migraciones locales.
