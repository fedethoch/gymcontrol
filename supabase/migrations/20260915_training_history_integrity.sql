-- F0 · Integridad del historial de entrenamiento.
-- Expand: compatible con el código deployado (sigue escribiendo performed_reps / used_weight / is_completed).

-- 1. Editar o borrar partes de una rutina ya no borra historial: las referencias quedan en null.
alter table public.workout_sessions
  alter column routine_day_id drop not null,
  drop constraint workout_sessions_routine_day_id_fkey,
  add constraint workout_sessions_routine_day_id_fkey
    foreign key (routine_day_id) references public.routine_days(id) on delete set null;

alter table public.workout_sessions
  alter column saved_routine_id drop not null,
  drop constraint workout_sessions_saved_routine_id_fkey,
  add constraint workout_sessions_saved_routine_id_fkey
    foreign key (saved_routine_id) references public.saved_routines(id) on delete set null;

alter table public.workout_session_items
  alter column routine_item_id drop not null,
  drop constraint workout_session_items_routine_item_id_fkey,
  add constraint workout_session_items_routine_item_id_fkey
    foreign key (routine_item_id) references public.routine_items(id) on delete set null;

-- 2. Snapshot del ejercicio: el historial se agrupa por ejercicio aunque la fila de la rutina cambie o desaparezca.
alter table public.workout_session_items
  add column exercise_id uuid references public.exercises(id) on delete restrict;

update public.workout_session_items wsi
set exercise_id = ri.exercise_id
from public.routine_items ri
where ri.id = wsi.routine_item_id
  and wsi.exercise_id is null;

-- El código deployado no manda exercise_id: se completa desde la fila de la rutina.
create or replace function private.fill_workout_session_item_exercise()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.exercise_id is null and new.routine_item_id is not null then
    select ri.exercise_id into new.exercise_id
    from public.routine_items ri
    where ri.id = new.routine_item_id;
  end if;

  return new;
end;
$$;

create trigger fill_workout_session_item_exercise
before insert or update on public.workout_session_items
for each row execute function private.fill_workout_session_item_exercise();

create index workout_session_items_exercise_id_idx
on public.workout_session_items (exercise_id);

-- 3. Cada entreno es un registro: se puede repetir un día de rutina en la misma semana o fecha.
alter table public.workout_sessions
  drop constraint workout_sessions_user_id_saved_routine_id_routine_day_id_tr_key;

create index workout_sessions_user_id_training_date_idx
on public.workout_sessions (user_id, training_date desc);

-- 4. Plantillas: se archivan en vez de borrarse, y borrar una plantilla nunca arrastra rutinas guardadas.
alter table public.routine_templates
  add column archived_at timestamptz;

alter table public.saved_routines
  drop constraint saved_routines_routine_template_id_fkey,
  add constraint saved_routines_routine_template_id_fkey
    foreign key (routine_template_id) references public.routine_templates(id) on delete restrict;

