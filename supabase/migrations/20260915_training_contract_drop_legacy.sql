-- Contract 2/2 del registro por series: se van las columnas de texto del registro anterior.
-- Aplicar solo con el código deployado que ya no las lee ni escribe (refactor(entreno): contract del registro por series).

alter table public.workout_session_items
  drop column performed_reps,
  drop column used_weight,
  drop column is_completed;
