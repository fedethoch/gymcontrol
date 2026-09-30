-- Limpieza del catálogo de ejercicios (solo datos, compatible con el código deployado).

-- Respaldo previo (schema private, no expuesto): catálogo completo con sus URLs de imagen/GIF
-- y las filas de rutina que se reasignan.
create table if not exists private.exercises_backup_20260930 as
select * from public.exercises;

create table if not exists private.routine_items_backup_20260930 as
select ri.*
from public.routine_items ri
join public.exercises e on e.id = ri.exercise_id
where e.name in ('Remo en banco', 'Press en máquina', 'Extensiones de piernas');

-- Duplicados y ejercicio retirado: las filas de rutina y el historial pasan al ejercicio que queda
-- (conservan series, reps, RIR y descanso); después se borra el que sobra.
--   "Press en máquina" (cargado en Piernas) era el press de pecho sentado → "Press en maquina pecho".
--   "Extensiones de piernas" duplicaba "Extension de cuadriceps".
--   "Remo en banco" se retira; su única fila de rutina pasa a "Remo en máquina".
do $$
declare
  v_pair record;
  v_duplicate uuid;
  v_keep uuid;
begin
  for v_pair in
    select *
    from (values
      ('Press en máquina', 'Press en maquina pecho'),
      ('Extensiones de piernas', 'Extension de cuadriceps'),
      ('Remo en banco', 'Remo en máquina')
    ) as pairs(duplicate_name, keep_name)
  loop
    v_duplicate := (select id from public.exercises where name = v_pair.duplicate_name);
    v_keep := (select id from public.exercises where name = v_pair.keep_name);

    if v_duplicate is null or v_keep is null then
      continue;
    end if;

    update public.routine_items set exercise_id = v_keep where exercise_id = v_duplicate;
    update public.workout_session_items set exercise_id = v_keep where exercise_id = v_duplicate;
    delete from public.exercises where id = v_duplicate;
  end loop;
end;
$$;
