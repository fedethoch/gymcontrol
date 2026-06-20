alter table public.routine_templates
add column if not exists image_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'routine-images',
    'routine-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'recipe-images',
    'recipe-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "routine_images_select_public" on storage.objects;
create policy "routine_images_select_public"
on storage.objects
for select
to public
using (bucket_id = 'routine-images');

drop policy if exists "routine_images_insert_admin_only" on storage.objects;
create policy "routine_images_insert_admin_only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'routine-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "routine_images_update_admin_only" on storage.objects;
create policy "routine_images_update_admin_only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'routine-images'
  and (select private.is_current_user_admin())
)
with check (
  bucket_id = 'routine-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "routine_images_delete_admin_only" on storage.objects;
create policy "routine_images_delete_admin_only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'routine-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "recipe_images_select_public" on storage.objects;
create policy "recipe_images_select_public"
on storage.objects
for select
to public
using (bucket_id = 'recipe-images');

drop policy if exists "recipe_images_insert_admin_only" on storage.objects;
create policy "recipe_images_insert_admin_only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'recipe-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "recipe_images_update_admin_only" on storage.objects;
create policy "recipe_images_update_admin_only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'recipe-images'
  and (select private.is_current_user_admin())
)
with check (
  bucket_id = 'recipe-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "recipe_images_delete_admin_only" on storage.objects;
create policy "recipe_images_delete_admin_only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'recipe-images'
  and (select private.is_current_user_admin())
);
