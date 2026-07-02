# Plan — Login (OTP) refinement por fases secuenciales

## Context

El login (`app/auth/login/`) es OTP passwordless (email → código 6 dígitos) + fallback Google, dark, acento emerald, PWA mobile-first. Un `design-scout` (Dribbble + 21st.dev) trajo benchmark visual real y un `styleseed-design-review` puntuó el código en **87/100 (B)**. El código ya es sólido (tokens, un acento, radii coherente, motion named, reduced-motion), pero hay deltas de refinamiento vs las referencias:

1. **Jerarquía de CTAs**: en el step token, "Reenviar" es `Button secondary` full-width y compite con "Verificar" (dos botones sólidos). DESIGN.md §1 pide un solo CTA primario por vista.
2. **Sin success state visual**: verify OK solo dispara toast + redirect; el benchmark diferencia el éxito.
3. **Glows sin tokenizar + hex mágico**: `#1b2230` (Button.tsx:15) y 3 focus-glows inline distintos.
4. **Bug de migración descubierto**: `Input.tsx:11` conserva el focus-glow **violeta** `rgba(124,58,237,0.16)` — nunca migrado a emerald (DESIGN §1.3). Afecta todos los forms de la app.
5. Radio del logo badge `rounded-2xl` vs resto `rounded-xl`; caret OTP usa `animate-pulse` genérico.

**Objetivo**: subir a ~95/100 (A) con cambios quirúrgicos (no rediseño), y luego endurecer premium / a11y / motion / funcional en fases posteriores. **Regla dura: cada fase arranca solo cuando la anterior está terminada Y verificada.**

Decisiones del usuario:
- Success state = **inline sutil** (checkmark `--success` lime + slots viran ~500ms, luego redirect; no pantalla dedicada).
- Fix del Input violeta = **global** (arreglar la raíz + tokenizar `--focus-glow`).

Fuente de verdad de diseño: **`DESIGN.md`** (leer antes de tocar UI en cada fase).

---

## Fases (secuenciales, con gate de verificación)

### Fase 1 — Resolver el audit
Skills: `/redesign-existing-projects` `/minimalist-ui` `/high-end-visual-design` `/styleseed-design-review` `/playwright-cli`.
Leer `DESIGN.md` primero. Cambios quirúrgicos:

- **1.1 Jerarquía CTA** (`OtpLoginFlow.tsx` ~l.240-251): "Reenviar codigo" pasa de `Button variant="secondary"` full-width a **link/ghost discreto** (texto, `variant="ghost"` o botón texto centrado con countdown opcional). Único botón sólido en el step = "Verificar codigo". Preservar `disabled`/`busyState` y `LoadingDots`.
- **1.2 Success state inline** (`OtpLoginFlow.tsx` `verifyOtp` ~l.133-139 + `InputOtp.tsx`): al recibir `redirectTo`, marcar éxito visual antes del `window.location.assign` — slots viran a `--success` (lime `#a3e635`, distinto del emerald de acción) + checkmark `lucide-react` (`Check`/`CircleCheck`), ~500ms, respetando `prefers-reduced-motion`. Reusar `microTransition`/`premiumEase` de `motion.tsx`. Nuevo estado local (ej. `status: "success"`).
- **1.3 Tokenizar glows + hex** (`globals.css`, `Button.tsx`, `InputOtp.tsx`, `OtpLoginFlow.tsx`):
  - Agregar token `--focus-glow: 0 0 0 3px rgba(16,185,129,.35)` en `globals.css :root` (DESIGN §3.3) y usarlo en foco/selección de OTP e inputs. Estandarizar los 3 glows inline a un solo valor.
  - Reemplazar `#1b2230` (Button.tsx:15 hover secondary) por un token de superficie (ej. `--card-alt` o nuevo `--card-hover`).
- **1.4 Fix Input violeta GLOBAL** (`Input.tsx:11`): `rgba(124,58,237,0.16)` → emerald vía `--focus-glow`/`--accent`. Corrige el bug de migración en toda la app. Verificar que ningún otro form dependía del violeta.
- **1.5 Coherencia menor**: logo badge `rounded-2xl` → `rounded-xl` (`page.tsx:64`); caret OTP `animate-pulse` → pulso con easing token (`InputOtp.tsx:31`).

