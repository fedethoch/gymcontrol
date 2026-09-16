-- Nutricion (expand): los alimentos dejan de tener imagen (DESIGN.md §13, AL-D6).
-- Default '' para que el codigo nuevo inserte sin `image_url`; el codigo anterior (la lee y escribe '')
-- sigue funcionando. El drop de la columna va en `20260916_nutrition_foods_image_contract`, con este
-- codigo ya en produccion.
alter table public.foods alter column image_url set default '';
