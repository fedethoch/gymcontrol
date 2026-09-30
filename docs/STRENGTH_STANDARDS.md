# Estándares de fuerza por grupo muscular (sexo, edad, peso corporal)

Investigación (2026-09-17) y diseño (hasta 2026-09-30) del "nivel de fuerza por grupo" de la app. **Implementado el 2026-09-30.**
Todos los números vienen de fuentes leídas; los marcados **(calc.)** son derivados propios a partir de números de la fuente.

## Implementación (2026-09-30)

| Qué | Dónde |
|---|---|
| Tablas de StrengthLevel (21, verificadas celda por celda contra el HTML) y curvas de edad | `app/lib/strength-standards-data.ts` |
| Grupos, ejercicios de medición por prioridad, interpolación, edad, nivel y división, elección por rutina activa | `app/lib/strength-standards.ts` (tests: `tests/unit/strength-standards.test.mjs`) |
| Mejor marca de 180 días por ejercicio de medición | `listStrengthRecords` en `app/lib/workout-tracking.ts` |
| Resolución con perfil y rutina activa, textos del mapa | `app/page.tsx` (`toMuscleStrengthPoint`) |
| Colores, etiquetas ("Novato 2") e intensidad por división | `app/lib/strength-colors.ts` (DESIGN.md §1.6) |
| Mapa de 9 grupos y estado "sin perfil" | `app/components/home/MuscleAnatomy.tsx` (DESIGN.md §10.3) |
| "kg c/u" con mancuernas en el registro | `loadUnit` en `app/lib/day-workout.ts` |

Correcciones de la revisión previa a implementar (cambian cómo, no qué):
- **Piernas no se migró en la base.** Cuádriceps, Isquios y Glúteos existen solo en el nivel de fuerza, atados a los ejercicios de medición. El catálogo sigue con `muscle_group = 'Piernas'` (gemelos y abducción sin tocar). La figura mapea cada subgrupo a su músculo (`toLibraryMuscles`).
- **Curvas de edad medidas en las 40 tablas "By Age"** (20 ejercicios × 2 sexos): los levantamientos comparten una curva (±0,02); la plancha tiene la suya (sin caída hasta los 50, 0,85 a los 60). Ver `LIFT_AGE_CURVE` y `PLANK_AGE_CURVE`.
- **×2 solo explícito por ejercicio** ("Extensión de tríceps en polea unilateral"). Las tablas de elevación lateral en polea y de patada de glúteo ya son por lado.
- **Sin rutina activa no hay mapa** (el home solo muestra "Tus músculos" con rutina activa), así que la regla 3 de §11 no se implementó.
- Peso corporal fuera de tabla: se usa la fila del extremo (hombres 50–140 kg, mujeres 40–120 kg).
- "Press banca inclinado" tenía el GIF de barra con equipamiento Mancuernas: se cambió al GIF con mancuernas (la tabla es por mancuerna).
- "Patada de gluteo en polea" creada en el catálogo (`supabase/migrations/20260930_cable_glute_kickback.sql`), sin sumarla a rutinas.

## 0. Estado anterior en código (reemplazado el 2026-09-30)

- Cálculo: `listMuscleStrengthSummaries` en `app/lib/workout-tracking.ts` (constantes `STRENGTH_GROUPS`, `PRIMARY_STRENGTH_EXERCISES`, `STRENGTH_THRESHOLDS`, `resolveStrengthRange`).
- Ventana: mejor serie de los últimos 180 días. Prioriza el ejercicio principal del grupo; si no hay, el mejor e1RM de cualquier ejercicio del grupo.
- e1RM: Epley `kg × (1 + reps/30)`, solo `kind = reps`, 1–12 reps (`estimateE1rm` en `app/lib/workout-progression.ts`).
- Umbrales actuales, en kg absolutos y sin sexo ni peso corporal (Base / Fuerte / Avanzado / Elite):

| Grupo | Umbrales |
|---|---|
| Pecho | 20 / 50 / 80 / 110 |
| Espalda | 20 / 45 / 75 / 100 |
| Piernas | 30 / 70 / 110 / 150 |
| Hombros | 15 / 35 / 55 / 75 |
| Bíceps | 10 / 25 / 40 / 55 |
| Tríceps | 10 / 25 / 40 / 60 |
| Core | 10 / 25 / 40 / 60 |

- Bug: un e1RM por debajo de Base devuelve `sin_datos` aunque existan registros.
- Colores y labels: `app/lib/strength-colors.ts` (DESIGN.md §1.6). UI: `app/components/home/MuscleAnatomy.tsx`.
- Datos disponibles: `nutrition_profiles` tiene `gender` (`male`/`female`), `age` (número fijo) y `weight_kg`. No hace falta tocar la DB para una escala relativa.

## 1. Fuentes y metodología

| Fuente | Método | Límites |
|---|---|---|
| StrengthLevel | Marcas cargadas por usuarios (~48 M levantamientos). Niveles = percentiles 5/20/50/80/95 (Principiante/Novato/Intermedio/Avanzado/Élite). Ajusta por sexo, peso corporal y edad. | Datos autodeclarados, de gente que entrena, pocas mujeres. Sus ratios resumidos están redondeados y no coinciden con sus tablas en kg → **usar las tablas en kg**. |
| ExRx (Kilgore) | Niveles por años de entrenamiento: Untrained → Elite. Declara "~70 años de datos, sin regresión". | Datos viejos y cerrados, solo 18–39 años y 4 ejercicios (banca, sentadilla, peso muerto, press militar). |
| Symmetric Strength | Total de powerlifting normalizado con Wilks → score. Cada ejercicio es un % fijo del total. Edad con McCulloch (>40) y Foster (<23). | Base de competidores; los ratios entre ejercicios son constantes del autor. |
| Cooper Institute 2013 | Población general (n=7.180), percentiles por década y sexo. | Solo banca, medida en máquina. La tabla de prensa de piernas no se consiguió. |
| van den Hoek 2024 | 810k marcas de powerlifting con control antidopaje, por edad y sexo. | Solo competidores. |

**Dos poblaciones de referencia distintas:** Cooper es población general; StrengthLevel y el powerlifting son gente entrenada, y su "Intermedio" queda por encima del P75 de Cooper. No mezclarlas.

## 2. Ratios 1RM ÷ peso corporal (StrengthLevel)

Un ratio es "veces tu peso corporal" (1,25 = 1,25 × peso). Orden: Principiante / Novato / Intermedio / Avanzado / Élite. En ejercicios con mancuernas el peso es por mancuerna.

