do $$
declare
  admin_profile_id uuid;
begin
  select id
    into admin_profile_id
  from public.profiles
  where type_rol = 'admin'
  order by created_at asc
  limit 1;

  if admin_profile_id is null then
    raise exception 'G28 seed requires at least one admin profile';
  end if;

  with protein_foods(name, ord) as (
    select * from unnest(array[
      'Pechuga de pollo','Pechuga de pavo','Muslo de pollo sin piel','Carne vacuna magra','Lomo vacuno',
      'Nalga vacuna','Cuadril magro','Peceto','Carne picada magra','Bife angosto magro',
      'Roast beef magro','Atun al natural','Salmon','Merluza','Lenguado',
      'Sardinas','Caballa','Camaron','Trucha','Pejerrey',
      'Calamar','Mejillones','Huevo entero','Clara de huevo','Yogur griego descremado',
      'Queso cottage','Ricota magra','Mozzarella light','Queso port salut light','Kefir natural',
      'Leche descremada','Leche parcialmente descremada','Tofu firme','Tempeh','Seitan',
      'Edamame','Lentejas cocidas','Garbanzos cocidos','Porotos negros','Porotos blancos',
      'Arvejas cocidas','Proteina whey','Jamon cocido magro','Lomo de cerdo','Solomillo de cerdo',
      'Higado vacuno','Pollo desmenuzado','Pavo molido','Hamburguesa casera magra','Albondigas magras'
    ]) with ordinality
  ),
  carb_foods(name, ord) as (
    select * from unnest(array[
      'Arroz blanco cocido','Arroz integral cocido','Arroz basmati cocido','Quinoa cocida','Trigo burgol cocido',
      'Cuscus cocido','Avena','Granola simple','Pan integral','Pan de centeno',
      'Tostadas integrales','Fideos integrales cocidos','Fideos de trigo cocidos','Nioquis de papa','Papa hervida',
      'Papa al horno','Batata al horno','Pure de papa','Choclo cocido','Polenta cocida',
      'Tortilla de trigo','Tortilla de maiz','Arepa','Mandioca hervida','Zapallo cabutia',
      'Calabaza al horno','Banana','Manzana','Pera','Naranja',
      'Mandarina','Durazno','Frutilla','Arandanos','Uvas',
      'Kiwi','Mango','Anana','Ciruela','Datiles',
      'Pasas de uva','Miel','Mermelada reducida','Cereal de maiz','Barra de cereal',
      'Galletas de arroz','Crackers integrales','Harina integral','Harina de avena','Harina de maiz',
      'Pan arabe integral','Bagel integral','Cebada cocida','Mijo cocido','Risotto simple'
    ]) with ordinality
  ),
  fat_foods(name, ord) as (
    select * from unnest(array[
      'Palta','Almendras','Nueces','Mani tostado','Avellanas',
      'Castanas de caju','Pistachos','Semillas de chia','Semillas de lino','Semillas de girasol',
      'Semillas de zapallo','Aceite de oliva','Aceite de girasol','Aceite de coco','Manteca de mani',
      'Tahini','Aceitunas verdes','Aceitunas negras','Chocolate amargo 70','Coco rallado',
      'Queso crema light','Crema de leche light','Mayonesa light','Pesto casero','Manteca'
    ]) with ordinality
  ),
  vegetable_foods(name, ord) as (
    select * from unnest(array[
      'Brocoli','Espinaca','Mix de ensalada','Lechuga','Rucula',
      'Acelga','Kale','Repollo blanco','Repollo morado','Coliflor',
      'Zanahoria','Tomate','Tomate cherry','Pepino','Morron rojo',
      'Morron verde','Cebolla','Cebolla morada','Puerro','Ajo',
      'Zapallito','Zucchini','Berenjena','Esparragos','Alcaucil',
      'Remolacha','Rabanito','Apio','Hinojo','Champinones',
      'Hongos portobello','Brotes de soja','Chauchas','Arvejas frescas','Palmitos',
      'Pickles','Salsa de tomate natural','Perejil','Cilantro','Albahaca',
      'Berro','Endivia','Escarola','Pepinillos','Vegetales grillados'
    ]) with ordinality
  ),
  mixed_foods(name, ord) as (
    select * from unnest(array[
      'Sushi salmon avocado','Empanada de carne al horno','Empanada de pollo al horno','Tarta de verduras','Tarta de atun',
      'Milanesa de pollo al horno','Milanesa de carne al horno','Hamburguesa completa casera','Sandwich de pollo integral','Sandwich de atun integral',
      'Burrito de pollo','Wrap vegetariano','Pizza integral de muzzarella','Lasagna de carne magra','Guiso de lentejas',
      'Locro liviano','Ensalada caesar con pollo','Ensalada completa de garbanzos','Omelette de verduras','Tortilla de papa al horno',
      'Wok de pollo y vegetales','Wok de tofu y arroz','Bowl de quinoa y pollo','Bowl mediterraneo','Sopa crema de calabaza'
    ]) with ordinality
  ),
  food_seed as (
    select
      name,
      'protein'::text as category,
      100 as serving_g,
      'g'::text as measure,
      null::numeric as grams_per_unit,
      95 + ((ord * 7) % 145) as calories,
      16 + ((ord * 3) % 18) as protein_g,
      (ord % 7) as carbs_g,
      1 + ((ord * 2) % 12) as fat_g
    from protein_foods
    union all
    select
      name,
      'carb',
      100,
      case when name in ('Banana','Manzana','Pera','Naranja','Mandarina','Durazno','Kiwi') then 'unit' else 'g' end,
      case when name in ('Banana','Manzana','Pera','Naranja','Mandarina','Durazno','Kiwi') then 120 else null end,
      80 + ((ord * 11) % 320),
      1 + (ord % 9),
      18 + ((ord * 5) % 65),
      (ord % 8)
    from carb_foods
    union all
    select
      name,
      'fat',
      100,
      'g',
      null,
      160 + ((ord * 29) % 725),
      (ord * 2) % 26,
      (ord * 3) % 25,
      12 + ((ord * 5) % 70)
    from fat_foods
    union all
    select
      name,
      'vegetable',
      100,
      'g',
      null,
      15 + ((ord * 4) % 75),
      1 + (ord % 5),
      2 + ((ord * 2) % 15),
      (ord % 3)
    from vegetable_foods
    union all
    select
      name,
      'mixed',
      100,
      'g',
      null,
      130 + ((ord * 17) % 270),
      5 + ((ord * 3) % 22),
      10 + ((ord * 5) % 42),
      3 + ((ord * 4) % 24)
    from mixed_foods
  )
  insert into public.foods (
    name,
    image_url,
    category,
    serving_g,
    measure,
    grams_per_unit,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    created_by
  )
  select
    food_seed.name,
    '',
    food_seed.category,
    food_seed.serving_g,
    food_seed.measure,
    food_seed.grams_per_unit,
    food_seed.calories,
    food_seed.protein_g,
    food_seed.carbs_g,
    food_seed.fat_g,
    admin_profile_id
  from food_seed
  where not exists (
    select 1
    from public.foods existing
    where lower(existing.name) = lower(food_seed.name)
  );

  with exercise_seed(name, muscle_group, equipment, min_reps, max_reps) as (
    values
      ('Press banca plano','Pecho','Barra',5,12),('Press banca inclinado','Pecho','Mancuernas',8,12),
      ('Aperturas con mancuernas','Pecho','Mancuernas',10,15),('Fondos en paralelas','Pecho','Peso corporal',6,15),
      ('Press en maquina pecho','Pecho','Maquina',8,15),('Cruce de poleas','Pecho','Polea',12,20),
      ('Flexiones de brazos','Pecho','Peso corporal',8,25),('Pull over con mancuerna','Pecho','Mancuernas',10,15),
      ('Dominadas pronas','Espalda','Peso corporal',5,12),('Jalon al pecho','Espalda','Polea',8,15),
      ('Remo con barra','Espalda','Barra',6,12),('Remo con mancuerna','Espalda','Mancuernas',8,15),
      ('Remo sentado en polea','Espalda','Polea',8,15),('Peso muerto convencional','Espalda','Barra',3,8),
      ('Face pull','Espalda','Polea',12,20),('Pullover en polea','Espalda','Polea',10,18),
      ('Sentadilla trasera','Piernas','Barra',5,12),('Sentadilla frontal','Piernas','Barra',5,10),
      ('Prensa 45','Piernas','Maquina',8,15),('Peso muerto rumano','Piernas','Barra',6,12),
      ('Hip thrust','Piernas','Barra',8,15),('Zancadas caminando','Piernas','Mancuernas',10,20),
      ('Extension de cuadriceps','Piernas','Maquina',10,18),('Curl femoral acostado','Piernas','Maquina',10,18),
      ('Gemelos de pie','Piernas','Maquina',10,20),('Abduccion de cadera','Piernas','Maquina',12,25),
      ('Step up con mancuernas','Piernas','Mancuernas',8,15),('Sentadilla goblet','Piernas','Kettlebell',8,15),
      ('Press militar de pie','Hombros','Barra',5,10),('Press hombros sentado','Hombros','Mancuernas',8,12),
      ('Elevaciones laterales','Hombros','Mancuernas',12,20),('Elevaciones frontales','Hombros','Mancuernas',10,18),
      ('Pajaros posteriores','Hombros','Mancuernas',12,20),('Remo al menton','Hombros','Barra',8,12),
      ('Press Arnold','Hombros','Mancuernas',8,12),('Encogimientos trapecio','Hombros','Mancuernas',10,18),
      ('Curl barra recta','Biceps','Barra',8,12),('Curl alterno mancuernas','Biceps','Mancuernas',8,15),
      ('Curl martillo','Biceps','Mancuernas',8,15),('Curl predicador','Biceps','Maquina',10,15),
      ('Curl en polea','Biceps','Polea',10,18),('Curl concentrado','Biceps','Mancuernas',10,15),
      ('Dominadas supinas','Biceps','Peso corporal',5,12),('Curl inclinado','Biceps','Mancuernas',8,15),
      ('Press cerrado','Triceps','Barra',6,12),('Extension triceps polea','Triceps','Polea',10,18),
      ('Fondos banco','Triceps','Peso corporal',8,20),('Rompecraneos barra z','Triceps','Barra',8,12),
      ('Extension triceps mancuerna','Triceps','Mancuernas',10,15),('Patada triceps','Triceps','Mancuernas',12,20),
      ('Extension cuerda sobre cabeza','Triceps','Polea',10,18),('Flexion diamante','Triceps','Peso corporal',8,20),
      ('Plancha frontal','Core','Peso corporal',20,60),('Crunch abdominal','Core','Peso corporal',12,25),
      ('Elevacion de piernas','Core','Peso corporal',8,20),('Russian twist','Core','Peso corporal',12,30),
      ('Pallof press','Core','Polea',10,18),('Rueda abdominal','Core','Peso corporal',6,15),
      ('Mountain climbers','Core','Peso corporal',20,60),('Farmer walk','Core','Kettlebell',20,60)
  )
  insert into public.exercises (
    name,
    description,
    image_url,
    muscle_group,
    equipment,
    min_reps,
    max_reps,
    steps,
    tips,
    created_by
  )
  select
    exercise_seed.name,
    'Ejercicio base para rutinas del catalogo. Ajustar carga y rango segun tecnica y objetivo.',
    '',
    exercise_seed.muscle_group,
    exercise_seed.equipment,
    exercise_seed.min_reps,
    exercise_seed.max_reps,
    array['Preparar posicion inicial estable','Ejecutar el movimiento con control','Volver sin perder tension'],
    array['Priorizar tecnica antes que carga','Mantener respiracion controlada','Detener si aparece dolor articular'],
    admin_profile_id
  from exercise_seed
  where not exists (
    select 1
    from public.exercises existing
    where lower(existing.name) = lower(exercise_seed.name)
  );

  with recipe_seed(name, description, category, servings) as (
    values
      ('Avena proteica con banana','Desayuno alto en carbohidratos y proteina para entrenamiento.', 'desayuno', 1),
      ('Yogur griego con frutas y almendras','Desayuno rapido con proteina, fibra y grasas saludables.', 'desayuno', 1),
      ('Tostadas integrales con huevo y palta','Desayuno salado con buen aporte de energia.', 'desayuno', 1),
      ('Omelette de espinaca y queso','Opcion baja en carbohidratos y alta en proteina.', 'desayuno', 1),
      ('Panqueques de avena y clara','Desayuno dulce orientado a hipertrofia.', 'desayuno', 2),
      ('Smoothie proteico','Batido practico para sumar calorias y proteina.', 'desayuno', 1),
      ('Bowl de pollo arroz y brocoli','Comida completa clasica para ganancia muscular.', 'comida', 1),
      ('Carne magra con papa y ensalada','Comida simple con proteina, carbohidratos y vegetales.', 'comida', 1),
      ('Atun con arroz y vegetales','Comida practica con ingredientes faciles.', 'comida', 1),
      ('Ensalada completa de garbanzos','Comida vegetal con legumbres y grasas saludables.', 'comida', 1),
      ('Pasta integral con pollo','Comida alta en energia para dias de entrenamiento.', 'comida', 1),
      ('Salmon con batata','Comida rica en grasas saludables y carbohidratos complejos.', 'comida', 1),
      ('Tacos de carne magra','Comida flexible con buen aporte proteico.', 'comida', 2),
      ('Wok de tofu y arroz','Comida vegetariana equilibrada.', 'comida', 1),
      ('Milanesa saludable','Version al horno con guarnicion balanceada.', 'comida', 1),
      ('Burrito de pollo','Comida portable alta en proteina.', 'comida', 1),
      ('Hummus con zanahoria','Snack con legumbres y vegetales.', 'snack', 1),
      ('Tostada con manteca de mani','Snack calorico para subir energia diaria.', 'snack', 1),
      ('Yogur con nueces','Snack proteico con grasas saludables.', 'snack', 1),
      ('Sandwich proteico','Snack salado rapido y completo.', 'snack', 1)
  )
  insert into public.recipes (name, description, image_url, category, servings, created_by)
  select recipe_seed.name, recipe_seed.description, '', recipe_seed.category, recipe_seed.servings, admin_profile_id
  from recipe_seed
  where not exists (
    select 1
    from public.recipes existing
    where lower(existing.name) = lower(recipe_seed.name)
  );

  delete from public.recipe_items items
  using public.recipes recipes
  where items.recipe_id = recipes.id
    and recipes.name in (
      'Avena proteica con banana','Yogur griego con frutas y almendras','Tostadas integrales con huevo y palta',
      'Omelette de espinaca y queso','Panqueques de avena y clara','Smoothie proteico',
      'Bowl de pollo arroz y brocoli','Carne magra con papa y ensalada','Atun con arroz y vegetales',
      'Ensalada completa de garbanzos','Pasta integral con pollo','Salmon con batata',
      'Tacos de carne magra','Wok de tofu y arroz','Milanesa saludable','Burrito de pollo',
      'Hummus con zanahoria','Tostada con manteca de mani','Yogur con nueces','Sandwich proteico'
    );

  with ingredient_seed(recipe_name, food_name, grams) as (
    values
      ('Avena proteica con banana','Avena',60),('Avena proteica con banana','Proteina whey',30),('Avena proteica con banana','Banana',120),('Avena proteica con banana','Leche descremada',200),
      ('Yogur griego con frutas y almendras','Yogur griego descremado',250),('Yogur griego con frutas y almendras','Frutilla',100),('Yogur griego con frutas y almendras','Arandanos',80),('Yogur griego con frutas y almendras','Almendras',20),
      ('Tostadas integrales con huevo y palta','Pan integral',80),('Tostadas integrales con huevo y palta','Huevo entero',100),('Tostadas integrales con huevo y palta','Palta',60),('Tostadas integrales con huevo y palta','Tomate',80),
      ('Omelette de espinaca y queso','Huevo entero',150),('Omelette de espinaca y queso','Espinaca',80),('Omelette de espinaca y queso','Mozzarella light',40),('Omelette de espinaca y queso','Champinones',80),
      ('Panqueques de avena y clara','Harina de avena',80),('Panqueques de avena y clara','Clara de huevo',180),('Panqueques de avena y clara','Banana',100),('Panqueques de avena y clara','Miel',15),
      ('Smoothie proteico','Proteina whey',30),('Smoothie proteico','Leche descremada',250),('Smoothie proteico','Banana',120),('Smoothie proteico','Manteca de mani',20),
      ('Bowl de pollo arroz y brocoli','Pechuga de pollo',180),('Bowl de pollo arroz y brocoli','Arroz blanco cocido',180),('Bowl de pollo arroz y brocoli','Brocoli',120),('Bowl de pollo arroz y brocoli','Aceite de oliva',10),
      ('Carne magra con papa y ensalada','Carne vacuna magra',180),('Carne magra con papa y ensalada','Papa hervida',220),('Carne magra con papa y ensalada','Mix de ensalada',120),('Carne magra con papa y ensalada','Aceite de oliva',10),
      ('Atun con arroz y vegetales','Atun al natural',140),('Atun con arroz y vegetales','Arroz integral cocido',180),('Atun con arroz y vegetales','Morron rojo',80),('Atun con arroz y vegetales','Zanahoria',80),
      ('Ensalada completa de garbanzos','Garbanzos cocidos',180),('Ensalada completa de garbanzos','Mix de ensalada',120),('Ensalada completa de garbanzos','Tomate',100),('Ensalada completa de garbanzos','Palta',60),
      ('Pasta integral con pollo','Fideos integrales cocidos',220),('Pasta integral con pollo','Pechuga de pollo',160),('Pasta integral con pollo','Salsa de tomate natural',120),('Pasta integral con pollo','Queso port salut light',35),
      ('Salmon con batata','Salmon',180),('Salmon con batata','Batata al horno',220),('Salmon con batata','Espinaca',90),('Salmon con batata','Aceite de oliva',10),
      ('Tacos de carne magra','Tortilla de maiz',120),('Tacos de carne magra','Carne picada magra',180),('Tacos de carne magra','Tomate',80),('Tacos de carne magra','Palta',50),
      ('Wok de tofu y arroz','Tofu firme',180),('Wok de tofu y arroz','Arroz basmati cocido',180),('Wok de tofu y arroz','Vegetales grillados',150),('Wok de tofu y arroz','Aceite de oliva',10),
      ('Milanesa saludable','Milanesa de pollo al horno',180),('Milanesa saludable','Pure de papa',180),('Milanesa saludable','Mix de ensalada',120),
      ('Burrito de pollo','Tortilla de trigo',90),('Burrito de pollo','Pollo desmenuzado',160),('Burrito de pollo','Porotos negros',90),('Burrito de pollo','Palta',50),
      ('Hummus con zanahoria','Garbanzos cocidos',120),('Hummus con zanahoria','Tahini',20),('Hummus con zanahoria','Zanahoria',160),
      ('Tostada con manteca de mani','Pan integral',70),('Tostada con manteca de mani','Manteca de mani',30),('Tostada con manteca de mani','Banana',80),
      ('Yogur con nueces','Yogur griego descremado',220),('Yogur con nueces','Nueces',25),('Yogur con nueces','Miel',10),
      ('Sandwich proteico','Pan integral',90),('Sandwich proteico','Pechuga de pavo',120),('Sandwich proteico','Queso port salut light',35),('Sandwich proteico','Lechuga',30)
  )
  insert into public.recipe_items (recipe_id, food_id, grams)
  select recipes.id, foods.id, ingredient_seed.grams
  from ingredient_seed
  join public.recipes recipes on lower(recipes.name) = lower(ingredient_seed.recipe_name)
  join lateral (
    select id
    from public.foods
    where lower(name) = lower(ingredient_seed.food_name)
    order by created_at asc, id asc
    limit 1
  ) foods on true;

  create temporary table if not exists _g28_routine_days_seed (
    routine_name text,
    day_order integer,
    day_name text
  ) on commit drop;

  create temporary table if not exists _g28_routine_items_seed (
    routine_name text,
    day_order integer,
    row_order integer,
    exercise_name text,
    series integer,
    repetitions text,
    rir integer,
    rest text
  ) on commit drop;

  truncate table _g28_routine_days_seed;
  truncate table _g28_routine_items_seed;

  with routine_seed(name, description, difficulty, objective) as (
    values
      ('Full Body Inicial','Rutina de cuerpo completo para aprender tecnica y generar adherencia.','principiante','mantenimiento'),
      ('Torso Pierna Base','Division simple de torso y pierna para progresar sin exceso de volumen.','principiante','hipertrofia'),
      ('Fuerza Principiante','Base de fuerza con patrones principales y accesorios controlados.','principiante','fuerza'),
      ('Hipertrofia Inicial','Volumen moderado para ganar masa muscular con ejercicios guiados.','principiante','hipertrofia'),
      ('Mantenimiento Activo','Rutina simple para sostener condicion fisica general.','principiante','mantenimiento'),
      ('Push Pull Legs Intermedio','Division clasica de empuje, tiron y piernas.','intermedio','hipertrofia'),
      ('Torso Pierna Hipertrofia','Frecuencia dos para estimular torso y piernas.','intermedio','hipertrofia'),
      ('Fuerza 5x5 Adaptada','Progresion de fuerza con accesorios minimos.','intermedio','fuerza'),
      ('Gluteos y Piernas Intermedio','Enfoque de tren inferior con trabajo de gluteos y femorales.','intermedio','hipertrofia'),
      ('Upper Lower Mantenimiento','Estructura equilibrada para sostener rendimiento.','intermedio','mantenimiento'),
      ('Full Body Intermedio','Cuerpo completo con mas densidad y variedad.','intermedio','mantenimiento'),
      ('PPL Avanzado','Alta frecuencia y volumen para usuarios con experiencia.','avanzado','hipertrofia'),
      ('Fuerza Avanzada','Trabajo pesado en basicos con accesorios estrategicos.','avanzado','fuerza'),
      ('Especializacion Piernas','Bloque avanzado para tren inferior.','avanzado','hipertrofia'),
      ('Torso Avanzado','Bloque avanzado para pecho, espalda, hombros y brazos.','avanzado','hipertrofia')
  )
  insert into public.routine_templates (name, description, difficulty, objective, created_by)
  select name, description, difficulty, objective, admin_profile_id
  from routine_seed
  where not exists (
    select 1
    from public.routine_templates existing
    where lower(existing.name) = lower(routine_seed.name)
  );

  insert into _g28_routine_days_seed (routine_name, day_order, day_name)
  select routine_name, day_order, day_name
  from (
    values
      ('Full Body Inicial',1,'Dia A'),('Full Body Inicial',2,'Dia B'),('Full Body Inicial',3,'Dia C'),
      ('Torso Pierna Base',1,'Torso A'),('Torso Pierna Base',2,'Pierna A'),('Torso Pierna Base',3,'Torso B'),('Torso Pierna Base',4,'Pierna B'),
      ('Fuerza Principiante',1,'Fuerza A'),('Fuerza Principiante',2,'Fuerza B'),('Fuerza Principiante',3,'Fuerza C'),
      ('Hipertrofia Inicial',1,'Torso'),('Hipertrofia Inicial',2,'Piernas'),('Hipertrofia Inicial',3,'Full Body'),
      ('Mantenimiento Activo',1,'Movilidad y fuerza'),('Mantenimiento Activo',2,'Full Body'),('Mantenimiento Activo',3,'Condicion general'),
      ('Push Pull Legs Intermedio',1,'Push'),('Push Pull Legs Intermedio',2,'Pull'),('Push Pull Legs Intermedio',3,'Legs'),
      ('Torso Pierna Hipertrofia',1,'Torso A'),('Torso Pierna Hipertrofia',2,'Pierna A'),('Torso Pierna Hipertrofia',3,'Torso B'),('Torso Pierna Hipertrofia',4,'Pierna B'),
      ('Fuerza 5x5 Adaptada',1,'Sentadilla'),('Fuerza 5x5 Adaptada',2,'Press'),('Fuerza 5x5 Adaptada',3,'Peso muerto'),
      ('Gluteos y Piernas Intermedio',1,'Gluteos'),('Gluteos y Piernas Intermedio',2,'Cuadriceps'),('Gluteos y Piernas Intermedio',3,'Femoral'),('Gluteos y Piernas Intermedio',4,'Mixto'),
      ('Upper Lower Mantenimiento',1,'Upper'),('Upper Lower Mantenimiento',2,'Lower'),('Upper Lower Mantenimiento',3,'Upper 2'),('Upper Lower Mantenimiento',4,'Lower 2'),
      ('Full Body Intermedio',1,'Full A'),('Full Body Intermedio',2,'Full B'),('Full Body Intermedio',3,'Full C'),
      ('PPL Avanzado',1,'Push pesado'),('PPL Avanzado',2,'Pull pesado'),('PPL Avanzado',3,'Legs pesado'),('PPL Avanzado',4,'Push volumen'),('PPL Avanzado',5,'Pull volumen'),
      ('Fuerza Avanzada',1,'Squat focus'),('Fuerza Avanzada',2,'Bench focus'),('Fuerza Avanzada',3,'Deadlift focus'),('Fuerza Avanzada',4,'Overhead focus'),
      ('Especializacion Piernas',1,'Cuadriceps'),('Especializacion Piernas',2,'Gluteos'),('Especializacion Piernas',3,'Femoral'),('Especializacion Piernas',4,'Pierna completa'),
      ('Torso Avanzado',1,'Pecho'),('Torso Avanzado',2,'Espalda'),('Torso Avanzado',3,'Hombros'),('Torso Avanzado',4,'Brazos')
  ) as days(routine_name, day_order, day_name);

  insert into _g28_routine_items_seed (routine_name, day_order, row_order, exercise_name, series, repetitions, rir, rest)
  select routine_name, day_order, row_order, exercise_name, series, repetitions, rir, rest
  from (
    values
      ('Full Body Inicial',1,1,'Sentadilla goblet',3,'10-12',2,'90s'),('Full Body Inicial',1,2,'Press en maquina pecho',3,'10-12',2,'90s'),('Full Body Inicial',1,3,'Jalon al pecho',3,'10-12',2,'90s'),('Full Body Inicial',1,4,'Peso muerto rumano',2,'10-12',3,'90s'),('Full Body Inicial',1,5,'Plancha frontal',3,'30s',2,'60s'),
      ('Full Body Inicial',2,1,'Prensa 45',3,'10-15',2,'90s'),('Full Body Inicial',2,2,'Press hombros sentado',3,'10-12',2,'90s'),('Full Body Inicial',2,3,'Remo sentado en polea',3,'10-12',2,'90s'),('Full Body Inicial',2,4,'Curl alterno mancuernas',2,'12-15',2,'60s'),('Full Body Inicial',2,5,'Extension triceps polea',2,'12-15',2,'60s'),
      ('Full Body Inicial',3,1,'Zancadas caminando',3,'10 c/lado',2,'90s'),('Full Body Inicial',3,2,'Flexiones de brazos',3,'8-15',2,'90s'),('Full Body Inicial',3,3,'Remo con mancuerna',3,'10-12',2,'90s'),('Full Body Inicial',3,4,'Elevaciones laterales',2,'12-15',2,'60s'),('Full Body Inicial',3,5,'Crunch abdominal',3,'15-20',2,'60s'),
      ('Torso Pierna Base',1,1,'Press banca plano',3,'8-10',2,'120s'),('Torso Pierna Base',1,2,'Jalon al pecho',3,'10-12',2,'90s'),('Torso Pierna Base',1,3,'Press hombros sentado',3,'10-12',2,'90s'),('Torso Pierna Base',1,4,'Remo sentado en polea',3,'10-12',2,'90s'),('Torso Pierna Base',1,5,'Extension triceps polea',2,'12-15',2,'60s'),
      ('Torso Pierna Base',2,1,'Sentadilla trasera',3,'8-10',2,'120s'),('Torso Pierna Base',2,2,'Peso muerto rumano',3,'8-10',2,'120s'),('Torso Pierna Base',2,3,'Extension de cuadriceps',3,'12-15',2,'75s'),('Torso Pierna Base',2,4,'Curl femoral acostado',3,'12-15',2,'75s'),('Torso Pierna Base',2,5,'Gemelos de pie',3,'12-20',2,'60s'),
      ('Torso Pierna Base',3,1,'Press banca inclinado',3,'8-12',2,'90s'),('Torso Pierna Base',3,2,'Remo con mancuerna',3,'8-12',2,'90s'),('Torso Pierna Base',3,3,'Elevaciones laterales',3,'12-15',2,'60s'),('Torso Pierna Base',3,4,'Curl barra recta',2,'10-12',2,'60s'),('Torso Pierna Base',3,5,'Face pull',2,'15-20',2,'60s'),
      ('Torso Pierna Base',4,1,'Prensa 45',3,'10-12',2,'90s'),('Torso Pierna Base',4,2,'Hip thrust',3,'10-12',2,'90s'),('Torso Pierna Base',4,3,'Zancadas caminando',3,'12 c/lado',2,'90s'),('Torso Pierna Base',4,4,'Abduccion de cadera',3,'15-20',2,'60s'),('Torso Pierna Base',4,5,'Plancha frontal',3,'40s',2,'60s'),
      ('Fuerza Principiante',1,1,'Sentadilla trasera',5,'5',2,'150s'),('Fuerza Principiante',1,2,'Press banca plano',5,'5',2,'150s'),('Fuerza Principiante',1,3,'Remo con barra',4,'6',2,'120s'),('Fuerza Principiante',1,4,'Plancha frontal',3,'30-45s',2,'60s'),
      ('Fuerza Principiante',2,1,'Peso muerto convencional',4,'5',2,'180s'),('Fuerza Principiante',2,2,'Press militar de pie',4,'6',2,'120s'),('Fuerza Principiante',2,3,'Jalon al pecho',3,'8-10',2,'90s'),('Fuerza Principiante',2,4,'Pallof press',3,'12 c/lado',2,'60s'),
      ('Fuerza Principiante',3,1,'Prensa 45',4,'6-8',2,'150s'),('Fuerza Principiante',3,2,'Press banca inclinado',4,'6-8',2,'120s'),('Fuerza Principiante',3,3,'Remo sentado en polea',4,'8',2,'90s'),('Fuerza Principiante',3,4,'Elevacion de piernas',3,'10-15',2,'60s'),
      ('Hipertrofia Inicial',1,1,'Press banca inclinado',3,'10-12',2,'90s'),('Hipertrofia Inicial',1,2,'Jalon al pecho',3,'10-12',2,'90s'),('Hipertrofia Inicial',1,3,'Aperturas con mancuernas',3,'12-15',2,'60s'),('Hipertrofia Inicial',1,4,'Remo sentado en polea',3,'12-15',2,'60s'),('Hipertrofia Inicial',1,5,'Elevaciones laterales',3,'15',2,'60s'),
      ('Hipertrofia Inicial',2,1,'Prensa 45',4,'10-12',2,'90s'),('Hipertrofia Inicial',2,2,'Peso muerto rumano',3,'10-12',2,'90s'),('Hipertrofia Inicial',2,3,'Extension de cuadriceps',3,'12-15',2,'75s'),('Hipertrofia Inicial',2,4,'Curl femoral acostado',3,'12-15',2,'75s'),('Hipertrofia Inicial',2,5,'Gemelos de pie',4,'15-20',2,'60s'),
      ('Hipertrofia Inicial',3,1,'Sentadilla goblet',3,'12',2,'90s'),('Hipertrofia Inicial',3,2,'Press en maquina pecho',3,'12',2,'90s'),('Hipertrofia Inicial',3,3,'Remo con mancuerna',3,'12',2,'90s'),('Hipertrofia Inicial',3,4,'Curl martillo',2,'12-15',2,'60s'),('Hipertrofia Inicial',3,5,'Extension triceps mancuerna',2,'12-15',2,'60s'),
      ('Mantenimiento Activo',1,1,'Sentadilla goblet',3,'12',3,'75s'),('Mantenimiento Activo',1,2,'Flexiones de brazos',3,'10-15',3,'75s'),('Mantenimiento Activo',1,3,'Remo con mancuerna',3,'12',3,'75s'),('Mantenimiento Activo',1,4,'Mountain climbers',3,'30s',3,'45s'),
      ('Mantenimiento Activo',2,1,'Prensa 45',3,'12',3,'75s'),('Mantenimiento Activo',2,2,'Jalon al pecho',3,'12',3,'75s'),('Mantenimiento Activo',2,3,'Press hombros sentado',3,'12',3,'75s'),('Mantenimiento Activo',2,4,'Russian twist',3,'20',3,'45s'),
      ('Mantenimiento Activo',3,1,'Step up con mancuernas',3,'10 c/lado',3,'75s'),('Mantenimiento Activo',3,2,'Dominadas supinas',3,'6-10',3,'90s'),('Mantenimiento Activo',3,3,'Elevaciones laterales',2,'15',3,'60s'),('Mantenimiento Activo',3,4,'Farmer walk',3,'30m',3,'60s'),
      ('Push Pull Legs Intermedio',1,1,'Press banca plano',4,'6-10',1,'120s'),('Push Pull Legs Intermedio',1,2,'Press militar de pie',3,'6-10',2,'120s'),('Push Pull Legs Intermedio',1,3,'Press banca inclinado',3,'8-12',2,'90s'),('Push Pull Legs Intermedio',1,4,'Elevaciones laterales',4,'12-20',1,'60s'),('Push Pull Legs Intermedio',1,5,'Extension triceps polea',3,'10-15',1,'60s'),
      ('Push Pull Legs Intermedio',2,1,'Dominadas pronas',4,'6-10',1,'120s'),('Push Pull Legs Intermedio',2,2,'Remo con barra',4,'6-10',1,'120s'),('Push Pull Legs Intermedio',2,3,'Remo sentado en polea',3,'10-12',2,'90s'),('Push Pull Legs Intermedio',2,4,'Face pull',3,'15-20',1,'60s'),('Push Pull Legs Intermedio',2,5,'Curl barra recta',3,'10-12',1,'60s'),
      ('Push Pull Legs Intermedio',3,1,'Sentadilla trasera',4,'6-10',1,'150s'),('Push Pull Legs Intermedio',3,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Push Pull Legs Intermedio',3,3,'Prensa 45',3,'10-15',1,'90s'),('Push Pull Legs Intermedio',3,4,'Curl femoral acostado',3,'12-15',1,'75s'),('Push Pull Legs Intermedio',3,5,'Gemelos de pie',4,'12-20',1,'60s'),
      ('Torso Pierna Hipertrofia',1,1,'Press banca plano',4,'8',1,'120s'),('Torso Pierna Hipertrofia',1,2,'Remo con barra',4,'8',1,'120s'),('Torso Pierna Hipertrofia',1,3,'Press hombros sentado',3,'10',2,'90s'),('Torso Pierna Hipertrofia',1,4,'Jalon al pecho',3,'10-12',2,'90s'),('Torso Pierna Hipertrofia',1,5,'Curl martillo',3,'12',1,'60s'),
      ('Torso Pierna Hipertrofia',2,1,'Sentadilla trasera',4,'8',1,'120s'),('Torso Pierna Hipertrofia',2,2,'Hip thrust',4,'10',1,'120s'),('Torso Pierna Hipertrofia',2,3,'Extension de cuadriceps',3,'12-15',1,'75s'),('Torso Pierna Hipertrofia',2,4,'Curl femoral acostado',3,'12-15',1,'75s'),('Torso Pierna Hipertrofia',2,5,'Abduccion de cadera',3,'15-20',1,'60s'),
      ('Torso Pierna Hipertrofia',3,1,'Press banca inclinado',4,'10',1,'90s'),('Torso Pierna Hipertrofia',3,2,'Remo con mancuerna',4,'10 c/lado',1,'90s'),('Torso Pierna Hipertrofia',3,3,'Cruce de poleas',3,'12-15',1,'60s'),('Torso Pierna Hipertrofia',3,4,'Elevaciones laterales',4,'15-20',1,'60s'),('Torso Pierna Hipertrofia',3,5,'Rompecraneos barra z',3,'10-12',1,'60s'),
      ('Torso Pierna Hipertrofia',4,1,'Prensa 45',4,'12',1,'90s'),('Torso Pierna Hipertrofia',4,2,'Peso muerto rumano',4,'10',1,'120s'),('Torso Pierna Hipertrofia',4,3,'Zancadas caminando',3,'12 c/lado',1,'90s'),('Torso Pierna Hipertrofia',4,4,'Gemelos de pie',4,'15-20',1,'60s'),('Torso Pierna Hipertrofia',4,5,'Elevacion de piernas',3,'12-20',1,'60s'),
      ('Fuerza 5x5 Adaptada',1,1,'Sentadilla trasera',5,'5',1,'180s'),('Fuerza 5x5 Adaptada',1,2,'Press banca plano',5,'5',1,'180s'),('Fuerza 5x5 Adaptada',1,3,'Remo con barra',5,'5',1,'150s'),('Fuerza 5x5 Adaptada',1,4,'Plancha frontal',3,'45s',2,'60s'),
      ('Fuerza 5x5 Adaptada',2,1,'Sentadilla frontal',4,'5',1,'180s'),('Fuerza 5x5 Adaptada',2,2,'Press militar de pie',5,'5',1,'150s'),('Fuerza 5x5 Adaptada',2,3,'Dominadas pronas',4,'6-8',1,'120s'),('Fuerza 5x5 Adaptada',2,4,'Pallof press',3,'12',2,'60s'),
      ('Fuerza 5x5 Adaptada',3,1,'Peso muerto convencional',5,'3',1,'210s'),('Fuerza 5x5 Adaptada',3,2,'Press banca inclinado',4,'6',1,'150s'),('Fuerza 5x5 Adaptada',3,3,'Remo sentado en polea',4,'8',1,'120s'),('Fuerza 5x5 Adaptada',3,4,'Farmer walk',4,'30m',2,'90s'),
      ('Gluteos y Piernas Intermedio',1,1,'Hip thrust',5,'8-10',1,'120s'),('Gluteos y Piernas Intermedio',1,2,'Peso muerto rumano',4,'8-10',1,'120s'),('Gluteos y Piernas Intermedio',1,3,'Abduccion de cadera',4,'15-20',1,'60s'),('Gluteos y Piernas Intermedio',1,4,'Zancadas caminando',3,'12 c/lado',2,'90s'),
      ('Gluteos y Piernas Intermedio',2,1,'Sentadilla frontal',4,'8-10',1,'120s'),('Gluteos y Piernas Intermedio',2,2,'Prensa 45',4,'10-12',1,'90s'),('Gluteos y Piernas Intermedio',2,3,'Extension de cuadriceps',4,'12-15',1,'75s'),('Gluteos y Piernas Intermedio',2,4,'Gemelos de pie',4,'15-20',1,'60s'),
      ('Gluteos y Piernas Intermedio',3,1,'Peso muerto rumano',4,'8-12',1,'120s'),('Gluteos y Piernas Intermedio',3,2,'Curl femoral acostado',4,'10-15',1,'75s'),('Gluteos y Piernas Intermedio',3,3,'Step up con mancuernas',3,'10 c/lado',2,'90s'),('Gluteos y Piernas Intermedio',3,4,'Plancha frontal',3,'45s',2,'60s'),
      ('Gluteos y Piernas Intermedio',4,1,'Sentadilla trasera',4,'8',1,'120s'),('Gluteos y Piernas Intermedio',4,2,'Hip thrust',3,'12',1,'90s'),('Gluteos y Piernas Intermedio',4,3,'Prensa 45',3,'15',1,'90s'),('Gluteos y Piernas Intermedio',4,4,'Abduccion de cadera',3,'20',1,'60s'),
      ('Upper Lower Mantenimiento',1,1,'Press banca plano',3,'8-10',2,'90s'),('Upper Lower Mantenimiento',1,2,'Jalon al pecho',3,'10',2,'90s'),('Upper Lower Mantenimiento',1,3,'Press hombros sentado',3,'10',2,'90s'),('Upper Lower Mantenimiento',1,4,'Curl barra recta',2,'12',2,'60s'),
      ('Upper Lower Mantenimiento',2,1,'Sentadilla trasera',3,'8-10',2,'120s'),('Upper Lower Mantenimiento',2,2,'Peso muerto rumano',3,'10',2,'90s'),('Upper Lower Mantenimiento',2,3,'Extension de cuadriceps',2,'15',2,'60s'),('Upper Lower Mantenimiento',2,4,'Gemelos de pie',3,'15',2,'60s'),
      ('Upper Lower Mantenimiento',3,1,'Press banca inclinado',3,'10',2,'90s'),('Upper Lower Mantenimiento',3,2,'Remo con mancuerna',3,'10',2,'90s'),('Upper Lower Mantenimiento',3,3,'Elevaciones laterales',3,'15',2,'60s'),('Upper Lower Mantenimiento',3,4,'Extension triceps polea',2,'12',2,'60s'),
      ('Upper Lower Mantenimiento',4,1,'Prensa 45',3,'12',2,'90s'),('Upper Lower Mantenimiento',4,2,'Hip thrust',3,'10',2,'90s'),('Upper Lower Mantenimiento',4,3,'Curl femoral acostado',2,'15',2,'60s'),('Upper Lower Mantenimiento',4,4,'Crunch abdominal',3,'20',2,'45s'),
      ('Full Body Intermedio',1,1,'Sentadilla trasera',4,'8',2,'120s'),('Full Body Intermedio',1,2,'Press banca plano',4,'8',2,'120s'),('Full Body Intermedio',1,3,'Remo con barra',4,'8',2,'120s'),('Full Body Intermedio',1,4,'Elevaciones laterales',3,'15',2,'60s'),
      ('Full Body Intermedio',2,1,'Peso muerto convencional',4,'5',2,'180s'),('Full Body Intermedio',2,2,'Press militar de pie',4,'8',2,'120s'),('Full Body Intermedio',2,3,'Jalon al pecho',4,'10',2,'90s'),('Full Body Intermedio',2,4,'Zancadas caminando',3,'12',2,'90s'),
      ('Full Body Intermedio',3,1,'Prensa 45',4,'10',2,'90s'),('Full Body Intermedio',3,2,'Press banca inclinado',4,'10',2,'90s'),('Full Body Intermedio',3,3,'Remo sentado en polea',4,'10',2,'90s'),('Full Body Intermedio',3,4,'Rueda abdominal',3,'8-12',2,'60s'),
      ('PPL Avanzado',1,1,'Press banca plano',5,'5',1,'180s'),('PPL Avanzado',1,2,'Press militar de pie',4,'6',1,'150s'),('PPL Avanzado',1,3,'Fondos en paralelas',4,'8-12',1,'90s'),('PPL Avanzado',1,4,'Cruce de poleas',4,'12-15',1,'60s'),('PPL Avanzado',1,5,'Rompecraneos barra z',4,'10',1,'60s'),
      ('PPL Avanzado',2,1,'Dominadas pronas',5,'6-8',1,'150s'),('PPL Avanzado',2,2,'Remo con barra',5,'6-8',1,'150s'),('PPL Avanzado',2,3,'Peso muerto convencional',3,'5',1,'180s'),('PPL Avanzado',2,4,'Face pull',4,'15-20',1,'60s'),('PPL Avanzado',2,5,'Curl barra recta',4,'8-12',1,'60s'),
      ('PPL Avanzado',3,1,'Sentadilla trasera',5,'5',1,'180s'),('PPL Avanzado',3,2,'Prensa 45',4,'10',1,'120s'),('PPL Avanzado',3,3,'Peso muerto rumano',4,'8',1,'120s'),('PPL Avanzado',3,4,'Extension de cuadriceps',4,'12-15',1,'75s'),('PPL Avanzado',3,5,'Curl femoral acostado',4,'12-15',1,'75s'),
      ('PPL Avanzado',4,1,'Press banca inclinado',4,'8-10',1,'120s'),('PPL Avanzado',4,2,'Press Arnold',4,'10',1,'90s'),('PPL Avanzado',4,3,'Aperturas con mancuernas',4,'12-15',1,'60s'),('PPL Avanzado',4,4,'Elevaciones laterales',5,'15-20',1,'60s'),('PPL Avanzado',4,5,'Extension cuerda sobre cabeza',4,'12-15',1,'60s'),
      ('PPL Avanzado',5,1,'Jalon al pecho',4,'10-12',1,'90s'),('PPL Avanzado',5,2,'Remo con mancuerna',4,'10',1,'90s'),('PPL Avanzado',5,3,'Pullover en polea',4,'12-15',1,'60s'),('PPL Avanzado',5,4,'Pajaros posteriores',4,'15-20',1,'60s'),('PPL Avanzado',5,5,'Curl inclinado',4,'10-12',1,'60s'),
      ('Fuerza Avanzada',1,1,'Sentadilla trasera',5,'3',1,'210s'),('Fuerza Avanzada',1,2,'Sentadilla frontal',4,'5',1,'180s'),('Fuerza Avanzada',1,3,'Prensa 45',4,'8',1,'120s'),('Fuerza Avanzada',1,4,'Plancha frontal',4,'60s',1,'60s'),
      ('Fuerza Avanzada',2,1,'Press banca plano',5,'3',1,'210s'),('Fuerza Avanzada',2,2,'Press cerrado',4,'5',1,'150s'),('Fuerza Avanzada',2,3,'Remo con barra',4,'6',1,'150s'),('Fuerza Avanzada',2,4,'Extension triceps polea',3,'12',1,'60s'),
      ('Fuerza Avanzada',3,1,'Peso muerto convencional',5,'3',1,'240s'),('Fuerza Avanzada',3,2,'Peso muerto rumano',4,'6',1,'180s'),('Fuerza Avanzada',3,3,'Dominadas pronas',4,'6-8',1,'120s'),('Fuerza Avanzada',3,4,'Farmer walk',4,'40m',1,'90s'),
      ('Fuerza Avanzada',4,1,'Press militar de pie',5,'3-5',1,'180s'),('Fuerza Avanzada',4,2,'Press banca inclinado',4,'6',1,'150s'),('Fuerza Avanzada',4,3,'Face pull',4,'15',1,'60s'),('Fuerza Avanzada',4,4,'Rueda abdominal',4,'8-12',1,'60s'),
      ('Especializacion Piernas',1,1,'Sentadilla frontal',5,'6-8',1,'150s'),('Especializacion Piernas',1,2,'Prensa 45',5,'10-12',1,'120s'),('Especializacion Piernas',1,3,'Extension de cuadriceps',5,'12-15',1,'75s'),('Especializacion Piernas',1,4,'Zancadas caminando',4,'12 c/lado',1,'90s'),
      ('Especializacion Piernas',2,1,'Hip thrust',5,'8-10',1,'150s'),('Especializacion Piernas',2,2,'Sentadilla trasera',4,'8',1,'150s'),('Especializacion Piernas',2,3,'Abduccion de cadera',5,'15-25',1,'60s'),('Especializacion Piernas',2,4,'Step up con mancuernas',4,'10 c/lado',1,'90s'),
      ('Especializacion Piernas',3,1,'Peso muerto rumano',5,'8',1,'150s'),('Especializacion Piernas',3,2,'Curl femoral acostado',5,'10-15',1,'75s'),('Especializacion Piernas',3,3,'Gemelos de pie',5,'15-20',1,'60s'),('Especializacion Piernas',3,4,'Plancha frontal',4,'60s',1,'60s'),
      ('Especializacion Piernas',4,1,'Sentadilla trasera',4,'10',1,'150s'),('Especializacion Piernas',4,2,'Hip thrust',4,'12',1,'120s'),('Especializacion Piernas',4,3,'Prensa 45',4,'15',1,'90s'),('Especializacion Piernas',4,4,'Curl femoral acostado',4,'15',1,'75s'),
      ('Torso Avanzado',1,1,'Press banca plano',5,'5-8',1,'150s'),('Torso Avanzado',1,2,'Press banca inclinado',4,'8-10',1,'120s'),('Torso Avanzado',1,3,'Fondos en paralelas',4,'8-12',1,'90s'),('Torso Avanzado',1,4,'Cruce de poleas',4,'15',1,'60s'),
      ('Torso Avanzado',2,1,'Dominadas pronas',5,'6-10',1,'150s'),('Torso Avanzado',2,2,'Remo con barra',5,'6-10',1,'150s'),('Torso Avanzado',2,3,'Remo sentado en polea',4,'10-12',1,'90s'),('Torso Avanzado',2,4,'Pullover en polea',4,'12-15',1,'60s'),
      ('Torso Avanzado',3,1,'Press militar de pie',5,'5-8',1,'150s'),('Torso Avanzado',3,2,'Press Arnold',4,'8-10',1,'90s'),('Torso Avanzado',3,3,'Elevaciones laterales',5,'15-20',1,'60s'),('Torso Avanzado',3,4,'Pajaros posteriores',4,'15-20',1,'60s'),
      ('Torso Avanzado',4,1,'Curl barra recta',4,'8-10',1,'60s'),('Torso Avanzado',4,2,'Curl inclinado',4,'10-12',1,'60s'),('Torso Avanzado',4,3,'Press cerrado',4,'6-10',1,'90s'),('Torso Avanzado',4,4,'Extension cuerda sobre cabeza',4,'12-15',1,'60s')
  ) as items(routine_name, day_order, row_order, exercise_name, series, repetitions, rir, rest);

  delete from public.routine_days days
  using public.routine_templates templates
  where days.routine_id = templates.id
    and templates.name in (select distinct routine_name from _g28_routine_days_seed);

  insert into public.routine_days (routine_id, day_order, day_name)
  select templates.id, days.day_order, days.day_name
  from _g28_routine_days_seed days
  join public.routine_templates templates on lower(templates.name) = lower(days.routine_name);

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
  from _g28_routine_items_seed items
  join public.routine_templates templates on lower(templates.name) = lower(items.routine_name)
  join public.routine_days days on days.routine_id = templates.id and days.day_order = items.day_order
  join lateral (
    select id
    from public.exercises
    where lower(name) = lower(items.exercise_name)
    order by created_at asc, id asc
    limit 1
  ) exercises on true;
end $$;
