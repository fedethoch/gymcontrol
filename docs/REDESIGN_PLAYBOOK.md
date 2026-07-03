# Redesign Playbook (Gymcontrol)

Sistema de prompts para rediseñar una pantalla a calidad app premium, limpia y bien distribuida.
Objetivo: evitar el fallo típico (skill overload → default AI → cards apiladas en vertical).

## Principios

1. **Una skill líder por fase.** Las demás revisan con rol acotado, no rediseñan. Nunca dos líderes de layout en la misma fase.
2. **Layout es un entregable explícito** (Fase 2). Sin esto, el modelo siempre vuelve a apilar cards.
3. **Target visual concreto.** Nunca dejar `[sección]` como placeholder. Rellenar con la pantalla real.
4. **Mobile-first PWA.** Prohibido apilar secciones de desktop en vertical. Diseñar el mobile pensado (zonas, grid/bento, jerarquía).
5. **Gate de screenshot entre fases.** La siguiente fase arranca solo si la anterior verificó con Playwright (mobile primero).

## Reglas globales (pegar una vez arriba de cada sesión)

```
REGLAS DE ESTA SESIÓN DE REDISEÑO
- Sección objetivo: DASHBOARD PRINCIPAL (reemplazar por la real, nunca dejar [placeholder]).
- Fuente de verdad de diseño: leer DESIGN.md antes de tocar nada. Dark-only, acento emerald ≤10%, Sora+Geist, tap ≥44px, mobile primario.
- PWA = app nativa mobile-first. PROHIBIDO apilar secciones desktop en vertical. Diseñar layout mobile pensado (zonas, grid/bento, jerarquía), no lista de cards.
- Una fase a la vez. La siguiente arranca SOLO cuando la anterior está terminada y verificada con screenshot Playwright (mobile primero, luego desktop).
- Por fase hay UNA skill líder. Las demás revisan con rol acotado, no rediseñan.
- Cambios quirúrgicos salvo que pida rediseño total.
```

## Ejecución encadenada (pegar arriba de cada prompt agrupado)

```
EJECUCIÓN ENCADENADA
- Corré las fases de este prompt en orden, una a la vez.
- Al terminar una fase: verificá con screenshot Playwright (mobile primero). Si pasa, seguí con la siguiente SIN pedir confirmación.
- FRENÁ y avisame si: una fase falla verificación, el layout queda apilado en vertical, o rompés funcionalidad. No sigas de largo tapando el error.
- Al terminar la última fase del prompt, parás y me mostrás screenshots antes/después para aprobar.
```

---

## Compresión: 7 fases → 3 prompts

Agrupadas por dónde hace falta review humano.

| Prompt | Fases | Gate al final |
|---|---|---|
| 1 | 0 + 1 (referencia + audit) | Aprobás dirección visual |
| 2 | 2 + 3 (layout + piel) | Aprobás lo visual |
| 3 | 4 + 5 + 6 (a11y + micro + verify) | Done |

Gates obligatorios (no auto-continuar sin tu ojo):
- **Después de Fase 0** — si el benchmark está mal, todo sale mal.
- **Después de Fase 2** — el layout es lo que falla siempre; verlo antes de vestirlo.

Opción paranoia: separar Prompt 2 en dos (Fase 2 sola, luego Fase 3) → 4 prompts, pero cazás el stacking antes de gastar la piel.

---

## PROMPT 1 — Referencia + Audit (read-only, no toca código)

```
[REGLAS GLOBALES]
[EJECUCIÓN ENCADENADA]

--- FASE 0: Referencia real ---
/design-scout dashboard principal — traé 3-4 referencias reales de dashboards de apps premium (Awwwards/Dribbble/21st.dev) vía Playwright, viewport mobile.
Complementá con /imagegen-frontend-mobile: generá 1 concept app-native de cómo debería verse esta pantalla (solo imagen de referencia).
Entregable: board de referencia + qué patrones de distribución usan (zonas, grids, densidad). NO tocar código.

--- FASE 1: Auditar lo actual ---
/styleseed-design-review lidera: puntuá por qué el dashboard actual "parece AI-generated".
Apoyo /design-taste-frontend (audit-first, detectá slop) y /ui-ux-pro-max (jerarquía/IA/carga cognitiva).
Playwright abre la pantalla real en mobile. Diff concreto contra el board de Fase 0.
Entregable: lista priorizada de defectos, cada uno con fix propuesto. NO tocar código.
```

## PROMPT 2 — Layout + Piel

```
[REGLAS GLOBALES]
[EJECUCIÓN ENCADENADA]

--- FASE 2: Arquitectura de layout ---
/interface-design lidera (skill de UI de producto/dashboards, no marketing).
Diseñá el SISTEMA DE DISTRIBUCIÓN ESPACIAL: zonas, grid/bento, jerarquía visual, densidad.
PROHIBIDO resolver como stack vertical de cards. Definí qué va agrupado, qué es hero, qué es secundario, qué colapsa en mobile.
Apoyo /redesign-existing-projects para migrar sin romper funcionalidad.
Playwright verifica mobile. Entregable: layout nuevo implementado + screenshot.

--- FASE 3: Piel premium ---
(solo si Fase 2 pasó) /high-end-visual-design lidera: tipografía, escala, spacing, sombras, radios, el "se ve caro".
Apoyo /minimalist-ui (contenido justo, editar de más) y /styleseed-design-review (re-scorea).
Respetar DESIGN.md: emerald ≤10% superficie, un CTA primario por vista. NO cambiar el layout de Fase 2, solo vestirlo.
Playwright mobile+desktop. Entregable: screenshots antes/después.
```

## PROMPT 3 — A11y + Micro + Verify

```
[REGLAS GLOBALES]
[EJECUCIÓN ENCADENADA]

--- FASE 4: Accesibilidad ---
Agent a11y-architect + /frontend-a11y + /web-design-guidelines.
Auditá WCAG 2.2 en la sección: foco visible, contraste, targets táctiles ≥44px, semántica, orden de tab.
PWA instalada = usuario la trata como app nativa, a11y no opcional.
Entregable: fixes aplicados + checklist.

--- FASE 5: Micro-interacciones ---
/micro-interactions lidera, con Framer Motion.
Prioridad: feedback táctil (active/press states) sobre hover — mobile no tiene hover real.
Cubrir: press de botones, tabs, selección, loading, drawers/modales, transición de íconos.
Apoyo /styleseed-design-review (que el motion no sea barato: nada de glows random ni bounce excesivo).
Entregable: motion aplicado + screenshot/clip.

--- FASE 6: Verificación funcional ---
/playwright-cli abre mobile + desktop, recorre la pantalla real.
/verify corre el flujo end-to-end de la sección (no solo compila/typecheck). Confirmá que nada se rompió tras los cambios visuales.
Entregable: reporte de flujo OK/roto.
```

---

## Skills usadas (cobertura completa)

design-scout, imagegen-frontend-mobile, styleseed-design-review, design-taste-frontend, ui-ux-pro-max, interface-design, redesign-existing-projects, high-end-visual-design, minimalist-ui, a11y-architect, frontend-a11y, web-design-guidelines, micro-interactions, playwright-cli, verify.

## Anti-patrón que esto corrige

Poner 4-5 skills como líderes simultáneos por prompt → direcciones visuales peleando → default → **cards apiladas en vertical**. Una líder por fase lo evita.