| Grupo | Ejercicio | Hombre | Mujer |
|---|---|---|---|
| Pecho | Press banca | 0,50 / 1,00 / 1,25 / 1,50 / 2,00 | 0,30 / 0,50 / 0,75 / 1,10 / 1,45 |
| | Banca con mancuernas | 0,20 / 0,35 / 0,50 / 0,70 / 0,90 | 0,10 / 0,20 / 0,30 / 0,45 / 0,60 |
| | Press inclinado | 0,50 / 0,75 / 1,00 / 1,50 / 1,75 | 0,25 / 0,40 / 0,65 / 0,95 / 1,25 |
| | Press de pecho en máquina (`chest-press`) | 0,50 / 0,75 / 1,00 / 1,50 / 2,00 | 0,15 / 0,35 / 0,55 / 0,85 / 1,20 |
| | Inclinado con mancuernas | 0,25 / 0,35 / 0,50 / 0,65 / 0,85 | 0,10 / 0,20 / 0,30 / 0,45 / 0,55 |
| Espalda | Remo con barra | 0,50 / 0,75 / 1,00 / 1,50 / 1,75 | 0,30 / 0,45 / 0,70 / 0,95 / 1,25 |
| | Jalón al pecho | 0,50 / 0,75 / 1,00 / 1,50 / 1,75 | 0,35 / 0,50 / 0,75 / 0,95 / 1,25 |
| | Remo en polea | 0,50 / 0,75 / 1,00 / 1,50 / 1,75 | 0,35 / 0,50 / 0,75 / 1,00 / 1,30 |
| | Dominadas (reps) | <1 / 7 / 13 / 21 / 30 | <1 / <1 / 6 / 12 / 19 |
| Piernas | Sentadilla | 0,75 / 1,25 / 1,75 / 2,25 / 2,75 | 0,50 / 0,75 / 1,25 / 1,75 / 2,25 |
| | Peso muerto | 1,00 / 1,50 / 2,00 / 2,50 / 3,25 | 0,75 / 1,00 / 1,50 / 2,00 / 2,50 |
| | Prensa | 1,25 / 2,00 / 2,75 / 4,00 / 5,25 | 0,75 / 1,50 / 2,25 / 3,25 / 4,50 |
| | Extensión de cuádriceps | 0,50 / 1,00 / 1,25 / 1,75 / 2,50 | 0,25 / 0,50 / 1,00 / 1,25 / 1,75 |
| | Sentadilla frontal | 0,75 / 1,00 / 1,25 / 1,75 / 2,25 | 0,50 / 0,75 / 1,00 / 1,25 / 1,50 |
| | Peso muerto rumano | 0,75 / 1,00 / 1,50 / 2,00 / 2,75 | 0,50 / 0,75 / 1,00 / 1,50 / 2,00 |
| Hombros | Press militar | 0,40 / 0,55 / 0,80 / 1,05 / 1,30 | 0,25 / 0,35 / 0,50 / 0,70 / 0,90 |
| | Press con mancuernas | 0,15 / 0,25 / 0,40 / 0,55 / 0,70 | 0,10 / 0,15 / 0,25 / 0,35 / 0,45 |
| | Elevación lateral | 0,05 / 0,10 / 0,20 / 0,30 / 0,45 | 0,05 / 0,10 / 0,15 / 0,20 / 0,30 |
| | Elevación lateral en polea (`cable-lateral-raise`) | 0,05 / 0,10 / 0,20 / 0,35 / 0,50 | 0,05 / 0,10 / 0,15 / 0,25 / 0,40 |
| Bíceps | Curl con barra | 0,25 / 0,40 / 0,60 / 0,80 / 1,05 | 0,10 / 0,25 / 0,40 / 0,55 / 0,75 |
| | Curl con mancuernas | 0,10 / 0,15 / 0,30 / 0,40 / 0,55 | 0,05 / 0,10 / 0,20 / 0,30 / 0,40 |
| | Curl martillo | 0,10 / 0,20 / 0,30 / 0,40 / 0,55 | 0,10 / 0,15 / 0,20 / 0,25 / 0,35 |
| Tríceps | Banca agarre cerrado | 0,50 / 0,75 / 1,25 / 1,50 / 2,00 | 0,30 / 0,50 / 0,75 / 1,05 / 1,35 |
| | Rompecráneos | 0,20 / 0,35 / 0,55 / 0,75 / 1,00 | 0,10 / 0,20 / 0,30 / 0,50 / 0,65 |
| | Extensión en polea | 0,25 / 0,45 / 0,70 / 1,05 / 1,40 | 0,15 / 0,25 / 0,45 / 0,70 / 0,95 |
| | Fondos (reps) | 3 / 10 / 20 / 31 / 43 | <1 / 1 / 9 / 18 / 29 |
| Core | Crunch en polea | 0,25 / 0,50 / 0,75 / 1,25 / 1,75 | 0,25 / 0,50 / 0,75 / 1,25 / 1,50 |
| | Plancha (seg) | 11 / 38 / 75 / 118 / 166 | 13 / 33 / 62 / 95 / 131 |
| | Elevación de piernas colgado (reps) | <1 / 8 / 17 / 28 / 39 | <1 / 6 / 14 / 23 / 33 |
| | Sit-ups (reps) | 5 / 25 / 54 / 90 / 133 | <1 / 15 / 41 / 76 / 117 |

**El ratio no es lineal con el peso corporal.** StrengthLevel, en kg, Intermedio:

| Ejercicio | Hombre 60 / 80 / 100 kg | Mujer 50 / 60 / 70 kg |
|---|---|---|
| Banca | 72 / 98 / 120 | 40 / 47 / 53 |
| Sentadilla | 98 / 132 / 163 | 63 / 72 / 80 |
| Peso muerto | 117 / 155 / 188 | 76 / 86 / 95 |
| Curl con barra | 36 / 46 / 55 | 20 / 23 / 26 |

ExRx muestra lo mismo: en banca, el Élite masculino vale 1,96× a 60 kg y 1,73× a 100 kg (calc.).

## 3. Tabla de trabajo: kg de 1RM por grupo, sexo y edad

> **Reemplazada.** Usa los ejercicios principales anteriores (remo con barra, press cerrado, crunch en polea) y factores de edad por década aproximados. Los ejercicios vigentes están en §9, §11 y §12, y el cálculo real en `app/lib/strength-standards.ts`.

