# Env Index

## Runtime de la app

| Variable | Uso | Donde |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL publica de Supabase | `.env.example`, `app/lib/supabase/env.ts`, `app/lib/supabase/browser.ts`, `app/lib/supabase/server.ts` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clave publishable de Supabase | `.env.example`, `app/lib/supabase/env.ts`, `app/lib/supabase/browser.ts`, `app/lib/supabase/server.ts` |

## Auth post-MVP

- `G13` quedo implementado sin agregar nuevas variables runtime de la app.
- La configuracion de OTP por codigo y Google OAuth queda externa a la app: templates, provider Google, callback de Supabase y allow list de redirects.
- Si mas adelante entra una URL canonica dedicada o nuevas vars de auth, agregarlas aqui.

## Operativas / MCP

| Variable | Uso | Donde |
| --- | --- | --- |
| `SUPABASE_ACCESS_TOKEN_GYMCONTROL` | token opcional para el MCP `supabase_gymcontrol`; no es runtime de la app | `docs/MCP_SUPABASE_SETUP.md` |

No documentar secretos ni usar `.env.local` como fuente.
