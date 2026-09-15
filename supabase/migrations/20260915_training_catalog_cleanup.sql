-- Limpieza del catálogo de entrenamiento (solo datos, compatible con el código deployado).

-- 1. "Sentadilla" duplicaba "Sentadilla trasera" (barra, piernas) y mostraba la imagen de otro ejercicio.
--    Las filas de rutina y el historial pasan al ejercicio que queda; después se borra el duplicado.
do $$
declare
  v_duplicate uuid := (select id from public.exercises where name = 'Sentadilla');
  v_keep uuid := (select id from public.exercises where name = 'Sentadilla trasera');
begin
  if v_duplicate is null or v_keep is null then
    return;
  end if;

  update public.routine_items set exercise_id = v_keep where exercise_id = v_duplicate;
  update public.workout_session_items set exercise_id = v_keep where exercise_id = v_duplicate;
  delete from public.exercises where id = v_duplicate;
end;
$$;

-- 2. Días nombrados con día de la semana ("Lunes - Pierna · Bícep · Abs"): el usuario entrena el día
--    que quiera y la app ya muestra "Día N", así que el nombre queda solo con el contenido.
update public.routine_days
set day_name = regexp_replace(
  day_name,
  '^\s*(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[-–—:·]\s*',
  '',
  'i'
)
where day_name ~* '^\s*(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[-–—:·]';