Supuestos:
- Ejercicio índice = el principal actual de cada grupo.
- Hombre de referencia 80 kg; mujer de referencia 60 kg (tablas en kg de StrengthLevel).
- 18–39 = valores de StrengthLevel, tomados como pico de fuerza (coinciden con su tabla por edad: banca H Intermedio 98 vs 96 a los 25–40).
- Factor de edad (calc., StrengthLevel ≈ inverso de McCulloch): 18–39 ×1,00 · 40–49 ×0,95 · 50–59 ×0,82 · 60–69 ×0,68 · 70+ ×0,61.
- Redondeo a 2,5 kg.
- Core: kg calculados desde los ratios (StrengthLevel no publica kg para crunch en polea).
- Base en kg (18–39):

| Ejercicio | Hombre 80 kg | Mujer 60 kg |
|---|---|---|
| Banca | 56/75/98/124/151 | 19/31/47/66/88 |
| Remo | 48/66/88/114/141 | 18/29/43/59/78 |
| Sentadilla | 75/101/132/168/206 | 32/49/72/99/129 |
| Press militar | 35/47/63/80/98 | 15/22/31/42/54 |
| Curl | 22/33/46/63/80 | 8/14/23/34/47 |
| Banca agarre cerrado | 55/72/93/116/140 | 20/31/46/63/82 |

Con peso corporal distinto, estos valores cambian: una implementación real debería interpolar por el peso del usuario.

### Pecho: press banca
| Sexo | Edad | Principiante | Novato | Intermedio | Avanzado | Élite |
|---|---|---|---|---|---|---|
| H (80 kg) | 18–39 | 55 | 75 | 97,5 | 125 | 150 |
| H (80 kg) | 40–49 | 52,5 | 72,5 | 92,5 | 117,5 | 142,5 |
| H (80 kg) | 50–59 | 45 | 62,5 | 80 | 102,5 | 125 |
| H (80 kg) | 60–69 | 37,5 | 50 | 67,5 | 85 | 102,5 |
| H (80 kg) | 70+ | 35 | 45 | 60 | 75 | 92,5 |
| M (60 kg) | 18–39 | 20 | 30 | 47,5 | 65 | 87,5 |
| M (60 kg) | 40–49 | 17,5 | 30 | 45 | 62,5 | 82,5 |
| M (60 kg) | 50–59 | 15 | 25 | 37,5 | 55 | 72,5 |
| M (60 kg) | 60–69 | 12,5 | 20 | 32,5 | 45 | 60 |
| M (60 kg) | 70+ | 12,5 | 20 | 27,5 | 40 | 52,5 |

### Espalda: remo con barra
| Sexo | Edad | Principiante | Novato | Intermedio | Avanzado | Élite |
|---|---|---|---|---|---|---|
| H (80 kg) | 18–39 | 47,5 | 65 | 87,5 | 115 | 140 |
| H (80 kg) | 40–49 | 45 | 62,5 | 82,5 | 107,5 | 135 |
| H (80 kg) | 50–59 | 40 | 55 | 72,5 | 92,5 | 115 |
| H (80 kg) | 60–69 | 32,5 | 45 | 60 | 77,5 | 95 |
| H (80 kg) | 70+ | 30 | 40 | 52,5 | 70 | 85 |
| M (60 kg) | 18–39 | 17,5 | 30 | 42,5 | 60 | 77,5 |
| M (60 kg) | 40–49 | 17,5 | 27,5 | 40 | 55 | 75 |
| M (60 kg) | 50–59 | 15 | 25 | 35 | 47,5 | 65 |
| M (60 kg) | 60–69 | 12,5 | 20 | 30 | 40 | 52,5 |
| M (60 kg) | 70+ | 10 | 17,5 | 25 | 35 | 47,5 |

### Piernas: sentadilla
| Sexo | Edad | Principiante | Novato | Intermedio | Avanzado | Élite |
|---|---|---|---|---|---|---|
| H (80 kg) | 18–39 | 75 | 100 | 132,5 | 167,5 | 205 |
| H (80 kg) | 40–49 | 72,5 | 95 | 125 | 160 | 195 |
| H (80 kg) | 50–59 | 62,5 | 82,5 | 107,5 | 137,5 | 170 |
| H (80 kg) | 60–69 | 50 | 67,5 | 90 | 115 | 140 |
| H (80 kg) | 70+ | 45 | 62,5 | 80 | 102,5 | 125 |
| M (60 kg) | 18–39 | 32,5 | 50 | 72,5 | 100 | 130 |
| M (60 kg) | 40–49 | 30 | 47,5 | 67,5 | 95 | 122,5 |
| M (60 kg) | 50–59 | 25 | 40 | 60 | 80 | 105 |
| M (60 kg) | 60–69 | 22,5 | 32,5 | 50 | 67,5 | 87,5 |
| M (60 kg) | 70+ | 20 | 30 | 45 | 60 | 77,5 |

### Hombros: press militar
| Sexo | Edad | Principiante | Novato | Intermedio | Avanzado | Élite |
|---|---|---|---|---|---|---|
| H (80 kg) | 18–39 | 35 | 47,5 | 62,5 | 80 | 97,5 |
| H (80 kg) | 40–49 | 32,5 | 45 | 60 | 75 | 92,5 |
| H (80 kg) | 50–59 | 27,5 | 37,5 | 52,5 | 65 | 80 |
| H (80 kg) | 60–69 | 25 | 32,5 | 42,5 | 55 | 67,5 |
| H (80 kg) | 70+ | 22,5 | 27,5 | 37,5 | 50 | 60 |
| M (60 kg) | 18–39 | 15 | 22,5 | 30 | 42,5 | 55 |
| M (60 kg) | 40–49 | 15 | 20 | 30 | 40 | 52,5 |
| M (60 kg) | 50–59 | 12,5 | 17,5 | 25 | 35 | 45 |
| M (60 kg) | 60–69 | 10 | 15 | 20 | 27,5 | 37,5 |
| M (60 kg) | 70+ | 10 | 12,5 | 20 | 25 | 32,5 |

