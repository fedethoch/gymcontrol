-- Recetas: dos recetas del seed estaban como "comida" y por contenido son desayuno y snack
-- (DESIGN.md §18, RE-D7). Solo datos: las comidas registradas guardan su snapshot y no cambian.
update public.recipes
set category = 'desayuno'
where name = 'Avena con banana y maní' and created_by is null and category = 'comida';

update public.recipes
set category = 'snack'
where name = 'Yogur con almendras' and created_by is null and category = 'comida';
