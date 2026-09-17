---
type: "query"
date: "2026-09-16T16:35:49.567179+00:00"
question: "okey, perfecto los ejercicios, pero lo de los RIR no se puede guardar exactamente como digo?"
contributor: "graphify"
source_nodes: ["routine-validation.ts", "routine-form.ts", "RoutineAdminClient.tsx", "routines.ts"]
---

# Q: okey, perfecto los ejercicios, pero lo de los RIR no se puede guardar exactamente como digo?

## Answer

Expanded from original query via vocab: [rir, routine, items, form, validation, range, repetitions]. Sí, pero requiere evolucionar el contrato: routine_items.rir es int4 NOT NULL con CHECK rir >= 0; routine-validation exige entero no negativo; los tipos TypeScript usan number; y admin_save_routine convierte JSON con ::integer. La opción mínima es convertir rir a text con validación para enteros, rangos como 1-2 y fallo, actualizar tipos, RPC y presentación. Los valores existentes migran con rir::text.

## Source Nodes

- routine-validation.ts
- routine-form.ts
- RoutineAdminClient.tsx
- routines.ts