-- 5. Uso real de cada plantilla para el admin (saved_routines es owner-only): solo agregados.
create or replace function public.routine_template_usage()
returns table (routine_template_id uuid, saved_count integer, active_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    sr.routine_template_id,
    count(*)::integer,
    (count(*) filter (where sr.is_active))::integer
  from public.saved_routines sr
  where (select private.is_current_user_admin())
  group by sr.routine_template_id;
$$;

revoke all on function public.routine_template_usage() from public, anon;
grant execute on function public.routine_template_usage() to authenticated;

-- 6. Guardado de rutinas por diff conservando IDs, en una sola transacción.
-- security invoker: aplican las policies admin-only de routine_templates / routine_days / routine_items.
create or replace function public.admin_save_routine(
  p_routine_id uuid,
  p_name text,
  p_description text,
  p_difficulty text,
  p_objective text,
  p_days jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_routine_id uuid := p_routine_id;
  v_day jsonb;
  v_item jsonb;
  v_day_id uuid;
  v_item_id uuid;
  v_day_order integer := 0;
  v_row_order integer;
  v_kept_day_ids uuid[] := '{}';
  v_kept_item_ids uuid[] := '{}';
begin
  if not (select private.is_current_user_admin()) then
    raise exception 'Solo un admin puede guardar rutinas.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_days) is distinct from 'array' or jsonb_array_length(p_days) = 0 then
    raise exception 'Agrega al menos un dia.' using errcode = '22023';
  end if;

  if v_routine_id is null then
    insert into public.routine_templates (name, description, difficulty, objective, created_by)
    values (p_name, nullif(p_description, ''), p_difficulty, p_objective, (select private.current_profile_id()))
    returning id into v_routine_id;
  else
    update public.routine_templates
    set name = p_name,
        description = nullif(p_description, ''),
        difficulty = p_difficulty,
        objective = p_objective
    where id = v_routine_id;

    if not found then
      raise exception 'La rutina que intentas editar ya no existe.' using errcode = 'P0002';
    end if;
  end if;

  -- Corre los órdenes actuales fuera de rango para reordenar sin chocar con los unique.
  update public.routine_days
  set day_order = day_order + 10000
  where routine_id = v_routine_id;

  update public.routine_items ri
  set row_order = ri.row_order + 10000
  from public.routine_days rd
  where rd.id = ri.routine_day_id
    and rd.routine_id = v_routine_id;

  for v_day in select value from jsonb_array_elements(p_days) loop
    v_day_order := v_day_order + 1;
    v_day_id := null;

    if nullif(v_day->>'id', '') is not null then
      update public.routine_days
      set day_order = v_day_order,
          day_name = v_day->>'day_name'
      where id = (v_day->>'id')::uuid
        and routine_id = v_routine_id
      returning id into v_day_id;
    end if;

    if v_day_id is null then
      insert into public.routine_days (routine_id, day_order, day_name)
      values (v_routine_id, v_day_order, v_day->>'day_name')
      returning id into v_day_id;
    end if;

    v_kept_day_ids := v_kept_day_ids || v_day_id;
    v_row_order := 0;

    for v_item in select value from jsonb_array_elements(v_day->'items') loop
      v_row_order := v_row_order + 1;
      v_item_id := null;

      if nullif(v_item->>'id', '') is not null then
        update public.routine_items ri
        set routine_day_id = v_day_id,
            exercise_id = (v_item->>'exercise_id')::uuid,
            series = (v_item->>'series')::integer,
            repetitions = v_item->>'repetitions',
            rir = (v_item->>'rir')::integer,
            rest = v_item->>'rest',
            row_order = v_row_order
        from public.routine_days rd
        where ri.id = (v_item->>'id')::uuid
          and rd.id = ri.routine_day_id
          and rd.routine_id = v_routine_id
        returning ri.id into v_item_id;
      end if;

      if v_item_id is null then
        insert into public.routine_items (routine_day_id, exercise_id, series, repetitions, rir, rest, row_order)
        values (
          v_day_id,
          (v_item->>'exercise_id')::uuid,
          (v_item->>'series')::integer,
          v_item->>'repetitions',
          (v_item->>'rir')::integer,
          v_item->>'rest',
          v_row_order
        )
        returning id into v_item_id;
      end if;

      v_kept_item_ids := v_kept_item_ids || v_item_id;
    end loop;
  end loop;

  delete from public.routine_items ri
  using public.routine_days rd
  where rd.id = ri.routine_day_id
    and rd.routine_id = v_routine_id
    and not (ri.id = any (v_kept_item_ids));

  delete from public.routine_days
  where routine_id = v_routine_id
    and not (id = any (v_kept_day_ids));

  return v_routine_id;
end;
$$;

revoke all on function public.admin_save_routine(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function public.admin_save_routine(uuid, text, text, text, text, jsonb) to authenticated;
