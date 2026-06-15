# Plan: localhost:3000 → producción (gymcontrol-lake.vercel.app)

## Context

Se quiere que la app corra igual en **local** (`http://localhost:3000`) y en
**producción** (`https://gymcontrol-lake.vercel.app`), sin romper ninguno de los dos.

Hallazgo clave tras explorar el código: **no hay URLs hardcodeadas**. El origin de
auth se deriva dinámicamente de los headers del request:

- `app/lib/request.ts` → `getRequestOrigin()` lee `x-forwarded-host` / `host`
  (Vercel los setea correctos). Fallback solo a `http://localhost:3000` si no hay host.
- `app/auth/google/start/route.ts:20` → `redirectTo: ${origin}/auth/callback` (dinámico).
- `app/auth/callback/route.ts` → usa `requestUrl.origin` (dinámico).
- Login por OTP (`app/api/auth/request-otp/route.ts`) usa código tipeado, sin magic-link
  → no depende de URL de redirect.

**Conclusión:** el código ya es agnóstico al entorno. Pasar a producción es **tarea de
configuración** (Vercel + Supabase + Google), no de código. El objetivo del plan es
dejar ambos entornos funcionando en paralelo.

## Cambios

### 1. Variables de entorno en Vercel (proyecto gymcontrol-lake)
Cargar en Vercel → Settings → Environment Variables (scope: Production + Preview):

| Var | Valor (tomar de `.env.local`) |
|-----|-------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ignlzahslkkfucgnekkb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | (service role del `.env.local`) |
| `GOOGLE_CLIENT_ID` | (si se usa login Google) |
| `GOOGLE_CLIENT_SECRET` | (si se usa login Google) |
| `EMAIL` / `EMAIL_PASSWORD` | cuenta admin, si la app las consume server-side |

Nota: las `NEXT_PUBLIC_*` se inyectan en build → tras agregarlas hacer **redeploy**.

### 2. Supabase → Auth → URL Configuration (dashboard, proyecto `ignlzahslkkfucgnekkb`)
- **Site URL**: `https://gymcontrol-lake.vercel.app`
- **Redirect URLs** (allowlist — agregar AMBOS para que local y prod funcionen):
  - `https://gymcontrol-lake.vercel.app/**`
  - `http://localhost:3000/**`

Esto cubre el `redirectTo: ${origin}/auth/callback` del flujo Google OAuth en los dos
entornos.

### 3. Google Cloud Console → OAuth Client (solo si se usa login Google)
El flujo es Google → **Supabase** → app. Google redirige a Supabase, no a la app.
Verificar que en **Authorized redirect URIs** esté:
- `https://ignlzahslkkfucgnekkb.supabase.co/auth/v1/callback`

Si el login Google ya funciona en local, esta URI ya existe → **no requiere cambios**.
(La URL de Vercel no va acá; va en el allowlist de Supabase del paso 2.)

### 4. Sin cambios de código
No se modifica `request.ts`, rutas de auth, ni `next.config.ts`. `.env.example` ya
documenta las vars públicas; opcional agregarle `GOOGLE_CLIENT_ID/SECRET` como recordatorio.

## Verificación end-to-end

**Producción:**
1. Push a `master` → deploy automático en Vercel.
2. Abrir `https://gymcontrol-lake.vercel.app/auth/login`.
3. Login OTP: pedir código, revisar email, ingresar código → debe redirigir al dashboard.
4. Login Google (si aplica): debe volver a `gymcontrol-lake.vercel.app/auth/callback` y
   entrar sin error `google-oauth-failed`.
5. Confirmar que imágenes de Supabase Storage cargan (cubierto por `next.config.ts`).

**Local (debe seguir funcionando):**
1. `pnpm dev` → `http://localhost:3000/auth/login`.
2. Repetir login OTP y Google → deben funcionar gracias al allowlist con ambos dominios.

## Riesgos
- Olvidar **redeploy** tras setear `NEXT_PUBLIC_*` → la app usa valores viejos/undefined.
- Allowlist de Supabase sin la entrada localhost → rompe el login local.
- Service role key expuesta: vive solo en env server-side; nunca prefijarla con
  `NEXT_PUBLIC_`.
