-- Contract 1/2 del registro por series: `sets` y `kind` obligatorios.
-- Compatible con el código deployado, que siempre los escribe. Las filas del registro anterior no
-- tienen reps ni kg cargados: quedan con `sets = []` y `kind` según el ejercicio.
-- `exercise_id` sigue nullable: NOT NULL se valida antes de resolver ON CONFLICT y rompería el upsert
-- del esqueleto de un ejercicio ya registrado cuando el admin borra su fila de la rutina.

do $$
begin
  if exists (
    select 1
    from public.workout_session_items
    where sets is null
      and (nullif(trim(performed_reps), '') is not null or nullif(trim(used_weight), '') is not null)
  ) then
    raise exception 'Hay filas del registro anterior con reps o kg en texto: migrarlas antes de este contract.';
  end if;
end;
$$;

update public.workout_session_items as wsi
set
  sets = coalesce(wsi.sets, '[]'::jsonb),
  kind = coalesce(
    wsi.kind,
    case
      -- Misma regla que resolveExerciseKind: objetivo en tiempo → time; peso corporal → bodyweight.
      when exists (
        select 1
        from public.routine_items as ri
        where ri.id = wsi.routine_item_id
          and ri.repetitions ~* '^\s*\d+(\s*-\s*\d+)?\s*(seg|s|min|m)\s*(c/lado)?\s*$'
      ) then 'time'
      when exists (
        select 1
        from public.exercises as e
        where e.id = wsi.exercise_id
          and e.equipment = 'Peso corporal'
      ) then 'bodyweight'
      else 'reps'
    end
  )
where wsi.sets is null or wsi.kind is null;

alter table public.workout_session_items
  alter column sets set not null,
  alter column kind set not null,
  drop constraint workout_session_items_kind_check,
  add constraint workout_session_items_kind_check
    check (kind in ('reps', 'bodyweight', 'time')),
  drop constraint workout_session_items_sets_check,
  add constraint workout_session_items_sets_check
    check (
      jsonb_typeof(sets) = 'array'
      and jsonb_array_length(sets) <= 20
      and not jsonb_path_exists(sets, '$[*] ? (@.kg < 0 || @.reps < 0 || @.secs < 0)')
    );

comment on column public.workout_session_items.sets is
  'Series por posición [{kg, reps, secs, done}] con null en los huecos.';
comment on column public.workout_session_items.exercise_id is
  'Ejercicio realizado (snapshot). Nullable a propósito: NOT NULL se valida antes de ON CONFLICT y rompería el upsert del esqueleto cuando el admin borra la fila de la rutina.';