**Gate F1**: `pnpm lint` OK. `/playwright-cli` abre `next dev` en **viewport mobile primero** (390×844, PWA = mobile-first real, no desktop stackeado) → recorrer step email + step token + estado success; confirmar slots OTP no quedan angostos, un solo CTA sólido por vista, glow emerald (no violeta), success lime visible. Re-correr `/styleseed-design-review` sobre los archivos: **debe clear ~95/100**. Si no, iterar dentro de F1. No pasar a F2 hasta esto verde.

Archivos críticos F1: `app/auth/login/OtpLoginFlow.tsx`, `app/components/ui/InputOtp.tsx`, `app/components/ui/Button.tsx`, `app/components/ui/Input.tsx`, `app/globals.css`, `app/auth/login/page.tsx`.

### Fase 2 — Revisión premium
Skills: `/playwright-cli` `/minimalist-ui` `/styleseed-design-review` `/high-end-visual-design`.
Abrir browser en **mobile + desktop**. Pregunta guía: *¿qué no es premium todavía?* Revisar spacing/ritmo, jerarquía tipográfica del hero, densidad, alineación óptica, estados hover/press, safe-area (PWA). Anotar hallazgos, aplicar refinamiento acotado (sin rediseño). **Gate F2**: screenshots mobile+desktop revisados, hallazgos resueltos, styleseed se mantiene ≥ score de F1. No pasar a F3 hasta verde.

### Fase 3 — Accesibilidad (WCAG 2.2 AA)
Agent `a11y-architect` + skill `/frontend-a11y`.
Auditar la sección login: foco visible (focus-ring en todo interactivo), contraste real (§1.5 DESIGN), targets táctiles **≥44px** (verificar slots OTP, botón "Volver", link resend), semántica (`label` reales — no solo placeholder, headings, `button` vs `a`, `aria-*`), teclado (orden de foco, paste OTP, `autoComplete="one-time-code"` ya presente). PWA instalada = app nativa, a11y es piso. Aplicar fixes. **Gate F3**: checklist WCAG 2.2 AA de la sección en verde (foco/contraste/targets/semántica/teclado). No pasar a F4 hasta verde.

### Fase 4 — Micro-interacciones
Skills: `/micro-interactions` `/minimalist-ui` `/styleseed-design-review` `/high-end-visual-design`.
Agregar/afinar hover/press/transition con criterio, **priorizando feedback táctil (`active`/press) sobre hover** (mobile no tiene hover real). Reusar tokens de `motion.tsx` (`premiumEase`, `microTransition`, `tapFeedback`) y easings de DESIGN §5. Todo debe degradarse en `prefers-reduced-motion`. Nada de motion infinito decorativo. **Gate F4**: styleseed Motion & polish ≥ 11/12, reduced-motion verificado, sin motion que frene acciones. No pasar a F5 hasta verde.

### Fase 5 — Verificación funcional
Skill `/verify`.
Correr el flujo real end-to-end del login (no solo compila/typecheck): request-otp → recibir código → verify-otp → redirect; probar errores (email inválido, código vencido, rate-limit) y el fallback Google. Confirmar que nada se rompió tras los cambios visuales de F1-F4. **Gate F5**: flujo end-to-end OK, sin regresiones.

---

## Verificación (cómo se prueba cada gate)

- **Lint/build**: `pnpm lint` (y `pnpm build` si hay dudas de tipos). `pnpm validate:mobile` para chequeo mobile automatizado.
- **Visual**: `/playwright-cli` con `next dev` — **mobile 390×844 primero**, luego desktop. Screenshots antes/después.
- **Score**: `/styleseed-design-review` re-corrido sobre los archivos tocados (target F1 ~95).
- **A11y**: checklist WCAG 2.2 AA de `a11y-architect`/`/frontend-a11y`.
- **Funcional**: `/verify` end-to-end del flujo OTP + Google.
- **Credenciales admin** para probar login real: `.env.local` (`EMAIL` / `EMAIL_PASSWORD`).
- Tras cerrar código: `graphify update .` para mantener el grafo.

## Riesgos

- **Blast radius del fix Input global (1.4)**: toca todos los forms. Mitigación: es solo el color del focus-glow (violeta→emerald), sin cambio estructural; verificar visualmente algún otro form.
- **Success state (1.2)**: no debe frenar el login recurrente — mantener ~500ms y saltar animación en reduced-motion.
- **No tocar** la bottom nav / `MobileTabBar` (DESIGN §6.2) ni tamaños/posición PWA salvo pedido explícito.
- Mantener `DESIGN.md` como fuente de verdad: si una decisión cambia, actualizar el doc primero.
