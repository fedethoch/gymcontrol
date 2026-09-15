-- Versión remota 20260615234149. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.
-- 1. Drop old macro-based CHECK constraint
ALTER TABLE public.recipes DROP CONSTRAINT recipes_category_check;

-- 2. Migrate existing rows to 'comida' (safe default)
UPDATE public.recipes SET category = 'comida';

-- 3. Change column default to new meal-type values
ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_category_check
  CHECK (category = ANY (ARRAY['desayuno'::text, 'comida'::text, 'snack'::text]));
