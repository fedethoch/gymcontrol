# Plan: Arreglar login OTP 6 digitos + desbloquear validacion responsive

## Context

La primera pasada responsive valido rutas publicas (375/768/1440), pero las rutas
protegidas/admin no se pudieron validar: el login por email esta roto. Al pedir codigo
llega un **magic link**, no un codigo de 6 digitos, asi que el formulario "Codigo de 6
digitos" no puede avanzar. Solo se entra con Google.

**Diagnostico real (confirmado en exploracion):** el codigo de la app YA esta bien para
OTP de 6 digitos. El problema vive en el **dashboard hosted de Supabase**, no en el repo:

- `app/api/auth/request-otp/route.ts:45-50` usa `signInWithOtp({ email, options: { shouldCreateUser: true } })` **sin `emailRedirectTo`** → modo codigo, no magic link.
- `app/api/auth/verify-otp/route.ts:47-51` usa `verifyOtp({ email, token, type: "email" })` → correcto para codigo.
- `app/lib/auth-input.ts:4` valida `^\d{6}$` → correcto segun design intent.
- `README.md:43` lo dice explicito: "el template `Magic Link` de Supabase debe usar `{{ .Token }}`". Hoy el template sigue emitiendo `{{ .ConfirmationURL }}` (link) → de ahi el magic link.
- `docs/codex/ENV_INDEX.md:13`: templates, OTP length y expiracion son config **externa** (dashboard). El MCP de este repo es `database,docs` → NO puede tocar auth config.
- La incidencia "8 digitos" = "Email OTP Length" del dashboard seteado en 8, mientras el front valida 6.

**Decisiones del usuario:**
- OTP **estrictamente 6 digitos** en todo (setear dashboard a 6; NO tocar regex/frontend).
- Los cambios de dashboard **los aplica el usuario** con los pasos/template que se le entregan.

**Conclusion clave:** esto es 90% config de dashboard + entregar el template correcto.
Cambios de codigo: minimos o ninguno (a confirmar en validacion). No rediseñar, no rehacer responsive.

---

## Parte A — Config Supabase (la aplica el usuario, fuera del repo)

Entregar instrucciones exactas. El usuario las pega en el dashboard hosted.

### A1. Email OTP Length = 6
`Auth > Providers > Email > Email OTP Length` → **6**.
Esto alinea el codigo generado con `^\d{6}$` (`app/lib/auth-input.ts:4`). No se toca regex.

### A2. Email OTP Expiration
`Auth > Providers > Email > Email OTP Expiration` → valor razonable (ej. **600 s / 10 min**).
Se usa en la nota de expiracion del template.

### A3. Template del email (Magic Link template → emitir codigo)
`Auth > Email Templates > Magic Link`. Reemplazar el cuerpo (que hoy usa
`{{ .ConfirmationURL }}`) por uno que muestre `{{ .Token }}`.

**Asunto:**
```
Tu codigo de acceso a Gymcontrol
```

**HTML:**
```html
<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0a0f1a; padding:32px; color:#e8edf6;">
  <div style="max-width:440px; margin:0 auto; background:#111723; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:32px;">
    <h1 style="margin:0 0 8px; font-size:20px; font-weight:700; color:#ffffff;">Tu codigo de acceso</h1>
    <p style="margin:0 0 24px; font-size:14px; line-height:1.6; color:#9aa3b8;">
      Usa este codigo para iniciar sesion en Gymcontrol.
    </p>
    <div style="font-size:34px; font-weight:700; letter-spacing:8px; text-align:center; color:#ffffff; background:rgba(124,58,237,0.12); border:1px solid rgba(185,149,255,0.24); border-radius:12px; padding:18px 0; margin-bottom:24px;">
      {{ .Token }}
    </div>
    <p style="margin:0 0 8px; font-size:13px; line-height:1.6; color:#9aa3b8;">
      El codigo vence en 10 minutos.
    </p>
    <p style="margin:0; font-size:13px; line-height:1.6; color:#7d8697;">
      Si no pediste este codigo, ignora este correo. Tu cuenta sigue segura.
    </p>
  </div>
</div>
```

**Texto plano (si el dashboard lo separa):**
```
Tu codigo de acceso a Gymcontrol: {{ .Token }}

Usalo para iniciar sesion. Vence en 10 minutos.
Si no lo pediste, ignora este correo.
```

