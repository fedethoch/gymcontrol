-- Versión remota 20260614042127. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.
-- Allow foods to be quantified in both grams and units/portions.
alter table public.foods
  add column grams_per_unit numeric check (grams_per_unit is null or grams_per_unit > 0);

-- meal_log_items: record the input mode (g/unit) and quantity entered by the user,
-- alongside the authoritative grams value.
alter table public.meal_log_items
  add column measure text not null default 'g' check (measure in ('g', 'unit')),
  add column quantity numeric not null default 0 check (quantity > 0);

-- Backfill existing rows: quantity entered = grams, measure = grams.
update public.meal_log_items set quantity = grams, measure = 'g';
