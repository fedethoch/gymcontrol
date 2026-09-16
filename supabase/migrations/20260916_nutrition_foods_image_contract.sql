-- Nutricion (contract): los alimentos no tienen imagen (DESIGN.md §13, AL-D6).
-- Aplicar solo con el codigo sin `image_url` ya en produccion (deploy 90d628d). Sin backup, por
-- decision del usuario. Los 203 objetos y el bucket `food-images` se borran por la Storage API:
-- `storage.protect_delete` bloquea el delete por SQL.
alter table public.foods drop column image_url;

drop policy if exists "food_images_select_public" on storage.objects;
drop policy if exists "food_images_insert_admin_only" on storage.objects;
drop policy if exists "food_images_update_admin_only" on storage.objects;
drop policy if exists "food_images_delete_admin_only" on storage.objects;
