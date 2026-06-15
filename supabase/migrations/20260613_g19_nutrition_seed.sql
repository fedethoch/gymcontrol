with admin_profile as (
  select id from public.profiles where type_rol = 'admin' order by created_at asc limit 1
)
insert into public.foods (name, image_url, category, serving_g, calories, protein_g, carbs_g, fat_g, created_by)
select v.name, '', v.category, 100, v.calories, v.protein_g, v.carbs_g, v.fat_g, admin_profile.id
from admin_profile, (values
  ('Pechuga de pollo', 'protein', 165, 31, 0, 4),
  ('Carne vacuna magra', 'protein', 187, 26, 0, 9),
  ('Atún al natural', 'protein', 116, 26, 0, 1),
  ('Huevo entero', 'protein', 155, 13, 1, 11),
  ('Yogur griego descremado', 'protein', 59, 10, 4, 0),
  ('Arroz blanco cocido', 'carb', 130, 3, 28, 0),
  ('Avena', 'carb', 389, 17, 66, 7),
  ('Papa hervida', 'carb', 87, 2, 20, 0),
  ('Banana', 'carb', 89, 1, 23, 0),
  ('Pan integral', 'carb', 247, 13, 41, 4),
  ('Palta', 'fat', 160, 2, 9, 15),
  ('Almendras', 'fat', 579, 21, 22, 50),
  ('Aceite de oliva', 'fat', 884, 0, 0, 100),
  ('Manteca de maní', 'fat', 588, 25, 20, 50),
  ('Brócoli', 'vegetable', 34, 3, 7, 0),
  ('Espinaca', 'vegetable', 23, 3, 4, 0),
  ('Mix de ensalada', 'vegetable', 17, 2, 3, 0)
) as v(name, category, calories, protein_g, carbs_g, fat_g);

with admin_profile as (
  select id from public.profiles where type_rol = 'admin' order by created_at asc limit 1
), inserted_templates as (
  insert into public.diet_templates (name, description, meals_count, created_by)
  select v.name, v.description, v.meals_count, admin_profile.id
  from admin_profile, (values
    ('3 comidas al día', 'Distribución clásica: desayuno, almuerzo y cena, sin colaciones.', 3),
    ('4 comidas al día', 'Incluye una colación a media tarde para repartir mejor las calorías.', 4),
    ('5 comidas al día', 'Dos colaciones para mantener saciedad durante todo el día.', 5)
  ) as v(name, description, meals_count)
  returning id, name
)
insert into public.diet_template_meals (diet_template_id, meal_order, name, description, kcal_pct)
select t.id, m.meal_order, m.name, m.description, m.kcal_pct
from inserted_templates t
join (
  values
    ('3 comidas al día', 1, 'Desayuno', 'Aporte energético inicial, foco en carbohidratos y proteína.', 0.3),
    ('3 comidas al día', 2, 'Almuerzo', 'Comida principal, mayor aporte de proteína y vegetales.', 0.4),
    ('3 comidas al día', 3, 'Cena', 'Comida liviana, proteína y vegetales con menos carbohidratos.', 0.3),
    ('4 comidas al día', 1, 'Desayuno', 'Aporte energético inicial, foco en carbohidratos y proteína.', 0.25),
    ('4 comidas al día', 2, 'Almuerzo', 'Comida principal, mayor aporte de proteína y vegetales.', 0.35),
    ('4 comidas al día', 3, 'Colación', 'Snack liviano para sostener energía hasta la cena.', 0.1),
    ('4 comidas al día', 4, 'Cena', 'Comida liviana, proteína y vegetales con menos carbohidratos.', 0.3),
    ('5 comidas al día', 1, 'Desayuno', 'Aporte energético inicial, foco en carbohidratos y proteína.', 0.22),
    ('5 comidas al día', 2, 'Colación matutina', 'Snack liviano entre desayuno y almuerzo.', 0.1),
    ('5 comidas al día', 3, 'Almuerzo', 'Comida principal, mayor aporte de proteína y vegetales.', 0.3),
    ('5 comidas al día', 4, 'Colación tarde', 'Snack para sostener energía hasta la cena.', 0.1),
    ('5 comidas al día', 5, 'Cena', 'Comida liviana, proteína y vegetales con menos carbohidratos.', 0.28)
) as m(template_name, meal_order, name, description, kcal_pct)
on m.template_name = t.name;
