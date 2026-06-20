do $$
declare
  admin_profile_id uuid;
  arnold_routine_id uuid;
  missing_exercise_names text[];
begin
  select id
    into admin_profile_id
  from public.profiles
  where type_rol = 'admin'
  order by created_at asc
  limit 1;

  if admin_profile_id is null then
    raise exception 'G32 Arnold Split catalog seed requires at least one admin profile';
  end if;

  create temporary table if not exists _g32_arnold_days_seed (
    day_order integer,
    day_name text
  ) on commit drop;

  create temporary table if not exists _g32_arnold_items_seed (
    day_order integer,
    row_order integer,
    exercise_name text,
    series integer,
    repetitions text,
    rir integer,
    rest text
  ) on commit drop;

  truncate table _g32_arnold_days_seed;
  truncate table _g32_arnold_items_seed;

  insert into _g32_arnold_days_seed (day_order, day_name)
  values
    (1, 'Pecho y espalda A'),
    (2, 'Hombros y brazos A'),
    (3, 'Piernas A'),
    (4, 'Pecho y espalda B'),
    (5, 'Hombros y brazos B'),
    (6, 'Piernas B');

  insert into _g32_arnold_items_seed (day_order, row_order, exercise_name, series, repetitions, rir, rest)
  values
    (1, 1, 'Press banca plano', 4, '6-10', 1, '120s'),
    (1, 2, 'Dominadas pronas', 4, '6-10', 1, '120s'),
    (1, 3, 'Press banca inclinado', 3, '8-12', 1, '90s'),
    (1, 4, 'Remo con barra', 3, '8-12', 1, '90s'),
    (1, 5, 'Aperturas con mancuernas', 3, '12-15', 1, '60s'),
    (1, 6, 'Pullover en polea', 3, '12-15', 1, '60s'),

    (2, 1, 'Press Arnold', 4, '8-10', 1, '90s'),
    (2, 2, 'Elevaciones laterales', 4, '12-20', 1, '60s'),
    (2, 3, 'Pajaros posteriores', 3, '12-20', 1, '60s'),
    (2, 4, 'Curl barra recta', 3, '8-12', 1, '60s'),
    (2, 5, 'Curl inclinado', 3, '10-12', 1, '60s'),
    (2, 6, 'Rompecraneos barra z', 3, '8-12', 1, '60s'),
    (2, 7, 'Extension triceps polea', 3, '10-15', 1, '60s'),

    (3, 1, 'Sentadilla trasera', 4, '6-10', 1, '150s'),
    (3, 2, 'Peso muerto rumano', 4, '8-10', 1, '120s'),
    (3, 3, 'Prensa 45', 3, '10-15', 1, '90s'),
    (3, 4, 'Extension de cuadriceps', 3, '12-15', 1, '75s'),
    (3, 5, 'Curl femoral acostado', 3, '12-15', 1, '75s'),
    (3, 6, 'Gemelos de pie', 4, '12-20', 1, '60s'),

    (4, 1, 'Press banca inclinado', 4, '8-10', 1, '90s'),
    (4, 2, 'Dominadas supinas', 4, '8-10', 1, '120s'),
    (4, 3, 'Cruce de poleas', 3, '12-15', 1, '60s'),
    (4, 4, 'Remo sentado en polea', 3, '10-12', 1, '90s'),
    (4, 5, 'Press en maquina pecho', 3, '10-12', 1, '75s'),
    (4, 6, 'Pull over con mancuerna', 3, '12-15', 1, '60s'),

    (5, 1, 'Press hombros sentado', 4, '8-10', 1, '90s'),
    (5, 2, 'Elevaciones laterales', 4, '15-20', 1, '60s'),
    (5, 3, 'Face pull', 3, '12-20', 1, '60s'),
    (5, 4, 'Curl predicador', 3, '10-12', 1, '60s'),
    (5, 5, 'Curl martillo', 3, '10-12', 1, '60s'),
    (5, 6, 'Press cerrado', 3, '8-10', 1, '90s'),
    (5, 7, 'Extension cuerda sobre cabeza', 3, '10-15', 1, '60s'),

    (6, 1, 'Sentadilla frontal', 4, '8-10', 1, '120s'),
    (6, 2, 'Hip thrust', 4, '8-12', 1, '120s'),
    (6, 3, 'Zancadas caminando', 3, '10 c/lado', 1, '90s'),
    (6, 4, 'Curl femoral acostado', 3, '12-15', 1, '75s'),
    (6, 5, 'Abduccion de cadera', 3, '15-20', 1, '60s'),
    (6, 6, 'Gemelos de pie', 4, '12-20', 1, '60s');

  select array_agg(distinct items.exercise_name order by items.exercise_name)
    into missing_exercise_names
  from _g32_arnold_items_seed items
  where not exists (
    select 1
    from public.exercises exercises
    where lower(exercises.name) = lower(items.exercise_name)
  );

  if missing_exercise_names is not null then
    raise exception 'G32 Arnold Split catalog seed is missing exercises: %', array_to_string(missing_exercise_names, ', ');
  end if;

  select id
    into arnold_routine_id
  from public.routine_templates
  where lower(name) = lower('Arnold Split 6 dias')
  order by created_at asc, id asc
  limit 1;

  if arnold_routine_id is not null then
    return;
  end if;

  insert into public.routine_templates (
    name,
    description,
    difficulty,
    objective,
    created_by
  )
  values (
    'Arnold Split 6 dias',
    'Division clasica de seis dias con pecho y espalda, hombros y brazos, y piernas en dos vueltas semanales.',
    'avanzado',
    'hipertrofia',
    admin_profile_id
  )
  returning id into arnold_routine_id;

  insert into public.routine_days (routine_id, day_order, day_name)
  select arnold_routine_id, day_order, day_name
  from _g32_arnold_days_seed
  order by day_order;

  insert into public.routine_items (
    routine_day_id,
    exercise_id,
    series,
    repetitions,
    rir,
    rest,
    row_order
  )
  select
    days.id,
    exercises.id,
    items.series,
    items.repetitions,
    items.rir,
    items.rest,
    items.row_order
  from _g32_arnold_items_seed items
  join public.routine_days days
    on days.routine_id = arnold_routine_id
   and days.day_order = items.day_order
  join lateral (
    select id
    from public.exercises
    where lower(name) = lower(items.exercise_name)
    order by created_at asc, id asc
    limit 1
  ) exercises on true
  order by items.day_order, items.row_order;
end $$;
