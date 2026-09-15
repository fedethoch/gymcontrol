-- Versión remota 20260614042136. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.
-- Remove obsolete "N-meals diet template" concept, superseded by daily meal logging (registro diario).
drop table if exists public.saved_diets;
drop table if exists public.diet_template_meals;
drop table if exists public.diet_templates;
