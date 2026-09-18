-- Recetas con alimentos propios: cada ingrediente guarda nombre y macros del alimento (snapshot).
-- Los alimentos privados no se leen por RLS para otros usuarios; la receta pública se arma desde
-- recipe_items sin tocar `foods`. Expand puro: el código anterior (join a foods) sigue funcionando.

-- 1) Snapshot del alimento en cada ingrediente
alter table public.recipe_items
  add column if not exists food_name text,
  add column if not exists serving_g integer,
  add column if not exists calories integer,
  add column if not exists protein_g numeric(6,1),
  add column if not exists carbs_g numeric(6,1),
  add column if not exists fat_g numeric(6,1);

update public.recipe_items ri
set food_name = f.name,
    serving_g = f.serving_g,
    calories = f.calories,
    protein_g = f.protein_g,
    carbs_g = f.carbs_g,
    fat_g = f.fat_g
from public.foods f
where f.id = ri.food_id
  and ri.food_name is null;

alter table public.recipe_items
  alter column food_name set not null,
  alter column serving_g set not null,
  alter column calories set not null,
  alter column protein_g set not null,
  alter column carbs_g set not null,
  alter column fat_g set not null;

-- 2) Si el dueño (o un admin, en el catálogo) edita el alimento, las recetas que lo usan se actualizan
--    como antes con el join. Definer: el que edita el alimento no puede escribir recetas ajenas.
create or replace function private.sync_recipe_items_food_snapshot()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  update public.recipe_items
  set food_name = new.name,
      serving_g = new.serving_g,
      calories = new.calories,
      protein_g = new.protein_g,
      carbs_g = new.carbs_g,
      fat_g = new.fat_g
  where food_id = new.id;

  return null;
end;
$function$;

revoke all on function private.sync_recipe_items_food_snapshot() from public, anon, authenticated;

drop trigger if exists foods_sync_recipe_items on public.foods;
create trigger foods_sync_recipe_items
  after update of name, serving_g, calories, protein_g, carbs_g, fat_g on public.foods
  for each row
  execute function private.sync_recipe_items_food_snapshot();

-- 3) RLS: ingredientes del catálogo o propios. El admin puede reinsertar alimentos privados ajenos
--    al editar una receta (la RPC conserva su snapshot).
drop policy if exists recipe_items_insert_owner_or_admin on public.recipe_items;
create policy recipe_items_insert_owner_or_admin on public.recipe_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and (r.created_by = (select private.current_profile_id()) or (select private.is_current_user_admin()))
    )
    and (
      (select private.is_current_user_admin())
      or exists (
        select 1 from public.foods f
        where f.id = recipe_items.food_id
          and (f.owner_user_id is null or f.owner_user_id = (select auth.uid()))
      )
    )
  );

drop policy if exists recipe_items_update_owner_or_admin on public.recipe_items;
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
    and (
      (select private.is_current_user_admin())
      or exists (
        select 1 from public.foods f
        where f.id = recipe_items.food_id
          and (f.owner_user_id is null or f.owner_user_id = (select auth.uid()))
      )
    )
  );

-- 4) save_recipe: acepta alimentos propios y guarda el snapshot. Un ingrediente que quien edita no
--    puede leer (alimento privado del creador, editado por un admin) conserva el snapshot que tenía.
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
  v_items jsonb;
begin
  if v_profile_id is null then
    raise exception 'Iniciá sesión para guardar recetas.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Agregá al menos un ingrediente.' using errcode = '22023';
  end if;

  select jsonb_agg(jsonb_build_object(
    'food_id', i.food_id,
    'grams', i.grams,
    'food_name', coalesce(f.name, prev.food_name),
    'serving_g', coalesce(f.serving_g, prev.serving_g),
    'calories', coalesce(f.calories, prev.calories),
    'protein_g', coalesce(f.protein_g, prev.protein_g),
    'carbs_g', coalesce(f.carbs_g, prev.carbs_g),
    'fat_g', coalesce(f.fat_g, prev.fat_g)
  ))
  into v_items
  from (
    select nullif(e->>'food_id', '')::uuid as food_id, coalesce((e->>'grams')::numeric, 0) as grams
    from jsonb_array_elements(p_items) e
  ) i
  left join public.foods f
    on f.id = i.food_id
   and (f.owner_user_id is null or f.owner_user_id = (select auth.uid()))
  left join lateral (
    select ri.food_name, ri.serving_g, ri.calories, ri.protein_g, ri.carbs_g, ri.fat_g
    from public.recipe_items ri
    where ri.recipe_id = v_recipe_id
      and ri.food_id = i.food_id
    limit 1
  ) prev on true;

  if exists (
    select 1
    from jsonb_array_elements(v_items) e
    where e->>'food_name' is null
      or (e->>'grams')::numeric <= 0
  ) then
    raise exception 'Los ingredientes tienen que ser alimentos del catálogo o tuyos, con gramos mayores a 0.' using errcode = '22023';
  end if;

  select sum((e->>'grams')::numeric) into v_raw_grams from jsonb_array_elements(v_items) e;

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

  insert into public.recipe_items (recipe_id, food_id, grams, food_name, serving_g, calories, protein_g, carbs_g, fat_g)
  select v_recipe_id, x.food_id, x.grams, x.food_name, x.serving_g, x.calories, x.protein_g, x.carbs_g, x.fat_g
  from jsonb_to_recordset(v_items) as x(
    food_id uuid, grams numeric, food_name text, serving_g integer, calories integer,
    protein_g numeric, carbs_g numeric, fat_g numeric
  );

  return v_recipe_id;
end;
$function$;

revoke all on function public.save_recipe(uuid, text, text, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, text, text, text, numeric, numeric, jsonb) to authenticated;
