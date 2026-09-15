-- Macros de alimentos con un decimal (antes integer: 0.4 g de grasa quedaba en 0).
alter table public.foods
  alter column protein_g type numeric(6,1),
  alter column carbs_g type numeric(6,1),
  alter column fat_g type numeric(6,1);
