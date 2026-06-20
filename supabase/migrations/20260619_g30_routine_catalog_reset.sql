do $$
declare
  admin_profile_id uuid;
  missing_exercise_names text[];
begin
  select id
    into admin_profile_id
  from public.profiles
  where type_rol = 'admin'
  order by created_at asc
  limit 1;

  if admin_profile_id is null then
    raise exception 'G30 routine catalog reset requires at least one admin profile';
  end if;

  create temporary table if not exists _g30_routine_seed (
    name text,
    description text,
    difficulty text,
    objective text
  ) on commit drop;

  create temporary table if not exists _g30_routine_days_seed (
    routine_name text,
    day_order integer,
    day_name text
  ) on commit drop;

  create temporary table if not exists _g30_routine_items_seed (
    routine_name text,
    day_order integer,
    row_order integer,
    exercise_name text,
    series integer,
    repetitions text,
    rir integer,
    rest text
  ) on commit drop;

  truncate table _g30_routine_seed;
  truncate table _g30_routine_days_seed;
  truncate table _g30_routine_items_seed;

  insert into _g30_routine_seed (name, description, difficulty, objective)
  values
    ('Push Pull Legs 6 dias','Frecuencia alta con dos vueltas semanales de empuje, tiron y piernas.','avanzado','hipertrofia'),
    ('Push Pull Legs 5 dias','Division PPL de cinco sesiones para sostener volumen alto con una pierna semanal.','intermedio','hipertrofia'),
    ('Push Pull Legs x Arnold Split 6 dias','Hibrido PPL y Arnold Split con foco extra en torso, hombros y brazos.','avanzado','hipertrofia'),
    ('Push Pull Legs x Arnold Split 5 dias','Hibrido PPL y Arnold Split condensado en cinco sesiones.','intermedio','hipertrofia'),
    ('Upper Lower 4 dias','Torso pierna de cuatro dias con frecuencia dos y volumen equilibrado.','intermedio','hipertrofia'),
    ('Fullbody 3 dias','Cuerpo completo de tres dias para progresar con frecuencia alta y volumen moderado.','principiante','hipertrofia'),
    ('Fullbody mantenimiento 3 dias','Cuerpo completo de tres dias para sostener fuerza, tecnica y condicion.','principiante','mantenimiento'),
    ('Prio Legs(woman) 5 dias','Cinco dias con prioridad de gluteos y piernas, manteniendo torso.','intermedio','hipertrofia');

  insert into _g30_routine_days_seed (routine_name, day_order, day_name)
  values
    ('Push Pull Legs 6 dias',1,'Push A'),('Push Pull Legs 6 dias',2,'Pull A'),('Push Pull Legs 6 dias',3,'Legs A'),('Push Pull Legs 6 dias',4,'Push B'),('Push Pull Legs 6 dias',5,'Pull B'),('Push Pull Legs 6 dias',6,'Legs B'),
    ('Push Pull Legs 5 dias',1,'Push'),('Push Pull Legs 5 dias',2,'Pull'),('Push Pull Legs 5 dias',3,'Legs'),('Push Pull Legs 5 dias',4,'Push 2'),('Push Pull Legs 5 dias',5,'Pull 2'),
    ('Push Pull Legs x Arnold Split 6 dias',1,'Push'),('Push Pull Legs x Arnold Split 6 dias',2,'Pull'),('Push Pull Legs x Arnold Split 6 dias',3,'Legs'),('Push Pull Legs x Arnold Split 6 dias',4,'Pecho y espalda'),('Push Pull Legs x Arnold Split 6 dias',5,'Hombros y brazos'),('Push Pull Legs x Arnold Split 6 dias',6,'Legs 2'),
    ('Push Pull Legs x Arnold Split 5 dias',1,'Push'),('Push Pull Legs x Arnold Split 5 dias',2,'Pull'),('Push Pull Legs x Arnold Split 5 dias',3,'Legs'),('Push Pull Legs x Arnold Split 5 dias',4,'Pecho y espalda'),('Push Pull Legs x Arnold Split 5 dias',5,'Hombros y brazos'),
    ('Upper Lower 4 dias',1,'Upper A'),('Upper Lower 4 dias',2,'Lower A'),('Upper Lower 4 dias',3,'Upper B'),('Upper Lower 4 dias',4,'Lower B'),
    ('Fullbody 3 dias',1,'Full A'),('Fullbody 3 dias',2,'Full B'),('Fullbody 3 dias',3,'Full C'),
    ('Fullbody mantenimiento 3 dias',1,'Full A'),('Fullbody mantenimiento 3 dias',2,'Full B'),('Fullbody mantenimiento 3 dias',3,'Full C'),
    ('Prio Legs(woman) 5 dias',1,'Gluteos'),('Prio Legs(woman) 5 dias',2,'Upper'),('Prio Legs(woman) 5 dias',3,'Cuadriceps'),('Prio Legs(woman) 5 dias',4,'Torso accesorios'),('Prio Legs(woman) 5 dias',5,'Gluteos y femoral');

  insert into _g30_routine_items_seed (routine_name, day_order, row_order, exercise_name, series, repetitions, rir, rest)
  values
    ('Push Pull Legs 6 dias',1,1,'Press banca plano',4,'6-10',1,'120s'),('Push Pull Legs 6 dias',1,2,'Press militar de pie',3,'6-10',2,'120s'),('Push Pull Legs 6 dias',1,3,'Press banca inclinado',3,'8-12',2,'90s'),('Push Pull Legs 6 dias',1,4,'Elevaciones laterales',4,'12-20',1,'60s'),('Push Pull Legs 6 dias',1,5,'Extension triceps polea',3,'10-15',1,'60s'),
    ('Push Pull Legs 6 dias',2,1,'Dominadas pronas',4,'6-10',1,'120s'),('Push Pull Legs 6 dias',2,2,'Remo con barra',4,'6-10',1,'120s'),('Push Pull Legs 6 dias',2,3,'Remo sentado en polea',3,'10-12',2,'90s'),('Push Pull Legs 6 dias',2,4,'Face pull',3,'15-20',1,'60s'),('Push Pull Legs 6 dias',2,5,'Curl barra recta',3,'10-12',1,'60s'),
    ('Push Pull Legs 6 dias',3,1,'Sentadilla trasera',4,'6-10',1,'150s'),('Push Pull Legs 6 dias',3,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Push Pull Legs 6 dias',3,3,'Prensa 45',3,'10-15',1,'90s'),('Push Pull Legs 6 dias',3,4,'Curl femoral acostado',3,'12-15',1,'75s'),('Push Pull Legs 6 dias',3,5,'Gemelos de pie',4,'12-20',1,'60s'),
    ('Push Pull Legs 6 dias',4,1,'Press banca inclinado',4,'8-10',1,'120s'),('Push Pull Legs 6 dias',4,2,'Press Arnold',3,'10',1,'90s'),('Push Pull Legs 6 dias',4,3,'Aperturas con mancuernas',3,'12-15',1,'60s'),('Push Pull Legs 6 dias',4,4,'Extension cuerda sobre cabeza',3,'12-15',1,'60s'),
    ('Push Pull Legs 6 dias',5,1,'Jalon al pecho',4,'10-12',1,'90s'),('Push Pull Legs 6 dias',5,2,'Remo con mancuerna',4,'10',1,'90s'),('Push Pull Legs 6 dias',5,3,'Pullover en polea',3,'12-15',1,'60s'),('Push Pull Legs 6 dias',5,4,'Curl inclinado',3,'10-12',1,'60s'),
    ('Push Pull Legs 6 dias',6,1,'Sentadilla frontal',4,'8-10',1,'120s'),('Push Pull Legs 6 dias',6,2,'Hip thrust',4,'8-12',1,'120s'),('Push Pull Legs 6 dias',6,3,'Extension de cuadriceps',3,'12-15',1,'75s'),('Push Pull Legs 6 dias',6,4,'Abduccion de cadera',3,'15-20',1,'60s'),

    ('Push Pull Legs 5 dias',1,1,'Press banca plano',4,'6-10',1,'120s'),('Push Pull Legs 5 dias',1,2,'Press militar de pie',3,'8-10',2,'120s'),('Push Pull Legs 5 dias',1,3,'Press banca inclinado',3,'10-12',2,'90s'),('Push Pull Legs 5 dias',1,4,'Extension triceps polea',3,'10-15',1,'60s'),
    ('Push Pull Legs 5 dias',2,1,'Dominadas pronas',4,'6-10',1,'120s'),('Push Pull Legs 5 dias',2,2,'Remo con barra',4,'8-10',1,'120s'),('Push Pull Legs 5 dias',2,3,'Face pull',3,'15-20',1,'60s'),('Push Pull Legs 5 dias',2,4,'Curl barra recta',3,'10-12',1,'60s'),
    ('Push Pull Legs 5 dias',3,1,'Sentadilla trasera',4,'6-10',1,'150s'),('Push Pull Legs 5 dias',3,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Push Pull Legs 5 dias',3,3,'Prensa 45',3,'10-15',1,'90s'),('Push Pull Legs 5 dias',3,4,'Curl femoral acostado',3,'12-15',1,'75s'),('Push Pull Legs 5 dias',3,5,'Gemelos de pie',4,'12-20',1,'60s'),
    ('Push Pull Legs 5 dias',4,1,'Press banca inclinado',4,'8-12',1,'90s'),('Push Pull Legs 5 dias',4,2,'Press Arnold',3,'10-12',1,'90s'),('Push Pull Legs 5 dias',4,3,'Elevaciones laterales',4,'15-20',1,'60s'),('Push Pull Legs 5 dias',4,4,'Extension cuerda sobre cabeza',3,'12-15',1,'60s'),
    ('Push Pull Legs 5 dias',5,1,'Jalon al pecho',4,'10-12',1,'90s'),('Push Pull Legs 5 dias',5,2,'Remo con mancuerna',4,'10',1,'90s'),('Push Pull Legs 5 dias',5,3,'Pullover en polea',3,'12-15',1,'60s'),('Push Pull Legs 5 dias',5,4,'Curl inclinado',3,'10-12',1,'60s'),

    ('Push Pull Legs x Arnold Split 6 dias',1,1,'Press banca plano',4,'6-10',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',1,2,'Press militar de pie',3,'8-10',2,'120s'),('Push Pull Legs x Arnold Split 6 dias',1,3,'Fondos en paralelas',3,'8-12',1,'90s'),('Push Pull Legs x Arnold Split 6 dias',1,4,'Extension triceps polea',3,'10-15',1,'60s'),
    ('Push Pull Legs x Arnold Split 6 dias',2,1,'Dominadas pronas',4,'6-10',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',2,2,'Remo con barra',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',2,3,'Face pull',3,'15-20',1,'60s'),('Push Pull Legs x Arnold Split 6 dias',2,4,'Curl barra recta',3,'10-12',1,'60s'),
    ('Push Pull Legs x Arnold Split 6 dias',3,1,'Sentadilla trasera',4,'6-10',1,'150s'),('Push Pull Legs x Arnold Split 6 dias',3,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',3,3,'Prensa 45',3,'10-15',1,'90s'),('Push Pull Legs x Arnold Split 6 dias',3,4,'Gemelos de pie',4,'12-20',1,'60s'),
    ('Push Pull Legs x Arnold Split 6 dias',4,1,'Press banca inclinado',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',4,2,'Dominadas supinas',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',4,3,'Aperturas con mancuernas',3,'12-15',1,'60s'),('Push Pull Legs x Arnold Split 6 dias',4,4,'Remo sentado en polea',3,'10-12',1,'90s'),
    ('Push Pull Legs x Arnold Split 6 dias',5,1,'Press Arnold',4,'8-10',1,'90s'),('Push Pull Legs x Arnold Split 6 dias',5,2,'Elevaciones laterales',4,'15-20',1,'60s'),('Push Pull Legs x Arnold Split 6 dias',5,3,'Curl inclinado',3,'10-12',1,'60s'),('Push Pull Legs x Arnold Split 6 dias',5,4,'Rompecraneos barra z',3,'10-12',1,'60s'),
    ('Push Pull Legs x Arnold Split 6 dias',6,1,'Sentadilla frontal',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',6,2,'Hip thrust',4,'8-12',1,'120s'),('Push Pull Legs x Arnold Split 6 dias',6,3,'Extension de cuadriceps',3,'12-15',1,'75s'),('Push Pull Legs x Arnold Split 6 dias',6,4,'Curl femoral acostado',3,'12-15',1,'75s'),

    ('Push Pull Legs x Arnold Split 5 dias',1,1,'Press banca plano',4,'6-10',1,'120s'),('Push Pull Legs x Arnold Split 5 dias',1,2,'Press militar de pie',3,'8-10',2,'120s'),('Push Pull Legs x Arnold Split 5 dias',1,3,'Fondos en paralelas',3,'8-12',1,'90s'),('Push Pull Legs x Arnold Split 5 dias',1,4,'Extension triceps polea',3,'10-15',1,'60s'),
    ('Push Pull Legs x Arnold Split 5 dias',2,1,'Dominadas pronas',4,'6-10',1,'120s'),('Push Pull Legs x Arnold Split 5 dias',2,2,'Remo con barra',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 5 dias',2,3,'Face pull',3,'15-20',1,'60s'),('Push Pull Legs x Arnold Split 5 dias',2,4,'Curl barra recta',3,'10-12',1,'60s'),
    ('Push Pull Legs x Arnold Split 5 dias',3,1,'Sentadilla trasera',4,'6-10',1,'150s'),('Push Pull Legs x Arnold Split 5 dias',3,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 5 dias',3,3,'Prensa 45',3,'10-15',1,'90s'),('Push Pull Legs x Arnold Split 5 dias',3,4,'Gemelos de pie',4,'12-20',1,'60s'),
    ('Push Pull Legs x Arnold Split 5 dias',4,1,'Press banca inclinado',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 5 dias',4,2,'Dominadas supinas',4,'8-10',1,'120s'),('Push Pull Legs x Arnold Split 5 dias',4,3,'Aperturas con mancuernas',3,'12-15',1,'60s'),('Push Pull Legs x Arnold Split 5 dias',4,4,'Remo sentado en polea',3,'10-12',1,'90s'),
    ('Push Pull Legs x Arnold Split 5 dias',5,1,'Press Arnold',4,'8-10',1,'90s'),('Push Pull Legs x Arnold Split 5 dias',5,2,'Elevaciones laterales',4,'15-20',1,'60s'),('Push Pull Legs x Arnold Split 5 dias',5,3,'Curl inclinado',3,'10-12',1,'60s'),('Push Pull Legs x Arnold Split 5 dias',5,4,'Rompecraneos barra z',3,'10-12',1,'60s'),

    ('Upper Lower 4 dias',1,1,'Press banca plano',4,'6-10',1,'120s'),('Upper Lower 4 dias',1,2,'Jalon al pecho',4,'8-10',1,'90s'),('Upper Lower 4 dias',1,3,'Press hombros sentado',3,'10-12',2,'90s'),('Upper Lower 4 dias',1,4,'Remo sentado en polea',3,'10-12',2,'90s'),('Upper Lower 4 dias',1,5,'Curl barra recta',2,'12',2,'60s'),
    ('Upper Lower 4 dias',2,1,'Sentadilla trasera',4,'6-10',1,'150s'),('Upper Lower 4 dias',2,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Upper Lower 4 dias',2,3,'Prensa 45',3,'10-12',2,'90s'),('Upper Lower 4 dias',2,4,'Gemelos de pie',3,'12-20',2,'60s'),
    ('Upper Lower 4 dias',3,1,'Press banca inclinado',4,'8-12',1,'90s'),('Upper Lower 4 dias',3,2,'Remo con mancuerna',4,'10',1,'90s'),('Upper Lower 4 dias',3,3,'Elevaciones laterales',3,'15-20',1,'60s'),('Upper Lower 4 dias',3,4,'Extension triceps polea',2,'12-15',2,'60s'),
    ('Upper Lower 4 dias',4,1,'Sentadilla frontal',4,'8-10',1,'120s'),('Upper Lower 4 dias',4,2,'Hip thrust',4,'10-12',1,'120s'),('Upper Lower 4 dias',4,3,'Curl femoral acostado',3,'12-15',1,'75s'),('Upper Lower 4 dias',4,4,'Plancha frontal',3,'45-60s',2,'60s'),

    ('Fullbody 3 dias',1,1,'Sentadilla trasera',3,'8-10',2,'120s'),('Fullbody 3 dias',1,2,'Press banca plano',3,'8-10',2,'120s'),('Fullbody 3 dias',1,3,'Remo con barra',3,'8-10',2,'120s'),('Fullbody 3 dias',1,4,'Plancha frontal',3,'30-45s',2,'60s'),
    ('Fullbody 3 dias',2,1,'Peso muerto convencional',3,'5-6',2,'150s'),('Fullbody 3 dias',2,2,'Press militar de pie',3,'8-10',2,'120s'),('Fullbody 3 dias',2,3,'Jalon al pecho',3,'10-12',2,'90s'),('Fullbody 3 dias',2,4,'Zancadas caminando',3,'10 c/lado',2,'90s'),
    ('Fullbody 3 dias',3,1,'Prensa 45',3,'10-12',2,'90s'),('Fullbody 3 dias',3,2,'Press banca inclinado',3,'10-12',2,'90s'),('Fullbody 3 dias',3,3,'Remo sentado en polea',3,'10-12',2,'90s'),('Fullbody 3 dias',3,4,'Elevacion de piernas',3,'10-15',2,'60s'),

    ('Fullbody mantenimiento 3 dias',1,1,'Sentadilla goblet',3,'10-12',3,'75s'),('Fullbody mantenimiento 3 dias',1,2,'Flexiones de brazos',3,'10-15',3,'75s'),('Fullbody mantenimiento 3 dias',1,3,'Remo con mancuerna',3,'12',3,'75s'),('Fullbody mantenimiento 3 dias',1,4,'Plancha frontal',3,'30-45s',3,'60s'),
    ('Fullbody mantenimiento 3 dias',2,1,'Prensa 45',3,'12',3,'75s'),('Fullbody mantenimiento 3 dias',2,2,'Jalon al pecho',3,'12',3,'75s'),('Fullbody mantenimiento 3 dias',2,3,'Press hombros sentado',3,'12',3,'75s'),('Fullbody mantenimiento 3 dias',2,4,'Russian twist',3,'20',3,'45s'),
    ('Fullbody mantenimiento 3 dias',3,1,'Step up con mancuernas',3,'10 c/lado',3,'75s'),('Fullbody mantenimiento 3 dias',3,2,'Dominadas supinas',3,'6-10',3,'90s'),('Fullbody mantenimiento 3 dias',3,3,'Elevaciones laterales',2,'15',3,'60s'),('Fullbody mantenimiento 3 dias',3,4,'Farmer walk',3,'30m',3,'60s'),

    ('Prio Legs(woman) 5 dias',1,1,'Hip thrust',5,'8-10',1,'120s'),('Prio Legs(woman) 5 dias',1,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Prio Legs(woman) 5 dias',1,3,'Abduccion de cadera',4,'15-20',1,'60s'),('Prio Legs(woman) 5 dias',1,4,'Zancadas caminando',3,'12 c/lado',2,'90s'),
    ('Prio Legs(woman) 5 dias',2,1,'Press banca inclinado',3,'8-12',2,'90s'),('Prio Legs(woman) 5 dias',2,2,'Jalon al pecho',3,'10-12',2,'90s'),('Prio Legs(woman) 5 dias',2,3,'Press hombros sentado',3,'10-12',2,'90s'),('Prio Legs(woman) 5 dias',2,4,'Remo sentado en polea',3,'10-12',2,'90s'),
    ('Prio Legs(woman) 5 dias',3,1,'Sentadilla frontal',4,'8-10',1,'120s'),('Prio Legs(woman) 5 dias',3,2,'Prensa 45',4,'10-12',1,'90s'),('Prio Legs(woman) 5 dias',3,3,'Extension de cuadriceps',4,'12-15',1,'75s'),('Prio Legs(woman) 5 dias',3,4,'Gemelos de pie',4,'15-20',1,'60s'),
    ('Prio Legs(woman) 5 dias',4,1,'Dominadas supinas',3,'6-10',2,'90s'),('Prio Legs(woman) 5 dias',4,2,'Remo con mancuerna',3,'10-12',2,'90s'),('Prio Legs(woman) 5 dias',4,3,'Elevaciones laterales',3,'15-20',2,'60s'),('Prio Legs(woman) 5 dias',4,4,'Curl martillo',2,'12-15',2,'60s'),
    ('Prio Legs(woman) 5 dias',5,1,'Hip thrust',4,'10-12',1,'120s'),('Prio Legs(woman) 5 dias',5,2,'Sentadilla trasera',4,'8-10',1,'120s'),('Prio Legs(woman) 5 dias',5,3,'Curl femoral acostado',4,'12-15',1,'75s'),('Prio Legs(woman) 5 dias',5,4,'Abduccion de cadera',4,'15-25',1,'60s');

  select array_agg(distinct items.exercise_name order by items.exercise_name)
    into missing_exercise_names
  from _g30_routine_items_seed items
  where not exists (
    select 1
    from public.exercises exercises
    where lower(exercises.name) = lower(items.exercise_name)
  );

  if missing_exercise_names is not null then
    raise exception 'G30 routine catalog reset is missing exercises: %', array_to_string(missing_exercise_names, ', ');
  end if;

  delete from public.routine_templates;

  insert into public.routine_templates (name, description, difficulty, objective, created_by)
  select name, description, difficulty, objective, admin_profile_id
  from _g30_routine_seed
  order by array_position(array[
    'Push Pull Legs 6 dias',
    'Push Pull Legs 5 dias',
    'Push Pull Legs x Arnold Split 6 dias',
    'Push Pull Legs x Arnold Split 5 dias',
    'Upper Lower 4 dias',
    'Fullbody 3 dias',
    'Fullbody mantenimiento 3 dias',
    'Prio Legs(woman) 5 dias'
  ], name);

  insert into public.routine_days (routine_id, day_order, day_name)
  select templates.id, days.day_order, days.day_name
  from _g30_routine_days_seed days
  join public.routine_templates templates on lower(templates.name) = lower(days.routine_name)
  order by templates.created_at, days.day_order;

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
  from _g30_routine_items_seed items
  join public.routine_templates templates on lower(templates.name) = lower(items.routine_name)
  join public.routine_days days on days.routine_id = templates.id and days.day_order = items.day_order
  join lateral (
    select id
    from public.exercises
    where lower(name) = lower(items.exercise_name)
    order by created_at asc, id asc
    limit 1
  ) exercises on true
  order by templates.created_at, items.day_order, items.row_order;
end $$;
