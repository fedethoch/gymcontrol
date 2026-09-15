-- Versión remota 20260614161359. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.

with r1 as (
  insert into public.recipes (name, description, category, servings)
  values ('Bowl de pollo y arroz', 'Pechuga a la plancha con arroz blanco y brócoli al vapor.', 'protein', 1)
  returning id
), r2 as (
  insert into public.recipes (name, description, category, servings)
  values ('Avena con banana y maní', 'Avena cocida con banana en rodajas y manteca de maní.', 'carb', 1)
  returning id
), r3 as (
  insert into public.recipes (name, description, category, servings)
  values ('Tostadas con huevo y palta', 'Pan integral tostado con huevo revuelto y palta.', 'protein', 1)
  returning id
), r4 as (
  insert into public.recipes (name, description, category, servings)
  values ('Ensalada de atún', 'Mix de hojas verdes con atún al natural, aceite de oliva y espinaca.', 'protein', 1)
  returning id
), r5 as (
  insert into public.recipes (name, description, category, servings)
  values ('Yogur con almendras', 'Yogur griego descremado con almendras tostadas.', 'protein', 1)
  returning id
)
insert into public.recipe_items (recipe_id, food_id, grams)
select id, food_id, grams from (
  select (select id from r1) as id, 'c20a4263-816a-40b6-a78d-40a5cab26e7e'::uuid as food_id, 150 as grams
  union all select (select id from r1), '5c5776e8-10e8-49f3-a95d-e115d6f0b5aa'::uuid, 150
  union all select (select id from r1), '653a32f2-c4fa-458b-bdda-d992bfbcd71b'::uuid, 100

  union all select (select id from r2), 'f82d4e26-8884-481c-baaa-5f0016fe7f3d'::uuid, 60
  union all select (select id from r2), '98b9bf02-1ec1-4781-8c1a-320ef7d5252c'::uuid, 120
  union all select (select id from r2), '4d35080d-783f-493d-a109-23eb2064b6df'::uuid, 16

  union all select (select id from r3), '53648b5b-5f21-4ce1-9e6b-acb8d8d294c2'::uuid, 60
  union all select (select id from r3), '4355555c-a273-4980-ae73-057c00ef67b0'::uuid, 100
  union all select (select id from r3), '234352f6-3631-48fd-a2cc-7d6bef608861'::uuid, 75

  union all select (select id from r4), '5d8a4748-7786-47fa-8778-990ff0d39cfc'::uuid, 80
  union all select (select id from r4), '52a03376-44a7-48a8-b2d5-987367906cb8'::uuid, 80
  union all select (select id from r4), '9b598480-3b8c-4b44-87ff-cedc00bc1bf5'::uuid, 30
  union all select (select id from r4), 'dd13c039-b1da-4dc0-bff1-909f933eb579'::uuid, 10

  union all select (select id from r5), 'aa6b38ed-b94c-42f7-b6ac-510cf9f0e786'::uuid, 150
  union all select (select id from r5), '5a24909a-7d90-4cb7-9118-a2c56a7eba97'::uuid, 14
) t;