### Bíceps: curl con barra
| Sexo | Edad | Principiante | Novato | Intermedio | Avanzado | Élite |
|---|---|---|---|---|---|---|
| H (80 kg) | 18–39 | 22,5 | 32,5 | 45 | 62,5 | 80 |
| H (80 kg) | 40–49 | 20 | 32,5 | 42,5 | 60 | 75 |
| H (80 kg) | 50–59 | 17,5 | 27,5 | 37,5 | 52,5 | 65 |
| H (80 kg) | 60–69 | 15 | 22,5 | 32,5 | 42,5 | 55 |
| H (80 kg) | 70+ | 12,5 | 20 | 27,5 | 37,5 | 50 |
| M (60 kg) | 18–39 | 7,5 | 15 | 22,5 | 35 | 47,5 |
| M (60 kg) | 40–49 | 7,5 | 12,5 | 22,5 | 32,5 | 45 |
| M (60 kg) | 50–59 | 7,5 | 12,5 | 20 | 27,5 | 37,5 |
| M (60 kg) | 60–69 | 5 | 10 | 15 | 22,5 | 32,5 |
| M (60 kg) | 70+ | 5 | 7,5 | 15 | 20 | 27,5 |

### Tríceps: press de banca con agarre cerrado
| Sexo | Edad | Principiante | Novato | Intermedio | Avanzado | Élite |
|---|---|---|---|---|---|---|
| H (80 kg) | 18–39 | 55 | 72,5 | 92,5 | 115 | 140 |
| H (80 kg) | 40–49 | 52,5 | 67,5 | 87,5 | 110 | 132,5 |
| H (80 kg) | 50–59 | 45 | 60 | 77,5 | 95 | 115 |
| H (80 kg) | 60–69 | 37,5 | 50 | 62,5 | 80 | 95 |
| H (80 kg) | 70+ | 32,5 | 45 | 57,5 | 70 | 85 |
| M (60 kg) | 18–39 | 20 | 30 | 45 | 62,5 | 82,5 |
| M (60 kg) | 40–49 | 20 | 30 | 42,5 | 60 | 77,5 |
| M (60 kg) | 50–59 | 17,5 | 25 | 37,5 | 52,5 | 67,5 |
| M (60 kg) | 60–69 | 12,5 | 20 | 32,5 | 42,5 | 55 |
| M (60 kg) | 70+ | 12,5 | 20 | 27,5 | 37,5 | 50 |

### Core: crunch en polea
| Sexo | Edad | Principiante | Novato | Intermedio | Avanzado | Élite |
|---|---|---|---|---|---|---|
| H (80 kg) | 18–39 | 20 | 40 | 60 | 100 | 140 |
| H (80 kg) | 40–49 | 20 | 37,5 | 57,5 | 95 | 132,5 |
| H (80 kg) | 50–59 | 17,5 | 32,5 | 50 | 82,5 | 115 |
| H (80 kg) | 60–69 | 12,5 | 27,5 | 40 | 67,5 | 95 |
| H (80 kg) | 70+ | 12,5 | 25 | 37,5 | 60 | 85 |
| M (60 kg) | 18–39 | 15 | 30 | 45 | 75 | 90 |
| M (60 kg) | 40–49 | 15 | 27,5 | 42,5 | 72,5 | 85 |
| M (60 kg) | 50–59 | 12,5 | 25 | 37,5 | 62,5 | 75 |
| M (60 kg) | 60–69 | 10 | 20 | 30 | 50 | 60 |
| M (60 kg) | 70+ | 10 | 17,5 | 27,5 | 45 | 55 |

## 4. Edad

**Cooper Institute:** banca 1RM ÷ peso corporal (P5 / P25 / P50 / P75 / P95), población general, máquina:

| Edad | Hombre | Mujer |
|---|---|---|
| 20–29 | 0,72 / 0,90 / 1,06 / 1,26 / 1,63 | 0,44 / 0,53 / 0,65 / 0,77 / 1,01 |
| 30–39 | 0,65 / 0,81 / 0,93 / 1,08 / 1,35 | 0,39 / 0,49 / 0,57 / 0,65 / 0,82 |
| 40–49 | 0,59 / 0,74 / 0,84 / 0,96 / 1,20 | 0,35 / 0,45 / 0,52 / 0,60 / 0,77 |
| 50–59 | 0,53 / 0,66 / 0,75 / 0,87 / 1,05 | 0,31 / 0,41 / 0,46 / 0,53 / 0,68 |
| 60+ | 0,49 / 0,60 / 0,68 / 0,79 / 0,94 | 0,26 / 0,39 / 0,45 / 0,53 / 0,72 |

Prensa de piernas (ACSM, solo abstract, mujeres mayores): ≤0,99 = P≤50, 1,0–1,31 = P51–89, ≥1,32 = P≥90.

**Coeficientes McCulloch** (WRPF 2022). Marca × coef.; 1/coef. = fuerza esperada (calc.):

| Edad | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80+ |
|---|---|---|---|---|---|---|---|---|---|
| Coeficiente | 1,000 | 1,060 | 1,150 | 1,250 | 1,380 | 1,533 | 1,700 | 1,900 | 2,060 |
| Fuerza esperada | 100% | 94% | 87% | 80% | 72% | 65% | 59% | 53% | 49% |

Hay otra versión atribuida a USAPL (50 = 1,13; 60 = 1,34; 70 = 1,645; 80 = 2,05) que no se pudo verificar: el PDF dio 404.

**StrengthLevel, banca, Intermedio, por edad (kg):**

| Edad | 15 | 20 | 25–40 | 45 | 50 | 55 | 60 | 65 | 70 | 80 | 90 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hombre | 82 | 94 | 96 | 91 | 85 | 79 | 72 | 65 | 59 | 47 | 38 |
| Mujer | 43 | 49 | 51 | 48 | 45 | 41 | 38 | 34 | 31 | 25 | 20 |

El factor es igual para ambos sexos. En menores: ~0,85 a los 15 años y ~0,98 a los 20 (calc.).

**Symmetric Strength:** entre 23 y 40 años no hay ajuste; por encima de 40 usa McCulloch y por debajo de 23 usa Foster (sus valores no se consiguieron).

**van den Hoek 2024** (powerlifters, banca P50, kg/kg):

| Edad | 12–17 | 18–35 | 36–59 | 60–79 | 80+ |
|---|---|---|---|---|---|
| Hombre | 1,24 | 1,56 | 1,51 | 1,23 | 0,93 |
| Mujer | 0,81 | 0,96 | 0,90 | 0,72 | 0,55 |

**Literatura:**
- Lindle 1997 (n=654): la fuerza de cuádriceps cae desde la cuarta década, ~8–10% por década, parecido en ambos sexos.
- Haynes 2020 (57 estudios): la caída isocinética se acelera antes en mujeres (~42 años) que en hombres (~67).
- Keller & Engelhardt 2013: los mayores de 40 tienen entre 16,6% y 40,9% menos fuerza isométrica de rodilla (n=26).
- Janssen 2000 (resonancia): la masa muscular relativa baja desde los 30; la absoluta, desde fines de los 40, más en piernas.

