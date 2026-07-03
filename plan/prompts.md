Workflow PWA — redesign sección a sección

- Fase 0 — OneTime
usa /interface-design /styleseed-design-review /redesign-existing-projects /minimalist-ui /high-end-visual-design /frontend-a11y para modificar CLAUDE.md y generar DESIGN.md. Pregunta todo hasta entender dirección exacta (paleta, tipografía, spacing, tono app-native vs web). Incluir sección PWA: app-shell, navegación bottom nav (no tocar sin pedido), estados offline/instalación si aplica.
- Fase 1 — Audit
/interface-design /styleseed-design-review /design-scout audita [sección]. design-scout trae referencia visual real (Awwwards/Dribbble/21st.dev) vía Playwright, no solo crítica — da benchmark concreto pre-plan. todo para PWA
- Fase 2 — Plan (plan-mode)
/redesign-existing-projects /minimalist-ui /high-end-visual-design /styleseed-design-review /playwright-cli en base al audit genera plan. Lee DESIGN.md. Playwright chequea viewport mobile primero (PWA = mobile-first real, no desktop stackeado).
- Fase 3 — Revisión
/playwright-cli /minimalist-ui /styleseed-design-review /high-end-visual-design abre browser, revisa mobile + desktop. ¿Qué no es premium?
- Fase 4 — Accesibilidad (nueva, antes de micro-interacciones) 
agent a11y-architect + /frontend-a11y audita WCAG 2.2 sección: foco, contraste, targets táctiles ≥44px, semántica. PWA instalada = usuario la trata como app nativa, a11y no es opcional.
- Fase 5 — Micro-interacciones
/micro-interactions /minimalist-ui /styleseed-design-review /high-end-visual-design agrega hover/press/transition con criterio. Priorizar feedback táctil (active states) sobre hover — mobile no tiene hover real.
- Fase 6 — Verificación funcional
skill /verify — corre flujo real end-to-end en la sección (no solo compila/typecheck). Confirma nada roto tras cambios visuales.
- Fase 7 — Consistencia final
/styleseed-design-review audita inconsistencias cross-sección.
- Fase 8 — Repetir Fase 2 con siguiente sección.





### Secciones

Públicas / auth

┌─────┬──────────────────────┬─────────────┬────────────────────────────────────────────┐
│  #  │       Sección        │    Ruta     │                  Archivo                   │
├─────┼──────────────────────┼─────────────┼────────────────────────────────────────────┤
│ 1   │ Home / landing       │ /           │ app/page.tsx                               │
├─────┼──────────────────────┼─────────────┼────────────────────────────────────────────┤
│ 2   │ Login (OTP + Google) │ /auth/login │ app/auth/login/page.tsx + OtpLoginFlow.tsx │ CHECK
└─────┴──────────────────────┴─────────────┴────────────────────────────────────────────┘

Usuario — Entrenamiento

┌─────┬────────────────────┬────────────────────────┬───────────────────────────────────────────┐
│  #  │      Sección       │          Ruta          │                  Archivo                  │
├─────┼────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ 3   │ Dashboard          │ /dashboard             │ app/dashboard/page.tsx (recién trabajado  │ INPROCESS
│     │ principal          │                        │ en commits)                               │
├─────┼────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ 4   │ Mis rutinas        │ /dashboard/rutinas     │ app/dashboard/rutinas/page.tsx            │
│     │ (dashboard)        │                        │                                           │
├─────┼────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ 5   │ Día de entreno     │ /dashboard/rutinas/dia │ dia/page.tsx + DayWorkoutClient.tsx       │
│     │ (dashboard)        │                        │                                           │
├─────┼────────────────────┼────────────────────────┼───────────────────────────────────────────┤
- navigation-config.ts

Usuario — Entrenamiento

┌─────┬────────────────────┬────────────────────────┬───────────────────────────────────────────┐
│  #  │      Sección       │          Ruta          │                  Archivo                  │
├─────┼────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ 3   │ Dashboard          │ /dashboard             │ app/dashboard/page.tsx (recién trabajado  │
│     │ principal          │                        │ en commits)                               │
├─────┼────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ 4   │ Mis rutinas        │ /dashboard/rutinas
└─────┴──────────────────────┴─────────────┴────────────────────────────────────────────┘
Usuario — Catálogo

