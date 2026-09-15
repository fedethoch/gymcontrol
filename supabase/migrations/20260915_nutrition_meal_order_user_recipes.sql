-- Nutricion: orden manual de comidas, recetas creadas por usuarios, porcion en gramos y
-- macros congelados al registrar una receta. Expand puro: el codigo anterior sigue funcionando.

-- 1) recipes: porcion en gramos, peso final opcional y archivado
alter table public.recipes
  add column if not exists serving_g numeric(7,1),
  add column if not exists total_weight_g numeric(8,1),
  add column if not exists archived_at timestamptz;

alter table public.recipes drop constraint if exists recipes_serving_g_check;
alter table public.recipes add constraint recipes_serving_g_check check (serving_g is null or serving_g > 0);

alter table public.recipes drop constraint if exists recipes_total_weight_g_check;
alter table public.recipes add constraint recipes_total_weight_g_check check (total_weight_g is null or total_weight_g > 0);

create index if not exists recipes_created_by_idx on public.recipes (created_by);

-- Porcion = suma de ingredientes / porciones: los gramos ya registrados quedan identicos.
update public.recipes r
set serving_g = greatest(0.1, round(t.total_grams / greatest(1, r.servings), 1))
from (
  select recipe_id, sum(grams) as total_grams
  from public.recipe_items
  group by recipe_id
) t
where t.recipe_id = r.id
  and r.serving_g is null;

-- 2) meal_log_items: valores por gramo de la receta al momento de registrarla
alter table public.meal_log_items
  add column if not exists recipe_snapshot jsonb;

with totals as (
  select
    r.id,
    r.serving_g,
    coalesce(r.total_weight_g, sum(ri.grams)) as base_grams,
    sum(f.calories * ri.grams / f.serving_g) as kcal,
    sum(f.protein_g * ri.grams / f.serving_g) as protein_g,
    sum(f.carbs_g * ri.grams / f.serving_g) as carbs_g,
    sum(f.fat_g * ri.grams / f.serving_g) as fat_g
  from public.recipes r
  join public.recipe_items ri on ri.recipe_id = r.id
  join public.foods f on f.id = ri.food_id and f.serving_g > 0
  group by r.id
)
update public.meal_log_items mli
set recipe_snapshot = jsonb_build_object(
  'servingG', t.serving_g,
  'kcalPerG', t.kcal / t.base_grams,
  'proteinPerG', t.protein_g / t.base_grams,
  'carbsPerG', t.carbs_g / t.base_grams,
  'fatPerG', t.fat_g / t.base_grams
)
from totals t
where mli.recipe_id = t.id
  and mli.recipe_snapshot is null
  and t.base_grams > 0;

-- 3) RLS: lectura publica; cualquier usuario crea; creador o admin editan; solo admin borra
drop policy if exists recipes_admin_write on public.recipes;
drop policy if exists recipe_items_admin_write on public.recipe_items;

create policy recipes_insert_own on public.recipes
  for insert to authenticated
  with check (created_by = (select private.current_profile_id()));

create policy recipes_update_owner_or_admin on public.recipes
  for update to authenticated
  using (created_by = (select private.current_profile_id()) or (select private.is_current_user_admin()))
  with check (created_by = (select private.current_profile_id()) or (select private.is_current_user_admin()));

create policy recipes_delete_admin on public.recipes
  for delete to authenticated
  using ((select private.is_current_user_admin()));

create policy recipe_items_insert_owner_or_admin on public.recipe_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and (r.created_by = (select private.current_profile_id()) or (select private.is_current_user_admin()))
    )
    and exists (select 1 from public.foods f where f.id = recipe_items.food_id and f.owner_user_id is null)
  );

create policy recipe_items_update_owner_or_admin on public.recipe_items
  for update to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and (r.created_by = (select private.current_profile_id()) or (select private.is_current_user_admin()))
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and (r.created_by = (select private.current_profile_id()) or (select private.is_current_user_admin()))
    )
    and exists (select 1 from public.foods f where f.id = recipe_items.food_id and f.owner_user_id is null)
  );

create policy recipe_items_delete_owner_or_admin on public.recipe_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and (r.created_by = (select private.current_profile_id()) or (select private.is_current_user_admin()))
    )
  );

