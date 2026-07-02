# Login redesign — audit-driven polish + app-native container

## Context

The login (`app/auth/login/`) works but carries design drift and a11y debt that make it
read as unfinished against `DESIGN.md` (dark-only, emerald accent, mobile-first PWA).

Two inputs drove this plan:
- **design-scout** (Playwright, live) — real mobile-native OTP references benchmarked the
  target: SwiftPixel UI (emerald-accent OTP, closest to brand), Dilan Gunasekara "6 digit
  code" (clean dark slots, one active — OTP-input benchmark), Ilhamjan Baltayew (minimal
  dark step flow), Creative Studio (code → success pairing).
- **StyleSeed review** — scored the current login **78/100 (C)**. Main losses: incoherent
  focus rings (three different treatments, one still violet), raw hex where tokens exist,
  a sub-44px back button with no focus ring, and a resend flow with no cooldown despite
  rate-limit copy.

Outcome: raise coherence + a11y to spec (~90) and give the form a proper app-native
container surface matching the references — **without** rebuilding the flow. Keep changes
surgical per `DESIGN.md` and global rules.

## Root findings (evidence)

1. **Three focus rings, one violet.** `Input.tsx:11` focus = `0 0 0 4px rgba(124,58,237,0.16)`
   (**violet — stale**, pre-emerald migration); `OtpLoginFlow.tsx:16` overrides to
   `0 0 0 4px rgba(16,185,129,0.28)`; `InputOtp.tsx:22` slot uses `0 0 0 3px rgba(16,185,129,0.35)`.
   DESIGN.md §3.3 focus-glow token = **`0 0 0 3px rgba(16,185,129,.35)`** — only the slot matches.
2. **Raw hex vs tokens.** `Input.tsx:11` placeholder `#6e7788`; `Button.tsx:15` secondary hover
   `#1b2230`. DESIGN.md exposes `--foreground-subtle` (`#6b7488`) and surface tokens.
3. **Dead override.** `page.tsx:52-55` re-declares `--accent*` inline, but `globals.css:14-17`
   already ships emerald. Redundant drift smell — remove.
4. **A11y — back button.** `OtpLoginFlow.tsx:198-210` "Volver": `px-1 py-1 text-xs` → tap target
   well under 44px (DESIGN §3.1/§7) and no `focus-visible` ring.
5. **Resend UX gap.** `requestErrorCopy["otp-rate-limited"]` exists but there is no cooldown
   countdown; "Reenviar codigo" stays enabled and only fails after the fact.
6. **Container.** Form sits on bare `--workspace`; references and app-native direction favor a
   single subtle `--card` surface wrapping the auth form.

## Approach (recommended: fixes + card container)

### A. Unify focus ring (coherence, +score)
- `Input.tsx` — replace violet `focus:shadow-[0_0_0_4px_rgba(124,58,237,0.16)]` with the DESIGN
  focus-glow: `focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.35)]`.
- `OtpLoginFlow.tsx:15-16` — delete `INPUT_WITH_ICON_CLASS`'s focus override (now redundant since
  base `Input` carries the correct ring); keep only `pl-10`.
- Leave `InputOtp.tsx:22` as-is (already the canonical token).
- Net: one focus treatment everywhere = `0 0 0 3px rgba(16,185,129,.35)` + `--accent` border.

### B. Tokenize hardcoded hex (color discipline)
- `Input.tsx` placeholder `#6e7788` → `placeholder:text-[var(--foreground-subtle)]`
  (verify `--foreground-subtle` exists in `globals.css`; DESIGN §1.2 says it's a Fase 1 add —
  if absent, add it there first per the "update source of truth first" rule).
- `Button.tsx:15` secondary hover `#1b2230` → nearest surface token (`--card-alt` is already the
  base; introduce/So use a `--border-strong`-adjacent hover or a documented token rather than raw hex).
- `page.tsx:52-58` — remove the inline `--accent*` block (dead); keep only the safe-area padding
  style. Confirms globals is the single source.

### C. Back button a11y (`OtpLoginFlow.tsx:198-210`)
- Grow hit area to ≥44px (e.g. `min-h-11 px-2 py-2 -ml-2` so the visual stays left-aligned).
- Add visible focus: `focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(16,185,129,0.35)] focus-visible:rounded-lg`.

### D. Resend cooldown (states/UX)
- In `OtpLoginFlow.tsx`, add a `cooldown` countdown (e.g. 60s) started on successful
  request/resend. While >0: disable the "Reenviar codigo" button and label it
  `Reenviar en {n}s` (tabular-nums). Reuse existing `busyState` disable wiring; add a single
  `useEffect` interval cleared on unmount. No new deps.

### E. App-native container (layout, matches refs)
- Wrap the auth form region (`OtpLoginFlow` + divider + Google) in one `--card` surface:
  `rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6` (DESIGN xl radius §3.2,
  card padding §3.1). Keep the brand/logo block **above** the card (as in Ilhamjan/Dilan refs),
  not inside it, to preserve hierarchy and one focal point.
- Concentric radius: card `20px` outer, inputs/buttons stay `xl` (12px) inner — already consistent.
- Do **not** touch `MobileTabBar` / bottom nav (not present on this route anyway).

## Files to modify

- `app/auth/login/page.tsx` — remove dead `--accent` override; wrap form region in card surface.
- `app/auth/login/OtpLoginFlow.tsx` — drop focus override; back-button tap/focus; resend cooldown.
- `app/components/ui/Input.tsx` — emerald focus ring; tokenize placeholder.
- `app/components/ui/Button.tsx` — tokenize secondary hover hex.
- `app/globals.css` — only if `--foreground-subtle` / a secondary-hover token is missing
  (add there first, per source-of-truth rule).

Reuse, don't recreate: existing `Button`, `Input`, `InputOtp`, `LoadingDots`, `motion`/`fadeUp`,
`normalizeEmail`/`isValidEmail` — all stay. No new components, no new deps.

## Out of scope (follow-up)

Full native-flow redesign (separate email/OTP/success screens with per-step transitions and a
success tick à la Creative Studio) — deferred; revisit if the user wants a redesign.

## Verification

1. `pnpm dev`, open `/auth/login` at mobile (390px) and desktop widths.
2. Tab through: email input, send button, Google, and (step 2) back button, OTP slots, verify,
   resend — every focus ring is the **same emerald** `3px` glow; no violet anywhere.
3. Back button: measure ≥44px hit area (DevTools), visible focus on keyboard.
4. Request a code → "Reenviar" shows `Reenviar en 60s` counting down, disabled, then re-enables.
5. Re-run StyleSeed review on the three files — target ≥90 (A/B).
6. Confirm `prefers-reduced-motion` still neutralizes entrance motion (existing global).
7. `pnpm lint` / typecheck clean.