┌─────┬──────────────────┬────────────────────────┬───────────────────────────────┐
│  #  │     Sección      │          Ruta          │            Archivo            │
├─────┼──────────────────┼────────────────────────┼───────────────────────────────┤
│ 8   │ Catálogo         │ /catalogo              │ app/catalogo/page.tsx         │
├─────┼──────────────────┼────────────────────────┼───────────────────────────────┤
│ 9   │ Catálogo rutinas │ /catalogo/rutinas      │ app/catalogo/rutinas/page.tsx │
├─────┼──────────────────┼────────────────────────┼───────────────────────────────┤
│ 10  │ Detalle rutina   │ /catalogo/rutinas/[id] │ [id]/page.tsx                 │
└─────┴──────────────────┴────────────────────────┴─
│ 12  │ Recetas          │ /recetas            │ app/recetas/page.tsx            │
├─────┼──────────────────┼─────────────────────┼─────────────────────────────────┤
│ 13  │ Registro comidas │ /nutricion/registro │ app/nutricion/registro/page.tsx │
└─────┴──────────────────┴─────────────────────┴─────────────────────────────────┘

Usuario — Cuenta

┌─────┬───────────────┬────────────────┬────────────────────────────┐
│  #  │    Sección    │      Ruta      │          Archivo           │
├─────┼───────────────┼────────────────┼────────────────────────────┤
│ 14  │ Configuración │ /configuracion │ app/configuracion/page.tsx │
└─────┴───────────────┴────────────────┴────────────────────────────┘

Admin
├─────┼──────────────────┼───────────────────┼───────────────────────────────┤
│ 15  │ Admin home       │ /admin            │ app/admin/page.tsx            │
├─────┼──────────────────┼───────────────────┼───────────────────────────────┤
│ 16  │ Admin ejercicios │ /admin/ejercicios │ app/admin/ejercicios/page.tsx │
├─────┼──────────────────┼───────────────────┼───────────────────────────────┤
│ 17  │ Admin rutinas    │ /admin/rutinas    │ app/admin/rutinas/page.tsx    │
├─────┼──────────────────┼───────────────────┼───────────────────────────────┤
│ 18  │ Admin alimentos  │ /admin/alimentos  │ app/admin/alimentos/page.tsx  │
├─────┼──────────────────┼───────────────────┼───────────────────────────────┤
│ 19  │ Admin recetas    │ /admin/recetas    │ app/admin/recetas/page.tsx    │
└─────┴──────────────────┴───────────────────┴───────────────────────────────┘


## Ciclo AUDITAR ⇄ EJECUTAR — 2 prompts

Reemplaza el prompt único de 7 etapas. Ciclo: auditar → ejecutar → auditar → ejecutar... hasta que la auditoría no arroje hallazgos significativos. Fase 0 no entra (OneTime, ya corrida). Copiar/pegar alternando A y B, reemplazar [SECCIÓN] / [ARCHIVO(S)].

### Prompt A — AUDITAR

/interface-design /styleseed-design-review /design-scout audita [sección]. design-scout trae referencia visual real (Awwwards/Dribbble/21st.dev) vía Playwright, no solo crítica — da benchmark concreto pre-plan. todo para PWA

### Prompt B - AUDITAR segundo run

/interface-design /styleseed-design-review /design-scout segundo audit. design-scout trae referencia visual real (Awwwards/Dribbble/21st.dev) vía Playwright, no solo crítica — da benchmark concreto pre-plan. todo para PWA

### Prompt A — AUDITAR

/interface-design /styleseed-design-review /design-scout audita [sección]. design-scout trae referencia visual real (Awwwards/Dribbble/21st.dev) vía Playwright, no solo crítica — da benchmark concreto pre-plan. todo para PWA

### Prompt B — EJECUTAR

genera un plan para ir haciendo estas fases una a una y comenzara la proxima solamente cuando la anterior este terminada y verificada
- Fase 1 - resolver audit
/redesign-existing-projects /minimalist-ui /high-end-visual-design /styleseed-design-review /playwright-cli Resolve todo el audit. Lee DESIGN.md. Playwright chequea viewport mobile primero (PWA = mobile-first real, no desktop stackeado).
- Fase 2 — Revisión
/playwright-cli /minimalist-ui /styleseed-design-review /high-end-visual-design abre browser, revisa mobile + desktop. ¿Qué no es premium?
- Fase 3 — Accesibilidad (nueva, antes de micro-interacciones) 
agent a11y-architect + /frontend-a11y audita WCAG 2.2 sección: foco, contraste, targets táctiles ≥44px, semántica. PWA instalada = usuario la trata como app nativa, a11y no es opcional.
- Fase 4 — Micro-interacciones
/micro-interactions /minimalist-ui /styleseed-design-review /high-end-visual-design agrega hover/press/transition con criterio. Priorizar feedback táctil (active states) sobre hover — mobile no tiene hover real.
- Fase 5 — Verificación funcional
skill /verify — corre flujo real end-to-end en la sección (no solo compila/typecheck). Confirma nada roto tras cambios visuales.

### Cierre de sección

Cuando una ronda de AUDITAR no arroja hallazgos significativos, marcar la sección DONE en la tabla de este archivo y pasar a la siguiente sección de la lista (arranca de nuevo con Prompt A, ronda 1).

