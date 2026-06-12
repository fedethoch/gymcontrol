# GymControl

GymControl es una aplicacion web de rutinas de gimnasio construida con Next.js y Supabase. El MVP queda cerrado formalmente: cubre administracion de ejercicios y rutinas, catalogo publico de rutinas, guardado personal en dashboard y consulta de ejercicios en modal sin salir de la vista.

## Que hace hoy el MVP

- Admin gestiona ejercicios con nombre, descripcion e imagen.
- Admin gestiona rutinas semanales con multiples dias y filas de trabajo.
- Auth y roles corren sobre Supabase Auth con `OTP por email de 6 digitos + Google OAuth`, sesion server-side y guards por rol.
- El catalogo permite explorar rutinas, ver su estructura semanal y abrir ejercicios en modal.
- El usuario autenticado puede guardar una rutina en su cuenta, evitar duplicados por plantilla, renombrarla, consultar su detalle semanal y diario, y registrar reps/peso reales por fecha.
- La validacion funcional base queda respaldada por `G11`, y la transicion de auth queda aterrizada en `G13` con el mismo `profiles.type_rol`.

## Alcance operativo del MVP

- `Cumplido`: ejercicios admin.
- `Cumplido`: rutinas admin.
- `Cumplido`: restriccion por rol en vistas y escrituras admin.
- `Cumplido`: catalogo de rutinas.
- `Cumplido`: guardado y renombrado en dashboard.
- `Cumplido`: modal de detalle de ejercicio desde multiples contextos.

Limites operativos conocidos del MVP:

- la semana activa del dashboard sigue apoyandose en la rutina guardada marcada como activa
- no existe historial visible de sesiones ni metricas avanzadas por serie
- el bootstrap inicial de admin sigue siendo manual en Supabase

## Stack principal

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth, SSR, Postgres, RLS y Storage
- ESLint con `eslint-config-next`
- `zod`

## Configuracion de auth dual

Supabase Email OTP:

- el template `Magic Link` de Supabase debe usar `{{ .Token }}` para enviar el codigo de 6 digitos
- el flujo principal ya no depende de `{{ .ConfirmationURL }}`
- la expiracion del OTP se configura en `Auth > Providers > Email > Email OTP Expiration`

Google OAuth:

- habilitar el provider Google en Supabase
- cargar `Client ID` y `Client Secret` de Google dentro de Supabase Auth
- agregar los origenes web del proyecto en Google Cloud
- registrar el callback de Supabase `https://<project-ref>.supabase.co/auth/v1/callback`
- agregar el redirect de la app hacia `/auth/callback` en la allow list de redirects de Supabase

Notas operativas:

- la app no requiere `SUPABASE_SERVICE_ROLE_KEY` para este flujo
- `Google` se muestra siempre en login; si el provider no esta habilitado, la app vuelve a `/auth/login` con error visible
- el redirect post-login sigue resolviendose por `profiles.type_rol`

## Documentos clave

- [PLAN.md](C:/Users/fedet/Documents/GitHub/gymcontrol/PLAN.md)
- [docs/ARCHITECTURE.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/ARCHITECTURE.md)
- [docs/DATABASE.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/DATABASE.md)
- [docs/SKILLS_AND_AGENTS.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/SKILLS_AND_AGENTS.md)
- [docs/PROJECT_FOUNDATIONS.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/PROJECT_FOUNDATIONS.md)
- `docs/codex/`

## Siguiente frente de trabajo

El siguiente ciclo ya no es cerrar el MVP sino extenderlo sobre la base ya migrada de auth dual. `G13` queda implementado con `OTP por email de 6 digitos + Google OAuth`, sin cambiar `profiles.type_rol`, sesion SSR ni guards. Los siguientes frentes pasan por historial visible de sesiones, metricas mas finas de progreso, QA automatizada y refinamiento UX.
