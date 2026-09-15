-- Nutricion: alimentos privados por usuario, bebidas, recetas en el registro diario y objetivo manual.

-- 1) foods: owner_user_id null = catalogo global (admin); con valor = alimento privado del usuario
alter table public.foods
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

create index if not exists foods_owner_user_id_idx on public.foods (owner_user_id);

alter table public.foods drop constraint if exists foods_category_check;
alter table public.foods add constraint foods_category_check
  check (category in ('protein', 'carb', 'fat', 'vegetable', 'mixed', 'drink'));

drop policy if exists foods_select_public_catalog on public.foods;
drop policy if exists foods_insert_admin_only on public.foods;
drop policy if exists foods_update_admin_only on public.foods;
drop policy if exists foods_delete_admin_only on public.foods;

create policy foods_select_catalog_anon on public.foods
  for select to anon
  using (owner_user_id is null);

create policy foods_select_catalog_or_own on public.foods
  for select to authenticated
  using (owner_user_id is null or owner_user_id = (select auth.uid()));

create policy foods_insert_catalog_admin_or_own on public.foods
  for insert to authenticated
  with check (
    created_by = (select private.current_profile_id())
    and (
      (owner_user_id is null and (select private.is_current_user_admin()))
      or owner_user_id = (select auth.uid())
    )
  );

create policy foods_update_catalog_admin_or_own on public.foods
  for update to authenticated
  using ((owner_user_id is null and (select private.is_current_user_admin())) or owner_user_id = (select auth.uid()))
  with check ((owner_user_id is null and (select private.is_current_user_admin())) or owner_user_id = (select auth.uid()));

create policy foods_delete_catalog_admin_or_own on public.foods
  for delete to authenticated
  using ((owner_user_id is null and (select private.is_current_user_admin())) or owner_user_id = (select auth.uid()));

-- 2) meal_log_items: un item es un alimento (gramos/unidades) o una receta (porciones)
alter table public.meal_log_items
  add column if not exists recipe_id uuid references public.recipes(id) on delete restrict;

alter table public.meal_log_items alter column food_id drop not null;

alter table public.meal_log_items drop constraint if exists meal_log_items_food_or_recipe_check;
alter table public.meal_log_items add constraint meal_log_items_food_or_recipe_check
  check ((food_id is null) <> (recipe_id is null));

create index if not exists meal_log_items_recipe_id_idx on public.meal_log_items (recipe_id);

-- 3) nutrition_profiles: objetivo calculado (auto) o fijado a mano (manual)
alter table public.nutrition_profiles
  add column if not exists target_mode text not null default 'auto';

alter table public.nutrition_profiles drop constraint if exists nutrition_profiles_target_mode_check;
alter table public.nutrition_profiles add constraint nutrition_profiles_target_mode_check
  check (target_mode in ('auto', 'manual'));
