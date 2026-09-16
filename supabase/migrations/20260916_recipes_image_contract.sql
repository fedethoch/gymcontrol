-- Recetas (contract): las recetas no tienen imagen (DESIGN.md §18, RE-D2).
-- Aplicar solo con el codigo sin `image_url` ya en produccion. Sin backup, por decision del usuario
-- (17 de las 25 imagenes no mostraban el plato). Los 25 objetos y el bucket `recipe-images` se borran
-- por la Storage API: `storage.protect_delete` bloquea el delete por SQL.

-- `save_recipe` insertaba `image_url = ''`: se reemplaza igual, sin esa columna (mismos permisos).
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
set search_path to ''
as $function$
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
    insert into public.recipes (name, description, category, serving_g, total_weight_g, created_by)
    values (p_name, nullif(p_description, ''), p_category, p_serving_g, p_total_weight_g, v_profile_id)
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
$function$;

alter table public.recipes drop column image_url;

drop policy if exists "recipe_images_select_public" on storage.objects;
drop policy if exists "recipe_images_insert_admin_only" on storage.objects;
drop policy if exists "recipe_images_update_admin_only" on storage.objects;
drop policy if exists "recipe_images_delete_admin_only" on storage.objects;