## 5. Sexo

- Miller 1993: las mujeres tienen ~52% de la fuerza masculina en tren superior y ~66% en inferior; la fuerza por área de sección transversal es igual.
- Janssen 2000: la diferencia de masa muscular entre sexos es de 40% en tren superior y 33% en inferior.
- Consecuencia: un único factor para mujeres no sirve. Hacen falta tablas por sexo y por ejercicio.

## 6. Equivalencias entre ejercicios

| Relación | Valor | Fuente |
|---|---|---|
| Press militar / banca | ≈0,65 | Symmetric Strength; StrengthLevel (calc.) 0,64–0,66 |
| Sentadilla / peso muerto | H 0,87 · M 0,84 | Symmetric Strength |
| Banca / peso muerto | H 0,65 · M 0,57 | Symmetric Strength |
| Remo Pendlay / peso muerto | 0,53 | Symmetric Strength |
| Inclinado / plano | 0,82; el plano rinde 21–29% más en estudios | Symmetric Strength; IJERPH 2020; J Hum Kinet 2017 |
| Mancuernas (las dos sumadas) / barra | ~0,72–0,83 | Saeterbakken 2011 (−17%); Smoak 2023 |
| Sentadilla frontal / trasera | 0,80 | Symmetric Strength |
| Dominada / jalón (1RM ÷ peso corporal) | H 1,16 vs 0,93 · M 0,73 vs 0,55 | Johnson 2009 |
| Prensa / sentadilla | H ~1,57× · M ~1,8× | StrengthLevel (calc.); no hay estudio directo |
| Dominada prona / supina | 0,95 | Symmetric Strength |
| Push press / press militar | 1,33 | Symmetric Strength |

## 7. Precisión del e1RM

- Reynolds 2006: en ecuaciones lineales, "no more than 10 repetitions". Con 5RM, Epley es la de menor error; Brzycki y Lander subestiman la prensa.
- Mayhew 2008 (103 mujeres): la estimación es más precisa con menos de 10 reps.
- LeSuer 1997: todas las ecuaciones subestiman el peso muerto.
- DiStasio 2014: Epley y Brzycki tienen ~3 kg de error desde 3–5RM en sentadilla.
- Nuzzo 2024 (269 estudios): el moderador relevante de reps vs %1RM es el ejercicio; sexo, edad y nivel pesan poco. Al 70%: banca ~14 reps, prensa ~19.
- Marzagao 2026 (preprint Fitbod, sin revisión por pares): Epley y compañía fallan más en aislamiento con poca carga.

## 8. Vacíos (no encontrados)

- Tabla completa de prensa de piernas Cooper/ACSM por década.
- Normas de curl-up ACSM/YMCA para adultos y tiempos en segundos de McGill.
- Factores de edad por región del cuerpo.
- Coeficientes Foster (<23 años).
- Estándares de core con carga, fuera del crunch en polea.

## 9. Ejercicios de medición por grupo (selección 2026-09-17)

Criterio: el mínimo de ejercicios que cubre casi todas las rutinas activas del catálogo (11), con carga y con estándar propio de StrengthLevel, para no tener que convertir entre ejercicios. Cobertura medida con SQL sobre `routine_templates` → `routine_days` → `routine_items`.

| Grupo | Ejercicios (nombre en catálogo) | Estándar | Rutinas cubiertas | Principal anterior |
|---|---|---|---|---|
| Pecho | Press banca plano (barra) · Press banca inclinado (mancuernas) · Press en maquina pecho | banca · inclinado con mancuernas · press de pecho en máquina (§9.1) | 9 / 11 | Press banca: 7 |
| Espalda | Jalon al pecho · Remo sentado en polea | jalón · remo en polea | 11 / 11 | Remo con barra: 6 |
| Piernas | Sentadilla trasera · Prensa 45 | sentadilla · prensa | 10 / 10 | Sentadilla: 9 |
| Hombros | Press militar de pie · Press hombros sentado (mancuernas) · Elevaciones laterales en polea | press militar · press con mancuernas · elevación lateral en polea (§9.3) | 11 / 11 | Press militar: 6 |
| Bíceps | Curl barra recta · Curl martillo · Curl alterno mancuernas | curl con barra · curl martillo · curl con mancuernas | 9 / 10 | Curl con barra: 6 |
| Tríceps | Extension triceps polea · Rompecraneos barra z · Extensión de tríceps en polea unilateral (×2) | extensión en polea · rompecráneos | 8 / 8 | Press cerrado: 1 |
| Core | Plancha frontal (solo segundos) | plancha en segundos (§9.2) | 3 / 3 | Crunch en polea: **no existe en el catálogo** |

- Sin cubrir:
  - Pecho: "Full Body Mayores" (solo aperturas en máquina) y "Fullbody mantenimiento 3 dias" (solo flexiones).
  - Bíceps: "Fullbody mantenimiento 3 dias" (solo dominadas supinas).
- Core aparece solo en 3 de 11 rutinas: la mayoría de los usuarios no va a tener medición de core.
- Sumar un tercer ejercicio no mejora la cobertura: probados remo con barra, peso muerto rumano, press Arnold, curl inclinado y extensión sobre la cabeza.
- Registros reales de estos ejercicios: 0 o 1 cada uno. No hay datos para validar.

### 9.1 Press de pecho en máquina (StrengthLevel `chest-press`)

- Muestra: 206k resultados válidos (181k hombres, 25k mujeres). La página no aclara el tipo de máquina.
- 1RM en kg (Principiante / Novato / Intermedio / Avanzado / Élite):

| Sexo y peso corporal | Valores |
|---|---|
| Hombre 60 kg | 27 / 45 / 70 / 100 / 134 |
| Hombre 80 kg | 39 / 61 / 89 / 123 / 160 |
| Hombre 100 kg | 50 / 74 / 105 / 142 / 181 |
| Mujer 50 kg | 9 / 19 / 33 / 50 / 71 |
| Mujer 60 kg | 11 / 21 / 36 / 54 / 75 |
| Mujer 70 kg | 12 / 23 / 38 / 57 / 79 |

