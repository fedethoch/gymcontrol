# Plan: Fix 6 PWA bugs (login, OTP, rename rutina, registro pesos, play ejercicio, config overflow)

## Context

Six reported defects in the PWA, ranging from repetitive login copy to broken workout
logging. Each is isolated and low-risk. Root causes confirmed by static exploration; two
(#5 play, #6 overflow) need a Playwright confirmation pass since they are runtime/layout
behaviors. Goal: surgical fixes, no redesign, reuse existing helpers (notably
`renameSavedRoutineForUser`, already in the lib but unused).

---

## Issue 1 — Remove "Necesitas iniciar sesion..." on first open

**Cause:** `requireUser()` redirects logged-out users to `/auth/login?reason=auth-required`
(`app/lib/auth.ts:113`). The login page renders that reason as a red toast
(`app/auth/login/page.tsx:14-16, 48, 108`).

**Fix (login page only, keep redirect param):**
- `app/auth/login/page.tsx`: delete `reasonCopy`, `reasonMessage`, and the
  `<StatusToast message={reasonMessage} ... clearParams={["reason"]} />` line.
- Leave `?reason=auth-required` redirects intact (harmless, no longer shown).

---

## Issue 2 — Email sends magic link instead of 6-digit code

**Cause:** Code is already correct for OTP-by-code (`signInWithOtp` without `emailRedirectTo`
in `app/api/auth/request-otp/route.ts:45-50`; `verifyOtp` type `"email"`; regex `^\d{6}$`).
The magic link comes from the **Supabase dashboard email template** still emitting
`{{ .ConfirmationURL }}`. This is config, not code (see prior plan
`.claude/plans/arreglar-login-otp-y-validar-responsive.md`).

**Deliver to user (they apply in hosted dashboard):**
1. `Auth > Providers > Email > Email OTP Length` → **6**.
2. `Auth > Providers > Email > Email OTP Expiration` → **600** (10 min).
3. `Auth > Email Templates > Magic Link` → replace body to use `{{ .Token }}` (the
   ready HTML/subject/plaintext is in the prior plan, §A3). Do **not** use
   `{{ .ConfirmationURL }}`.

No repo change expected. MCP `supabase_gymcontrol` cannot edit auth config — user-applied.

---

## Issue 3 — Small edit button to rename the active routine

**Reuse:** `renameSavedRoutineForUser({ savedRoutineId, userId, customName })`
(`app/lib/saved-routines.ts:330`) — already implemented, currently unused. `displayName`
derives from `custom_name` via `resolveDisplayName`.

**Implementation:**
- New server action `renameSavedRoutineAction(savedRoutineId, customName)` in a new
  `app/rutinas/actions.ts` (mirror pattern of `app/catalogo/rutinas/[id]/actions.ts`):
  `requireUser()` → `renameSavedRoutineForUser` → `revalidatePath("/")` +
  `revalidatePath("/rutinas")`. Return `{ ok }`.
- `app/rutinas/page.tsx`: pass `activeRoutine.id` into `RutinasOverview`.
- `app/rutinas/RutinasOverview.tsx` (Row 1 "Rutina activa", next to `{displayName}` at
  L88-90): add a tiny ghost icon button (`Pencil` from `lucide-react`, ~`size-3.5`,
  muted) that opens an inline edit affordance. Minimal approach: toggle the `<h2>` into a
  controlled `<Input>` + confirm (Check) / cancel (X) on small icon buttons; on confirm
  call the action. Keep it subtle (matches premium/minimal rule). Use existing
  `Input`/`Button` primitives and framer `whileTap`.

---

## Issue 4 — "Error" when entering reps/weights

**Cause:** Per-series cells are joined with `/` including empty slots
(`joinSeriesValues`, `DayWorkoutClient.tsx:47`). Filling one series of N produces e.g.
`"12//"`. Autosave validation in `app/rutinas/dia/actions.ts:86-108` splits on `/` and
rejects any token not matching `^\d+$` (reps) / `^\d+(\.\d+)?$` (weight) — empty tokens
fail → `RowSaveIndicator` shows **Error** on every partial entry.

**Fix (`app/rutinas/dia/actions.ts`, `parseSeriesValues`):**
- Drop empty tokens before validation: `tokens.filter((t) => t !== "")`.
- Validate `maxValues` against the original split length (not after filter) so >N real
  values still errors.
- Return the filtered tokens joined by `/` (stores only filled series), or `null` if none.
- Confirm reps stays integer-only and weight allows decimals (unchanged patterns).

---

## Issue 5 — Play button in exercise detail does nothing

**Cause (likely):** Nested Radix overlays. `ExerciseDetailModal` renders the gif in a
`<Dialog>` while the `<Sheet>` (Radix modal) is open
(`app/components/shared/ExerciseDetailModal.tsx:204-222`). An open modal Sheet marks
sibling portals inert/aria-hidden, so the gif Dialog opens suppressed/non-interactive.

**Fix (preferred, avoids nested modal):** Replace the separate gif `Dialog` with an inline
swap inside the Sheet hero — clicking play (L106-118) toggles the hero `<Image src>` from
`imageUrl` to `gifUrl` (unoptimized), with a pause/replay control. Removes the
`Dialog`/`gifOpen` nesting entirely. Keep play button hidden when `gifUrl` is null.
- Note: exercises with no `gif_url` (`saved-routines.ts:634`) correctly show no play.

**Confirm with Playwright before finalizing** the exact failure (inert vs. null gif vs.
image host). If repro shows gif simply absent in data, surface that instead of over-fixing.

---

## Issue 6 — Config cards widen off-screen after a save/fetch

**Cause (hypothesis):** `ConfiguracionClient` wrappers use bare `grid`
(`app/configuracion/ConfiguracionClient.tsx:403` root `grid gap-5`, `405` `grid gap-4`).
A Tailwind `grid` with no column template = single implicit `auto` column that sizes to
max-content, not constrained to the parent. After a save re-render, a `nowrap`/min-content
child (e.g. a status chip / summary span) expands the auto track → all cards overflow.
`.page-frame` itself is fine (`minmax(0,1fr)`, `globals.css:458`).

**Fix:** constrain the grid wrappers — change root and mobile wrappers to
`grid grid-cols-[minmax(0,1fr)]` (or add `min-w-0` / `w-full max-w-full`). Audit truncate
spans (`dataSummary`, status chips) keep `min-w-0`.

**Confirm with Playwright:** at 375px, save a field (e.g. weight) and assert
`document.scrollingElement.scrollWidth === clientWidth` before and after; tune if a
different child is the real offender.

---

## Files to modify

| Issue | Files |
| --- | --- |
| 1 | `app/auth/login/page.tsx` |
| 2 | none (Supabase dashboard, user-applied) |
| 3 | `app/rutinas/actions.ts` (new), `app/rutinas/page.tsx`, `app/rutinas/RutinasOverview.tsx` |
| 4 | `app/rutinas/dia/actions.ts` |
| 5 | `app/components/shared/ExerciseDetailModal.tsx` |
| 6 | `app/configuracion/ConfiguracionClient.tsx` |

## Verification (end-to-end, dev server :3000, admin creds in `.env.local`)

1. **#1** open `/rutinas` logged out → redirect to login, **no** red "Necesitas iniciar
   sesion" toast.
2. **#2** request code at `/auth/login` → email arrives with **6-digit code** (post
   dashboard config), verify → redirect.
3. **#3** `/rutinas` → pencil next to active routine name → rename → persists after reload;
   `displayName` updates everywhere.
4. **#4** open a day, expand exercise, type reps+weight in one of N series → shows
   "Guardando/Guardado", **no Error**; full + partial entries both save.
5. **#5** open exercise detail → play → gif animates inline (no dead click).
6. **#6** `/configuracion` at 375px → change weight → no horizontal overflow
   (`scrollWidth === clientWidth`), cards stay in viewport.
7. `npm run lint` clean; `graphify update .` after code changes.

## Risks

- #2 is outside the repo; if the user skips the dashboard steps, login stays broken — call
  this out explicitly.
- #5 inline-swap changes UX slightly (no modal); acceptable and more robust.
- #4 filtering empties means stored value holds only filled series — verify history/weekly
  summary readers (`workout-tracking.ts`) tolerate fewer-than-N values (they already parse
  `/`-joined strings).