> Nota: en Supabase el OTP por email reusa el template **Magic Link**; la variable
> `{{ .Token }}` es la que imprime el codigo. No usar `{{ .ConfirmationURL }}`.

### A4. (Verificar, no necesariamente cambiar)
- Google OAuth provider sigue habilitado y su callback (`/auth/callback`) en allow list. No se toca.
- Confirmar que no haya `emailRedirectTo` forzado a nivel proyecto (en repo no existe).

---

## Parte B — Codigo (repo)

Por diagnostico, el flujo de codigo ya esta correcto. Cambios candidatos, **solo si la
validacion los justifica** (no parchear preventivamente):

- **Ninguno esperado en el happy-path de OTP.** El input ya hace `maxLength={6}`, strip de
  no-digitos y `autoComplete="one-time-code"` (`OtpLoginFlow.tsx`), que cubre paste.
- **Inconsistencia menor pre-existente a confirmar/cerrar:** `app/auth/login/page.tsx:42`
  manda al no-admin logueado a `/dashboard`, pero `app/lib/auth.ts:65` (`getPostLoginRedirectPath`)
  lo manda a `/`. No rompe login, pero conviene unificar destino post-login. Decision: alinear
  ambos a `/dashboard` (1 linea en `auth.ts`) **si** se confirma como friccion en la validacion.
- Preferir fix global/helper antes que parche duplicado (regla del usuario). No se prevee
  duplicacion aca.

**No se toca:** regex `^\d{6}$`, rutas Google, middleware/`proxy.ts`, clientes Supabase.

---

## Parte C — Validacion post-login (Playwright)

Precondicion: usuario aplico A1-A3. Login admin con credenciales de `.env.local`
(`EMAIL` / `EMAIL_PASSWORD`).

Validar en el dev server (puerto 3000 ya corriendo):
1. **Login OTP por codigo:** pedir codigo en `/auth/login`, confirmar que el email trae un
   codigo de 6 digitos (no link), ingresarlo, verificar redirect a `/admin` o `/dashboard`.
2. **Google Auth sigue ok:** flujo `/auth/google/start` → callback → sesion.
3. **Rutas protegidas/admin accesibles** con sesion activa.
4. **Logout:** POST `/auth/signout` → vuelve a `/auth/login?status=signed-out`.
5. **Errores:** codigo invalido y codigo expirado muestran mensaje correcto
   (`invalid-or-expired-otp`), sin romper UI.
6. **Mobile usability del form** a 375px: input de codigo legible, teclado numerico
   (`one-time-code`), botones tap-target ≥44px.

---

## Parte D — Responsive pendiente (Playwright 375/768/1440)

Con login funcionando, validar las rutas que quedaron bloqueadas y ya tienen el patron
tabla→cards aplicado (lint-clean, no live-tested):
- `/admin/rutinas` (`RoutineAdminClient.tsx`)
- `/admin/alimentos` (`FoodAdminClient.tsx`)
- `/admin/recetas` (`RecipeAdminClient.tsx`)
- `/dashboard` (+ `TrainingCalendarCard` overflow)

Chequear en cada una: sin scroll horizontal (`scrollingElement.scrollWidth === clientWidth`),
cards mobile legibles <768px, tabla intacta ≥768px, desktop 1440 igual o mejor.
Re-validar rutas publicas tocadas solo si algo lo amerita.

---

## Parte E — Auditoria impeccable

Correr `impeccable` sobre login, admin, dashboard y responsive general. Corregir hallazgos
**despues** de pasar la validacion (no antes, para no parchear a ciegas).

---

## Verificacion / criterios de finalizacion

- El email de login llega con **codigo de 6 digitos** (no magic link).
- Login por OTP entra y redirige correcto; Google Auth sigue funcionando; logout ok.
- Codigo invalido/expirado manejado con mensaje claro.
- 6 digitos consistente: dashboard=6, `^\d{6}$` sin cambios, input `maxLength=6`.
- Las 4 rutas protegidas: sin overflow horizontal y cards/tabla correctas en 375/768/1440;
  desktop igual o mejor.
- `impeccable` sin hallazgos abiertos relevantes.
- `graphify update .` al cerrar (si hubo cambios de codigo).

## Entregable final

Reporte con: diagnostico magic-link vs OTP · config de dashboard aplicada · cambios de codigo
(si hubo) · validacion Playwright (login + admin/dashboard responsive) · hallazgos impeccable ·
confirmacion de que no quedan problemas responsive ni de login.