- Edad, Intermedio: meseta entre 25 y 40 años (hombre 86 kg, mujer 37 kg); a los 60 años, 64 / 28 kg; a los 80 años, 42 / 18 kg. El factor coincide con el de banca.
- Máquina / banca, cambia con el nivel (calc.): hombre de 80 kg 0,70 → 0,91 → 1,06 · mujer de 60 kg 0,58 → 0,77 → 0,85. **No convertir con un factor fijo: usar la tabla propia.**
- Estudios:
  - Langford 2007: el 3RM en máquina fue +8% frente a barra; las ganancias se transfieren (r 0,92–0,97).
  - Cotterman 2005: en banca, el peso libre supera a la Smith.
  - No hay cifras publicadas de variación entre marcas o palancas: es un error desconocido, probablemente grande.

### 9.2 Plancha

- StrengthLevel (6.214 resultados válidos) en segundos: hombre 11 / 38 / 75 / 118 / 166 · mujer 13 / 33 / 62 / 95 / 131. Tiene tablas por peso corporal y por edad.
- Strand 2014 (471 universitarios), percentiles 10 / 20 / 50 / 80 / 90: hombres 62 / 79 / 110 / 157 / 201 s · mujeres 35 / 48 / 72 / 108 / 142 s.
- Chase 2014 (102 deportistas), percentiles 25 / 50 / 75: hombres 84 / 110 / 135 s · mujeres 73,5 / 95 / 122,5 s.
- Bohannon 2018: media de 145 ± 71 s; los de 20–35 años aguantan más que los de 60–79 (p = 0,003); confiabilidad test-retest (ICC) 0,915.
- **Decisión (2026-09-17): Core se mide solo en segundos.** El peso agregado queda descartado porque no hay un estándar validado.

### 9.3 Elevación lateral en polea (StrengthLevel `cable-lateral-raise`)

- Muestra: 32.745 resultados válidos (31.071 hombres, **1.674 mujeres**), del 2019-10 al 2026-03. La página no aclara si el peso es por brazo.
- 1RM en kg (Principiante / Novato / Intermedio / Avanzado / Élite):

| Sexo y peso corporal | Valores |
|---|---|
| Hombre 60 kg | 2 / 6 / 13 / 22 / 34 |
| Hombre 80 kg | 3 / 8 / 16 / 27 / 39 |
| Hombre 100 kg | 4 / 10 / 19 / 30 / 44 |
| Mujer 50 kg | 2 / 5 / 9 / 16 / 23 |
| Mujer 60 kg | 2 / 5 / 10 / 17 / 25 |
| Mujer 70 kg | 2 / 6 / 11 / 18 / 26 |

- Por edad, sin fijar el peso corporal:

| Edad | Hombre | Mujer |
|---|---|---|
| 25–40 | 3 / 8 / 15 / 26 / 39 | 2 / 6 / 11 / 18 / 26 |
| 50 | 2 / 7 / 14 / 23 / 34 | 2 / 5 / 9 / 16 / 23 |
| 60 | 2 / 6 / 11 / 19 / 29 | 2 / 4 / 8 / 13 / 19 |
| 70 | 2 / 5 / 9 / 16 / 23 | 1 / 3 / 7 / 11 / 16 |
| 80 | 1 / 4 / 8 / 13 / 19 | 1 / 3 / 5 / 9 / 12 |

- Límites:
  - Es un ejercicio de aislamiento con poca carga, donde el e1RM es el menos confiable (Marzagao 2026).
  - La relación de poleas cambia según la máquina.
  - Hay pocas mujeres en la muestra.
  - Los kg son chicos: con saltos de 2,5 kg en la polea, la diferencia entre niveles bajos es de 1 o 2 placas.

## 10. Escala de niveles (decidido 2026-09-17)

- Referencia: gente que entrena (percentiles de StrengthLevel). Descartado Cooper (población general): solo existe para banca.
- 13 escalones: 4 niveles con 3 divisiones + Élite sin divisiones, más "sin datos".

| Nivel | Divisiones | Percentil |
|---|---|---|
| Sin datos | — | sin registros válidos |
| Principiante | 1 · 2 · 3 | hasta P20 |
| Novato | 1 · 2 · 3 | P20–P50 |
| Intermedio | 1 · 2 · 3 | P50–P80 |
| Avanzado | 1 · 2 · 3 | P80–P95 |
| Élite | — | ≥ P95 |

- Divisiones: el tramo en kg entre un corte y el siguiente se parte en 3 partes iguales.
- Principiante 1 incluye todo lo que esté por debajo del corte de Principiante (P5). Con registros válidos nunca se muestra "sin datos": eso corrige el bug actual.
- Con registros por debajo del corte no se muestra "sin datos"; "sin datos" queda solo para la ausencia de registros.
- Pendiente de diseño: hoy hay 5 tokens de color (`--strength-0`..`4`, DESIGN.md §1.6). La idea es un color por nivel y la división como número o intensidad, no 13 colores.
- Riesgo conocido: en ejercicios de aislamiento una división puede ser menos de 3 kg (elevación lateral en polea), por debajo del error del e1RM. El escalón puede moverse por una repetición.

## 11. Elección del ejercicio cuando hay varios registrados (decidido 2026-09-30)

Sin promedios: manda el ejercicio de mayor prioridad que tenga registro válido.

| Grupo | 1º | 2º | 3º |
|---|---|---|---|
| Pecho | Press banca plano (barra) | Press banca inclinado (mancuernas) | Press en maquina pecho |
| Espalda | Jalon al pecho | Remo sentado en polea | — |
| Piernas | *Reemplazado por Cuádriceps / Isquios / Glúteos, §12* | | |
| Hombros | Press militar de pie | Press hombros sentado (mancuernas) | Elevaciones laterales en polea |
| Bíceps | Curl barra recta | Curl alterno mancuernas | Curl martillo |
| Tríceps | Extension triceps polea | Rompecraneos barra z | Extensión de tríceps en polea unilateral (peso ×2, tabla `tricep-pushdown`) |
| Core | Plancha frontal | — | — |

Criterio del orden: peso libre con barra primero (carga comparable entre gimnasios, muestra grande), después mancuernas, después máquina o polea, y último aislamiento. **Excepción decidida por el usuario: en Tríceps va primero la extensión en polea**, porque está en 7 de 11 rutinas contra 4 del rompecráneos, y así el nivel se actualiza más seguido.

Reglas:
1. Solo cuentan los ejercicios presentes en la **rutina activa** del usuario (`saved_routines.is_active`). Un registro de un ejercicio que ya no está en su rutina activa se ignora.
2. El registro puede venir de cualquier sesión, incluso de otra rutina o de una sesión suelta: lo que importa es el ejercicio, no dónde se hizo.
3. ~~Sin rutina activa, se usa la prioridad global sobre cualquier registro de la ventana de 180 días.~~ No se implementó: sin rutina activa el home no muestra "Tus músculos".
4. Dentro del ejercicio elegido se usa su mejor e1RM de la ventana.
5. Si ningún ejercicio de la lista del grupo tiene registro, el grupo queda en "sin datos".

