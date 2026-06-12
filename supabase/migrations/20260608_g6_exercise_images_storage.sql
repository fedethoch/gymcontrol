insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'exercise-images',
  'exercise-images',
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

drop policy if exists "exercise_images_select_public" on storage.objects;
create policy "exercise_images_select_public"
on storage.objects
for select
to public
using (bucket_id = 'exercise-images');

drop policy if exists "exercise_images_insert_admin_only" on storage.objects;
create policy "exercise_images_insert_admin_only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'exercise-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "exercise_images_update_admin_only" on storage.objects;
create policy "exercise_images_update_admin_only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'exercise-images'
  and (select private.is_current_user_admin())
)
with check (
  bucket_id = 'exercise-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "exercise_images_delete_admin_only" on storage.objects;
create policy "exercise_images_delete_admin_only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'exercise-images'
  and (select private.is_current_user_admin())
);
