-- Nutricion (contract): la porcion en gramos reemplaza a `servings` y los items de receta
-- siempre llevan snapshot. Aplicar solo con el codigo de 20260915_nutrition_meal_order_user_recipes en produccion.

-- 1) Snapshots faltantes (items insertados por codigo previo durante la ventana de deploy)
with totals as (
  select
    r.id,
    coalesce(r.serving_g, round(sum(ri.grams) / greatest(1, r.servings), 1)) as serving_g,
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

alter table public.meal_log_items drop constraint if exists meal_log_items_recipe_snapshot_check;
alter table public.meal_log_items add constraint meal_log_items_recipe_snapshot_check
  check (recipe_id is null or recipe_snapshot is not null);

-- 2) recipes.serving_g obligatorio
update public.recipes r
set serving_g = greatest(0.1, round(t.total_grams / greatest(1, r.servings), 1))
from (select recipe_id, sum(grams) as total_grams from public.recipe_items group by recipe_id) t
where t.recipe_id = r.id
  and r.serving_g is null;

alter table public.recipes alter column serving_g set not null;

-- 3) save_recipe deja de escribir `servings` y se elimina la columna
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
    insert into public.recipes (name, description, image_url, category, serving_g, total_weight_g, created_by)
    values (p_name, nullif(p_description, ''), '', p_category, p_serving_g, p_total_weight_g, v_profile_id)
    returning id into v_recipe_id;
  else
    update public.recipes
    set name = p_name,
        description = nullif(p_description, ''),
        category = p_category,
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

alter table public.recipes drop column if exists servings;