Riesgo conocido: si el ejercicio de mayor prioridad se hizo una sola vez hace meses, el nivel queda desactualizado hasta que salga de la ventana de 180 días. Se aceptó a cambio de que el resultado sea predecible.

## 12. Piernas se parte en Cuádriceps, Isquios y Glúteos (2026-09-30)

Pedido del usuario. Todos los ejercicios necesarios tienen tabla propia en StrengthLevel: **no hace falta convertir entre ejercicios**.

### 12.1 Prioridad

| Subgrupo | 1º | 2º | 3º |
|---|---|---|---|
| Cuádriceps | Sentadilla trasera | Extension de cuadriceps | — |
| Isquios | Peso muerto rumano | Curl femoral acostado (tabla `lying-leg-curl`) | Curl de piernas = curl SENTADO (tabla `seated-leg-curl`) |
| Glúteos | Hip thrust | Patada de glúteo en polea (a crear) | — |

### 12.2 Estándares nuevos (StrengthLevel, 1RM en kg, Principiante → Élite)

| Ejercicio | Slug | Válidos (H/M) | Hombre 80 kg | Mujer 60 kg |
|---|---|---|---|---|
| Extensión de cuádriceps | `leg-extension` | 372.660 (298k/74k) | 48 / 72 / 103 / 140 / 180 | 22 / 38 / 59 / 86 / 115 |
| Curl femoral acostado | `lying-leg-curl` | 76.852 (63k/14k) | 30 / 46 / 66 / 90 / 116 | 15 / 24 / 36 / 51 / 67 |
| Curl femoral sentado | `seated-leg-curl` | 125.544 (98k/28k) | 39 / 58 / 83 / 112 / 144 | 19 / 31 / 47 / 67 / 88 |
| Peso muerto rumano | `romanian-deadlift` | 359.740 (264k/95k) | 65 / 92 / 125 / 163 / 203 | 31 / 47 / 67 / 90 / 116 |
| Hip thrust | `hip-thrust` | 383.413 (159k/**224k mujeres**) | 56 / 96 / 149 / 213 / 285 | 35 / 63 / 100 / 147 / 199 |
| Patada de glúteo en polea | `cable-kickback` | **7.851** (2,4k/5,4k) | 7 / 23 / 49 / 86 / 131 | 6 / 14 / 27 / 45 / 65 |
| Sentadilla trasera | `squat` | 7.039.938 | 75 / 101 / 132 / 168 / 206 | 32 / 49 / 72 / 99 / 129 |
| Peso muerto convencional | `deadlift` | 6.393.746 | 89 / 119 / 155 / 196 / 239 | 40 / 60 / 86 / 116 / 149 |

- El factor de edad es el mismo en las 8 páginas (calc.): 25–40 ×1,00 · 50 ≈0,89 · 60 ≈0,75 · 70 ≈0,61. Coincide con §4.
- `cable-kickback` es el único con muestra chica y la página no aclara si la carga es por pierna ni si depende de la torre. Élite masculino de 131 kg es implausible como carga real por pierna: **no usarlo como referencia dura**.
- `glute-kickback` es otro estándar, en repeticiones (media 35 en hombres, 31 en mujeres), no en kg.
- `barbell-hip-thrust` y `leg-curl` no son páginas propias: sirven hip thrust y curl sentado.

### 12.3 Cobertura sobre las 11 rutinas activas

| Subgrupo | Rutinas que lo entrenan | Cubiertas | Sin cubrir |
|---|---|---|---|
| Cuádriceps | 11 | 10 | Fullbody mantenimiento 3 dias (prensa, goblet, step up) |
| Isquios | 9 | 9 | — |
| Glúteos | 6 | 6 | — (las otras 5 rutinas no entrenan glúteos) |

Medido sobre el catálogo ya deduplicado (68 ejercicios, 2026-09-30). Isquios pasó de 10 a 9 rutinas porque el peso muerto convencional dejó de contar.

### 12.4 Decisiones tomadas (2026-09-30)

- **Peso muerto:** solo el rumano cuenta para Isquios. El convencional **no** cuenta, y queda como Espalda. "Fullbody 3 dias" se queda sin nivel de isquios.
- **Gemelos y abductores:** se registran pero no tienen nivel ni se pintan en el mapa. No se crean grupos nuevos para ellos.
- **Patada de glúteo en polea:** se crea en el catálogo y va como segunda prioridad de Glúteos, así que su estándar flojo solo decide el nivel cuando no hay hip thrust.
- **Duplicados (resueltos por otra sesión, aplicado en producción 2026-09-30):**
  - "Curl de piernas" = curl femoral **sentado** → tabla `seated-leg-curl`.
  - "Curl femoral acostado" = curl **acostado** → tabla `lying-leg-curl`.
  - "Extensiones de piernas" se fusionó en "Extension de cuadriceps".
  - "Press en máquina" era press de pecho mal clasificado en Piernas: se fusionó en "Press en maquina pecho".
  - Migración `supabase/migrations/20260930_exercise_catalog_dedupe.sql`; detalle en `docs/DATABASE.md`.

### 12.5 Problemas del catálogo que hay que resolver

1. **"Patada de glúteo en polea" hay que crearla** y agregarla a alguna rutina, si no Glúteos mide solo con hip thrust.
2. **Sin subgrupo asignado:** Prensa 45 (9 rutinas), Sentadilla frontal (5), Zancadas (3), Step up (1), Goblet (1).

### 12.6 Impacto técnico

- ~~`exercises.muscle_group` tiene un check con 7 valores; partirlo es una migración.~~ No hizo falta: los subgrupos viven solo en el nivel de fuerza (ver Implementación).
- La figura del cuerpo (`app/components/shared/BodyMuscleFigure.tsx`) **ya tiene** `quadriceps`, `hamstring` y `gluteal` separados, más `calves`, `adductor` y `abductors`. No hay que dibujar nada nuevo; sí hay que sumar los callouts en `MuscleAnatomy.tsx` (hoy Piernas apunta a `quadriceps` de frente y a `hamstring` de espalda).
- Glúteos solo se ve de espaldas: la vista trasera pasaría de 4 a 5 etiquetas.

## 13. Perfil, edad y color (decidido 2026-09-30)

- **Sin perfil (sin sexo o sin peso): no se muestra nivel.** El mapa queda neutro con un aviso para completar el perfil. Hoy 2 de 7 usuarios están así. Sin esos datos no hay tabla que aplicar.
- **Edad:** factor ×1 hasta los 39 y después el inverso de McCulloch (50 ≈×0,89 · 60 ≈×0,75 · 70 ≈×0,61, §4). Sin trato especial para menores de 18: hoy el mínimo es 18.
- **Campo edad:** se usa `nutrition_profiles.age` tal como está, aunque no avance con el tiempo. El ajuste cambia por década, así que el error es chico. No se migra a fecha de nacimiento.
- **Color:** un color por nivel con **3 intensidades** según la división. Hoy hay 5 tokens (`--strength-0`..`4`); harían falta 5 niveles + "sin datos" y 3 pasos de intensidad por nivel. Verificar contraste en el mapa a ancho de teléfono antes de cerrarlo (DESIGN.md §1.6).

## 14. Cálculo (decidido 2026-09-30)

- **Umbrales:** se guardan las tablas en kg de StrengthLevel por peso corporal y se **interpola** por el peso real del usuario. No se usan ratios fijos: el ratio no escala lineal con el peso (§2).
- **e1RM: se mantiene el tope actual de 12 reps.** La evidencia recomienda 10 (§7), así que las series de 11 y 12 arrastran más error; se acepta a cambio de no perder registros.
- **Ejercicios fuera de la lista de §9 y §12: no cuentan.** Nada de conversiones ni de tablas de último recurso. Si ningún ejercicio de la lista tiene registro, el grupo queda en "sin datos".
- **Rutinas sin medición: se dejan así.** Son rutinas livianas a propósito: Full Body Mayores y Fullbody mantenimiento quedan con algún grupo en "sin datos".

- **Ejercicios unilaterales (decidido 2026-09-30):** si el ejercicio es la versión de un brazo o una pierna de uno bilateral, el peso registrado se multiplica **×2** y se compara contra la tabla del ejercicio bilateral.
  - Caso en el catálogo: "Extensión de tríceps en polea unilateral" (1 rutina, 5 registros) → ×2 contra `tricep-pushdown`. Entra en Tríceps como última prioridad.
  - El ×2 se declara por ejercicio, nunca por patrón de nombre: "Elevaciones laterales en polea" y "Patada de gluteo en polea" son unilaterales pero sus tablas ya son por lado.
  - Los registros reales confirman la convención por mancuerna (curl alterno: 17,5 kg). El registro muestra "kg c/u" en ejercicios con mancuernas.
  - **No se duplica el peso de los ejercicios con mancuernas**: StrengthLevel ya los mide por mancuerna ("Curl alterno mancuernas", "Press hombros sentado", "Press banca inclinado"). Duplicarlos daría el doble del nivel real.
  - Límite conocido: la suma de los dos lados suele superar al levantamiento bilateral (déficit bilateral), así que ×2 tiende a **sobreestimar** un poco. No se encontró un factor publicado por ejercicio, así que se usa ×2 tal cual.
  - Otros unilaterales del catálogo que hoy no miden por no estar en la lista: "Remo con mancuerna" (serrucho), "Curl concentrado", "Patada triceps", "Zancadas caminando", "Step up con mancuernas".

Con esto el diseño está cerrado y listo para implementar. No hay decisiones abiertas.

## Fuentes

- StrengthLevel: https://strengthlevel.com/strength-standards/ (páginas por ejercicio `/strength-standards/<slug>/kg`: bench-press, dumbbell-bench-press, incline-bench-press, incline-dumbbell-bench-press, bent-over-row, lat-pulldown, seated-cable-row, pull-ups, squat, front-squat, leg-press, leg-extension, deadlift, romanian-deadlift, military-press, dumbbell-shoulder-press, dumbbell-lateral-raise, barbell-curl, dumbbell-curl, hammer-curl, close-grip-bench-press, lying-tricep-extension, tricep-pushdown, dips, cable-crunch, sit-ups, hanging-leg-raise, plank)
- ExRx: https://exrx.net/Testing/WeightLifting/StrengthStandards (BenchStandardsKg, SquatStandardsKg, DeadliftStandardsKg, PressStandardsKg)
- Symmetric Strength: https://symmetricstrength.com/about · https://symmetricstrength.com/static/res/libs.js
- Cooper Institute 2013 (vía FitnessNorms): https://fitnessnorms.com/strength/cooper-bench-press/
- van den Hoek 2024, J Sci Med Sport 27:734–742: https://fitnessnorms.com/strength/bench-press/ · https://pubmed.ncbi.nlm.nih.gov/39060209/
- McCulloch (WRPF): https://wrpf-latvia.net/downloads/McCulloch%20Coefficients%20WRPF.pdf
- ACSM leg press (abstract): https://www.sciencedirect.com/science/article/abs/pii/S0531556522002649
- Lindle 1997, J Appl Physiol 83:1581–7: https://pubmed.ncbi.nlm.nih.gov/9375323/
- Haynes 2020, Appl Physiol Nutr Metab: https://cdnsciencepub.com/doi/10.1139/apnm-2020-0081
- Keller & Engelhardt 2013 (PMID 24596700) · Janssen 2000 (PMID 10904038) · Miller 1993 (PMID 8477683)
- LeSuer 1997, JSCR 11(4):211–213: https://journals.lww.com/nsca-jscr/abstract/1997/11000/the_accuracy_of_prediction_equations_for.1.aspx
- Reynolds 2006: https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf
- Mayhew 2008: https://www.unm.edu/~rrobergs/478PredictionAccuracy.pdf
- DiStasio 2014: https://opensiuc.lib.siu.edu/gs_rp/573/
- Nuzzo 2024, Sports Med: https://link.springer.com/article/10.1007/s40279-023-01937-7
- Marzagao 2026 (preprint): https://arxiv.org/abs/2603.17495
- Saeterbakken 2011: https://pubmed.ncbi.nlm.nih.gov/21225489/
- Johnson 2009: https://pubmed.ncbi.nlm.nih.gov/19387371/
- Inclinado vs plano: https://www.strengthlog.com/incline-bench-press-vs-flat-bench-press/
- McGill (ACE): https://www.acefitness.org/cmes-resources/pdfs/02-10-CMES-McGillsTorsoEnduracneTest.pdf · core en inactivos: https://pmc.ncbi.nlm.nih.gov/articles/PMC6930174/
