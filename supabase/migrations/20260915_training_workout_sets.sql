-- F1 · Series por posición con versión (contrato v1 en app/lib/workout-sync-contract.ts).
-- Expand: el código deployado sigue escribiendo performed_reps / used_weight / is_completed y deja `sets` en null.

alter table public.workout_session_items
  add column sets jsonb,
  add column kind text,
  add column target_snapshot text,
  add column sets_rev bigint not null default 0,
  add constraint workout_session_items_kind_check
    check (kind is null or kind in ('reps', 'bodyweight', 'time')),
  add constraint workout_session_items_sets_check
    check (
      sets is null
      or (
        jsonb_typeof(sets) = 'array'
        and jsonb_array_length(sets) <= 20
        and not jsonb_path_exists(sets, '$[*] ? (@.kg < 0 || @.reps < 0 || @.secs < 0)')
      )
    );

comment on column public.workout_session_items.sets is
  'Series por posición [{kg, reps, secs, done}] con null en los huecos. Null = fila del código anterior (usar performed_reps/used_weight).';
comment on column public.workout_session_items.kind is
  'reps | bodyweight (kg = lastre) | time (secs). Snapshot al registrar: no depende de la plantilla viva.';
comment on column public.workout_session_items.target_snapshot is
  'Objetivo prescripto al registrar (routine_items.repetitions), p. ej. 8-10 o 30-45s.';
comment on column public.workout_session_items.sets_rev is
  'Versión monótona del cliente: una escritura con rev menor o igual no pisa la guardada.';
