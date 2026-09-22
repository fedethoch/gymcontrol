# Env Index

## Runtime de la app

| Variable | Uso | Donde |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL publica de Supabase | `.env.example`, `app/lib/supabase/env.ts`, `app/lib/supabase/browser.ts`, `app/lib/supabase/server.ts` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clave publishable de Supabase | `.env.example`, `app/lib/supabase/env.ts`, `app/lib/supabase/browser.ts`, `app/lib/supabase/server.ts` |
| `EXERCISEDB_API_KEY` | clave server-only de ExerciseDB/RapidAPI para demostraciones de ejercicios in-app; no se expone al cliente ni se usa para cachear media externa | `.env.example`, `app/lib/exercise-demo.ts`, `app/api/exercises/[id]/demo/route.ts`, `app/api/exercises/demo-image/route.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only: borrar cuenta y avisos push (suscripciones, cron) | `.env.example`, `app/lib/supabase/admin.ts` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | clave publica VAPID de los avisos push (el navegador se suscribe con ella); se hornea en el build | `.env.example`, `app/lib/push-client.ts`, `app/lib/push/config.ts` |
| `VAPID_PRIVATE_KEY` | clave privada VAPID, server-only (firma cada push) | `.env.example`, `app/lib/push/config.ts` |
| `VAPID_SUBJECT` | contacto VAPID: `https:` o `mailto:` valido (Apple rechaza otro con 403 BadJwtToken) | `.env.example`, `app/lib/push/config.ts` |
| `CRON_SECRET` | secreto con el que el cron de Supabase llama a `/api/push/cron` (>= 32 caracteres) | `.env.example`, `app/lib/push/config.ts`, `app/api/push/cron/route.ts` |

Secretos en Supabase Vault (los lee `pg_cron`, `supabase/migrations/20260921_push_cron.sql`): `push_cron_base_url` (URL de produccion) y `push_cron_secret` (mismo valor que `CRON_SECRET`). Se crean por SQL, nunca en archivos del repo.

## Auth post-MVP

- `G13` quedo implementado sin agregar nuevas variables runtime de la app.
- La configuracion de OTP por codigo y Google OAuth queda externa a la app: templates, provider Google, callback de Supabase y allow list de redirects.
- Si mas adelante entra una URL canonica dedicada o nuevas vars de auth, agregarlas aqui.

## Operativas / MCP

| Variable | Uso | Donde |
| --- | --- | --- |
| `SUPABASE_ACCESS_TOKEN_GYMCONTROL` | token opcional para el MCP `supabase_gymcontrol`; no es runtime de la app | `docs/MCP_SUPABASE_SETUP.md` |

No documentar secretos ni usar `.env.local` como fuente.
