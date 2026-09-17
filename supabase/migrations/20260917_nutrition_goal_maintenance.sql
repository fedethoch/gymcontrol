-- Fase "contract" de 20260917_nutrition_plan_options.sql.
-- Aplicar solo cuando el código que entiende goal = 'maintenance' ya está desplegado.
-- 'recomposition' pasa a ser una variante de Mantenimiento.

update public.nutrition_profiles
   set goal = 'maintenance',
       goal_variant = coalesce(goal_variant, 'recomposition')
 where goal = 'recomposition';

alter table public.nutrition_profiles drop constraint if exists nutrition_profiles_goal_variant_check;
alter table public.nutrition_profiles drop constraint if exists nutrition_profiles_goal_check;

alter table public.nutrition_profiles add constraint nutrition_profiles_goal_check
  check (goal in ('cut', 'maintenance', 'bulk'));

alter table public.nutrition_profiles add constraint nutrition_profiles_goal_variant_check check (
  goal_variant is null
  or (goal = 'cut' and goal_variant in ('gentle', 'moderate', 'aggressive'))
  or (goal = 'maintenance' and goal_variant in ('recomposition', 'maintain'))
  or (goal = 'bulk' and goal_variant in ('lean', 'standard', 'aggressive'))
);