-- 4) Guardado atomico de recetas (security invoker: aplican las policies de arriba)
create or replace function public.save_recipe(
  p_recipe_id uuid,
  p_name text,
  p_description text,
  p_category text,
  p_serving_g numeric,
  p_total_weight_g numeric,
  p_items jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_recipe_id uuid := p_recipe_id;
  v_profile_id uuid := (select private.current_profile_id());
  v_raw_grams numeric;
begin
  if v_profile_id is null then
    raise exception 'Iniciá sesión para guardar recetas.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Agregá al menos un ingrediente.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) e
    left join public.foods f on f.id = nullif(e->>'food_id', '')::uuid
    where f.id is null
      or f.owner_user_id is not null
      or coalesce((e->>'grams')::numeric, 0) <= 0
  ) then
    raise exception 'Los ingredientes tienen que ser alimentos del catálogo con gramos mayores a 0.' using errcode = '22023';
  end if;

  select sum((e->>'grams')::numeric) into v_raw_grams from jsonb_array_elements(p_items) e;

  if p_serving_g is null or p_serving_g <= 0 then
    raise exception 'Indicá cuántos gramos tiene una porción.' using errcode = '22023';
  end if;

  if p_total_weight_g is not null and p_total_weight_g <= 0 then
    raise exception 'El peso final tiene que ser mayor a 0.' using errcode = '22023';
  end if;

  if p_serving_g > coalesce(p_total_weight_g, v_raw_grams) then
    raise exception 'La porción no puede pesar más que la receta completa.' using errcode = '22023';
  end if;

  if v_recipe_id is null then
    insert into public.recipes (name, description, image_url, category, servings, serving_g, total_weight_g, created_by)
    values (
      p_name,
      nullif(p_description, ''),
      '',
      p_category,
      greatest(1, round(coalesce(p_total_weight_g, v_raw_grams) / p_serving_g)::integer),
      p_serving_g,
      p_total_weight_g,
      v_profile_id
    )
    returning id into v_recipe_id;
  else
    update public.recipes
    set name = p_name,
        description = nullif(p_description, ''),
        category = p_category,
        servings = greatest(1, round(coalesce(p_total_weight_g, v_raw_grams) / p_serving_g)::integer),
        serving_g = p_serving_g,
        total_weight_g = p_total_weight_g,
        updated_at = now()
    where id = v_recipe_id
      and archived_at is null
      and (created_by = v_profile_id or (select private.is_current_user_admin()));

    if not found then
      raise exception 'La receta no existe o no podés editarla.' using errcode = 'P0002';
    end if;

    delete from public.recipe_items where recipe_id = v_recipe_id;
  end if;

  insert into public.recipe_items (recipe_id, food_id, grams)
  select v_recipe_id, (e->>'food_id')::uuid, (e->>'grams')::numeric
  from jsonb_array_elements(p_items) e;

  return v_recipe_id;
end;
$$;

revoke all on function public.save_recipe(uuid, text, text, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, text, text, text, numeric, numeric, jsonb) to authenticated;

-- 5) Reordenar las comidas de un dia (el array tiene que ser exactamente las comidas del registro)
create or replace function public.reorder_meals(p_meal_log_id uuid, p_meal_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.meal_logs where id = p_meal_log_id and user_id = (select auth.uid())
  ) then
    raise exception 'El registro del día no existe.' using errcode = 'P0002';
  end if;

  if (select coalesce(array_agg(id order by id), '{}') from public.meal_log_meals where meal_log_id = p_meal_log_id)
     is distinct from (select coalesce(array_agg(x order by x), '{}') from unnest(p_meal_ids) as x) then
    raise exception 'Las comidas del día cambiaron. Actualizá la página e intentá de nuevo.' using errcode = '40001';
  end if;

  update public.meal_log_meals m
  set position = o.ord
  from unnest(p_meal_ids) with ordinality as o(id, ord)
  where m.id = o.id
    and m.meal_log_id = p_meal_log_id;
end;
$$;

revoke all on function public.reorder_meals(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_meals(uuid, uuid[]) to authenticated;
