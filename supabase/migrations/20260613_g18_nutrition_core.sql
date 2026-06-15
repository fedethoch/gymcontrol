create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  category text not null check (category in ('protein', 'carb', 'fat', 'vegetable', 'mixed')),
  serving_g integer not null default 100 check (serving_g > 0),
  calories integer not null check (calories >= 0),
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  gender text not null check (gender in ('male', 'female')),
  age integer not null check (age > 0),
  height_cm numeric not null check (height_cm > 0),
  weight_kg numeric not null check (weight_kg > 0),
  body_fat_pct numeric check (body_fat_pct is null or (body_fat_pct > 0 and body_fat_pct < 100)),
  activity_level text not null check (activity_level in ('sedentary', 'light', 'moderate', 'high', 'very_high')),
  goal text not null check (goal in ('cut', 'recomposition', 'bulk')),
  bmr_kcal integer not null check (bmr_kcal >= 0),
  maintenance_kcal integer not null check (maintenance_kcal >= 0),
  target_kcal integer not null check (target_kcal >= 0),
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diet_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  meals_count integer not null check (meals_count > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diet_template_meals (
  id uuid primary key default gen_random_uuid(),
  diet_template_id uuid not null references public.diet_templates(id) on delete cascade,
  meal_order integer not null check (meal_order > 0),
  name text not null,
  description text,
  kcal_pct numeric not null check (kcal_pct > 0 and kcal_pct <= 1),
  created_at timestamptz not null default now(),
  unique (diet_template_id, meal_order)
);

create index foods_created_by_idx on public.foods (created_by);
create index foods_category_idx on public.foods (category);
create index diet_templates_created_by_idx on public.diet_templates (created_by);
create index diet_template_meals_diet_template_id_idx on public.diet_template_meals (diet_template_id);

create trigger set_foods_updated_at
before update on public.foods
for each row execute function public.set_updated_at();

create trigger set_nutrition_profiles_updated_at
before update on public.nutrition_profiles
for each row execute function public.set_updated_at();

create trigger set_diet_templates_updated_at
before update on public.diet_templates
for each row execute function public.set_updated_at();

alter table public.foods enable row level security;
alter table public.nutrition_profiles enable row level security;
alter table public.diet_templates enable row level security;
alter table public.diet_template_meals enable row level security;

revoke all on table public.foods from anon, authenticated;
revoke all on table public.nutrition_profiles from anon, authenticated;
revoke all on table public.diet_templates from anon, authenticated;
revoke all on table public.diet_template_meals from anon, authenticated;

grant select on table public.foods to anon, authenticated;
grant select on table public.diet_templates to anon, authenticated;
grant select on table public.diet_template_meals to anon, authenticated;

grant select, insert, update, delete on table public.foods to authenticated;
grant select, insert, update, delete on table public.diet_templates to authenticated;
grant select, insert, update, delete on table public.diet_template_meals to authenticated;
grant select, insert, update, delete on table public.nutrition_profiles to authenticated;

drop policy if exists "foods_select_public_catalog" on public.foods;
create policy "foods_select_public_catalog"
on public.foods
for select
to anon, authenticated
using (true);

drop policy if exists "foods_insert_admin_only" on public.foods;
create policy "foods_insert_admin_only"
on public.foods
for insert
to authenticated
with check (
  (select private.is_current_user_admin())
  and created_by = (select private.current_profile_id())
);

drop policy if exists "foods_update_admin_only" on public.foods;
create policy "foods_update_admin_only"
on public.foods
for update
to authenticated
using ((select private.is_current_user_admin()))
with check ((select private.is_current_user_admin()));

drop policy if exists "foods_delete_admin_only" on public.foods;
create policy "foods_delete_admin_only"
on public.foods
for delete
to authenticated
using ((select private.is_current_user_admin()));

drop policy if exists "diet_templates_select_public_catalog" on public.diet_templates;
create policy "diet_templates_select_public_catalog"
on public.diet_templates
for select
to anon, authenticated
using (true);

drop policy if exists "diet_templates_insert_admin_only" on public.diet_templates;
create policy "diet_templates_insert_admin_only"
on public.diet_templates
for insert
to authenticated
with check (
  (select private.is_current_user_admin())
  and created_by = (select private.current_profile_id())
);

drop policy if exists "diet_templates_update_admin_only" on public.diet_templates;
create policy "diet_templates_update_admin_only"
on public.diet_templates
for update
to authenticated
using ((select private.is_current_user_admin()))
with check ((select private.is_current_user_admin()));

drop policy if exists "diet_templates_delete_admin_only" on public.diet_templates;
create policy "diet_templates_delete_admin_only"
on public.diet_templates
for delete
to authenticated
using ((select private.is_current_user_admin()));

drop policy if exists "diet_template_meals_select_public_catalog" on public.diet_template_meals;
create policy "diet_template_meals_select_public_catalog"
on public.diet_template_meals
for select
to anon, authenticated
using (true);

drop policy if exists "diet_template_meals_insert_admin_only" on public.diet_template_meals;
create policy "diet_template_meals_insert_admin_only"
on public.diet_template_meals
for insert
to authenticated
with check ((select private.is_current_user_admin()));

drop policy if exists "diet_template_meals_update_admin_only" on public.diet_template_meals;
create policy "diet_template_meals_update_admin_only"
on public.diet_template_meals
for update
to authenticated
using ((select private.is_current_user_admin()))
with check ((select private.is_current_user_admin()));

drop policy if exists "diet_template_meals_delete_admin_only" on public.diet_template_meals;
create policy "diet_template_meals_delete_admin_only"
on public.diet_template_meals
for delete
to authenticated
using ((select private.is_current_user_admin()));

drop policy if exists "nutrition_profiles_select_owner_only" on public.nutrition_profiles;
create policy "nutrition_profiles_select_owner_only"
on public.nutrition_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "nutrition_profiles_insert_owner_only" on public.nutrition_profiles;
create policy "nutrition_profiles_insert_owner_only"
on public.nutrition_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "nutrition_profiles_update_owner_only" on public.nutrition_profiles;
create policy "nutrition_profiles_update_owner_only"
on public.nutrition_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "nutrition_profiles_delete_owner_only" on public.nutrition_profiles;
create policy "nutrition_profiles_delete_owner_only"
on public.nutrition_profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'food-images',
  'food-images',
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

drop policy if exists "food_images_select_public" on storage.objects;
create policy "food_images_select_public"
on storage.objects
for select
to public
using (bucket_id = 'food-images');

drop policy if exists "food_images_insert_admin_only" on storage.objects;
create policy "food_images_insert_admin_only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'food-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "food_images_update_admin_only" on storage.objects;
create policy "food_images_update_admin_only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'food-images'
  and (select private.is_current_user_admin())
)
with check (
  bucket_id = 'food-images'
  and (select private.is_current_user_admin())
);

drop policy if exists "food_images_delete_admin_only" on storage.objects;
create policy "food_images_delete_admin_only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'food-images'
  and (select private.is_current_user_admin())
);
