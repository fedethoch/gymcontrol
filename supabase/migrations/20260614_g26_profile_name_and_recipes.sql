-- Versión remota 20260614161333. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.

-- display name for profile personalization
alter table public.profiles add column display_name text;

-- recipes catalog
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  category text not null check (category in ('protein','carb','fat','vegetable','mixed')),
  servings integer not null default 1 check (servings > 0),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  grams numeric(7,1) not null check (grams > 0)
);

create index recipes_category_idx on public.recipes(category);
create index recipe_items_recipe_id_idx on public.recipe_items(recipe_id);
create index recipe_items_food_id_idx on public.recipe_items(food_id);

alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;

create policy "recipes_select_public" on public.recipes for select using (true);
create policy "recipes_admin_write" on public.recipes for all using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.type_rol = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.type_rol = 'admin')
);

create policy "recipe_items_select_public" on public.recipe_items for select using (true);
create policy "recipe_items_admin_write" on public.recipe_items for all using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.type_rol = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.type_rol = 'admin')
);
