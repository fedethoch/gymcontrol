# Test Matrix

| Cambio | Validacion minima |
| --- | --- |
| UI / componentes | `pnpm lint` |
| Rutas / paginas | `pnpm check` |
| Mobile/PWA visual | `pnpm check:ui` con `pnpm dev` activo |
| Auth con Supabase Auth | `pnpm check` + `pnpm validate:mobile` + validacion manual minima de Google OAuth, logout, redirecciones y rol si aplica |
| Supabase / migraciones | revisar SQL afectado y contrastar con `docs/DATABASE.md`; usar MCP si aplica |
| RLS / policies | revisar SQL y policies contra `docs/DATABASE.md`; validar escenarios `anon`, `authenticated`, `admin` y propietario si aplica |
| Env / deploy | `pnpm build` y revisar `docs/codex/ENV_INDEX.md` |
| Integracion ExerciseDB / demostraciones | `pnpm check` + `pnpm exercisedb:audit` con API key disponible + validar que `EXERCISEDB_API_KEY` no aparece en cliente + prueba manual/Playwright del modal en desktop/mobile |
| Progresion / fechas / racha (`app/lib/workout-progression.ts`) | `pnpm test:unit` |
| Registro de series / sync offline (`/rutinas/dia`, `/api/workouts/sync`, cola) | `pnpm test:unit` + Playwright con `pnpm dev`: series con hueco + recarga, modo avion, terminar parcial; limpiar sesiones de prueba de la cuenta admin |
| Registro mobile (`app/components/workout/`, `app/lib/day-workout.ts`) | `pnpm test:unit` + Playwright a 375/390/430: marcar serie, descanso, avance de ejercicio, sheet de ejercicios, entreno completo, dia vacio; 1280 sin cambios |
| Contrato de sync (`app/lib/workout-sync-contract.ts`) | cambio incompatible = version nueva; el servidor acepta la anterior hasta que no queden clientes viejos |
| Nutricion: orden de comidas / recetas (`app/lib/meal-order.ts`, `app/lib/recipe-nutrition.ts`, `/nutricion/registro`, `/recetas`) | `pnpm test:unit` + Playwright con `pnpm dev`: crear "despues de…", mover ↑/↓, home en orden, receta por porcion y por gramos, editar (registro congelado), archivar; limpiar comidas/recetas de prueba de la cuenta admin |
| Registro de comidas mobile (`/nutricion/registro`, `app/lib/meal-diary.ts`, `app/lib/meal-amounts.ts`, `app/lib/number-input.ts`) | `pnpm test:unit` + Playwright a 360/375/390/430 con la cuenta admin (flujos que borran, en un día pasado): "+" de frecuentes (crea la comida en su lugar) + Deshacer, sheet Agregar (buscar, unidades, stepper, Deshacer en el pie, Crear), ítem (guardar / quitar el último), menú "…" (Enter/Esc, tipo, orden, eliminar), Tu día + Otra comida, selector de día, enlaces `?tipo=`/`?comida=`/`?alimento=` (abren solo en mobile); 1280 sin cambios; limpiar comidas de prueba |
| Semana activa mobile (`/rutinas`, `app/lib/routine-week.ts`) | `pnpm test:unit` + Playwright a 375/390/430 (pestañas, swipe, sheet Mis rutinas, detalle) y 1280 sin cambios |
| Alimentos mobile (`/alimentos`, `app/lib/food-catalog.ts`, deep link `?alimento=` del registro) | `pnpm test:unit` + Playwright a 375/390/430: buscar, chips, orden, sticky, detalle y porción, Registrar (drawer + URL limpia), crear/editar/eliminar propio, invitado; 1280 sin cambios; limpiar alimentos y comidas de prueba de la cuenta admin |
| Catálogo mobile (`/catalogo`, `app/lib/routine-catalog.ts`) | `pnpm test:unit` + Playwright a 320/375/390/430 (admin e invitado): rueda por tap, swipe y teclado, barra compacta, búsqueda, sin resultados, sheet con conteos, reduced-motion; 1280 sin cambios de layout |
| Configuración mobile (`/configuracion`, `app/lib/profile-plan.ts`) | `pnpm test:unit` + Playwright a 375/390/430: sheets (Listo, Esc, overlay, foco de vuelta), autosave y flush al cerrar, manual ida y vuelta, error + Reintentar (`page.route` abortando el POST), sin conexión (`setOffline`), nombre, borrar cuenta sin confirmar, flujo de alta con una ruta temporal y `initialProfile=null`; 1280 idéntico. Opciones del plan (`app/lib/nutrition-plan-options.ts`, `tests/unit/nutrition-plan-options.test.mjs`): variantes + slider de intensidad, 6 tipos de dieta, sliders de Personalizada a los bordes con teclado (Home/End: suma = kcal), Avanzado (mantenimiento real, peso objetivo). Snapshot: `/nutricion/registro?fecha=<pasada>` conserva su objetivo; triggers probados con `begin … rollback`. Restaurar el perfil y el nombre de la cuenta admin |
| Sheet de filtros compartido (`app/components/shared/FilterPanel.tsx`) | `pnpm lint` + abrir, elegir, limpiar y cerrar con Esc (foco vuelve al botón) en `/catalogo`, `/recetas` y un admin, a 390 y 1280 |
| Docs | no correr tests |

Fallback actual: `pnpm lint`, `pnpm build`, `pnpm validate:mobile` o validacion manual minima.

## Skill/subagent validation

| Skill/subagent | Validation |
| --- | --- |
| `frontend-design` | `pnpm build` + chequeo manual UI |
| `webapp-testing` | flujo local/manual si hay app corrible; si no, fallback manual |
| `next-best-practices` | `pnpm build` + route/render check |
| `next-cache-components` | `pnpm build` + route/render check |
| `next-upgrade` | `pnpm build` + route/render check |
| `supabase-postgres-best-practices` | contraste manual con `docs/DATABASE.md` y chequeos Supabase si aplica |
| `core-web-vitals` | `pnpm build` + notas de performance |
| `web-quality-audit` | auditoria manual breve + fallback manual |
| `accessibility` | chequeo manual de a11y + fallback manual |
| `better-auth-best-practices` | no aplica en GymControl mientras el proyecto use Supabase Auth |
| `better-auth-emailAndPassword` | no aplica en GymControl mientras el proyecto use Supabase Auth |
| `debugger` | reproducir o aislar causa |
| `frontend-developer` | `pnpm build` + chequeo manual UI |
| `ui-designer` | `pnpm build` + chequeo visual manual |
| `ui-ux-tester` | flujo local/manual si la app corre; si no, fallback manual |
| `nextjs-developer` | `pnpm build` + route/render/env check |
| `typescript-pro` | `pnpm build` |
| `backend-developer` | `pnpm build` |
| `database-administrator` | contraste manual con `docs/DATABASE.md` y chequeos Supabase si aplica |
| `postgres-pro` | contraste manual con `docs/DATABASE.md` y chequeos Supabase si aplica |
| `deployment-engineer` | `pnpm build` + env/deploy check |
| `security-auditor` | revisar auth/RLS/secrets sin tests inventados |
| `code-reviewer` | review sobre diff o archivos cambiados |
| `context-manager` | verificar consistencia entre `AGENTS.md` y `docs/codex/` |

Si entra una nueva integracion, agregar caso especifico.
