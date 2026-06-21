# Plan: Exercise Detail Modal — PWA Visual Fixes

## Context
Three visual issues in the ExerciseDetailModal on PWA/mobile:
1. Purple gradient line at top looks bad (thin decorative bar that clashes with the sheet edge)
2. Sheet takes 100% width on mobile — should be ~70% so the background stays partially visible
3. Exercise GIFs cropped at the top due to `object-cover` on a fixed-height container

## File to modify
`app/components/shared/ExerciseDetailModal.tsx`

---

## Fix 1 — Remove purple gradient line
**Remove** this div entirely (line ~102):
```tsx
<div className="h-0.5 shrink-0 bg-[linear-gradient(90deg,transparent,#7c3aed_25%,#b995ff_60%,transparent)]" />
```

---

## Fix 2 — Sheet width ~70% on mobile
Current `SheetContent` className:
```
w-full max-w-full overflow-hidden p-0 sm:max-w-[34rem]
```
Change to:
```
w-[72vw] max-w-full overflow-hidden p-0 sm:max-w-[34rem]
```
`72vw` ≈ 70% of viewport. `sm:max-w-[34rem]` keeps desktop behaviour unchanged.

Note: The base `Sheet.tsx` has `w-[min(22rem,88vw)]` but ExerciseDetailModal overrides it — only the modal className needs changing.

---

## Fix 3 — GIFs not cropped at top
Current hero image:
```tsx
<img className="h-full w-full object-cover" ... />
```
Change `object-cover` → `object-contain` so the full GIF is visible without cropping:
```tsx
<img className="h-full w-full object-contain" ... />
```
The hero container background (gradient fallback) already provides a dark backdrop, so no extra bg class needed. The `overflow-hidden` on the container stays.

---

## Verification
1. Open PWA on mobile → tap any exercise → confirm:
   - No purple line visible at top of sheet
   - Sheet occupies ~70% of screen width (background partially visible on left)
   - GIF shows complete without top/bottom cropping
2. Check on desktop (sm breakpoint) → sheet still 34rem wide, behaviour unchanged
