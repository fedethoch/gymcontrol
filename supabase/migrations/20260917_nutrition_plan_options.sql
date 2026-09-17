-- Variantes de objetivo, tipos de dieta, avanzado y snapshot diario del objetivo.
-- Fase "expand": solo agrega. El código desplegado antes de este cambio sigue funcionando
-- (sigue guardando goal = 'recomposition'). La conversión a 'maintenance' y el check final
-- van en 20260917_nutrition_goal_maintenance.sql, después del deploy.

-- 1. nutrition_profiles: goal acepta 'maintenance' (y todavía 'recomposition').
alter table public.nutrition_profiles drop constraint if exists nutrition_profiles_goal_check;
alter table public.nutrition_profiles add constraint nutrition_profiles_goal_check
  check (goal in ('cut', 'maintenance', 'recomposition', 'bulk'));

alter table public.nutrition_profiles
  add column if not exists goal_variant text,
  add column if not exists kcal_adjustment numeric(4, 3),
  add column if not exists macro_preset text not null default 'balanced',
  add column if not exists custom_protein_g_per_kg numeric(4, 2),
  add column if not exists custom_fat_pct numeric(4, 1),
  add column if not exists maintenance_override_kcal integer,
  add column if not exists target_weight_kg numeric(5, 1);

alter table public.nutrition_profiles
  drop constraint if exists nutrition_profiles_goal_variant_check,
  drop constraint if exists nutrition_profiles_kcal_adjustment_check,
  drop constraint if exists nutrition_profiles_macro_preset_check,
  drop constraint if exists nutrition_profiles_custom_protein_check,
  drop constraint if exists nutrition_profiles_custom_fat_check,
  drop constraint if exists nutrition_profiles_maintenance_override_check,
  drop constraint if exists nutrition_profiles_target_weight_check;

alter table public.nutrition_profiles
  -- null = la variante recomendada del objetivo.
  add constraint nutrition_profiles_goal_variant_check check (
    goal_variant is null
    or (goal = 'cut' and goal_variant in ('gentle', 'moderate', 'aggressive'))
    or (goal in ('maintenance', 'recomposition') and goal_variant in ('recomposition', 'maintain'))
    or (goal = 'bulk' and goal_variant in ('lean', 'standard', 'aggressive'))
  ),
  -- null = el ajuste de la variante.
  add constraint nutrition_profiles_kcal_adjustment_check
    check (kcal_adjustment is null or kcal_adjustment between -0.30 and 0.25),
  add constraint nutrition_profiles_macro_preset_check
    check (macro_preset in ('balanced', 'high_protein', 'high_carb', 'high_fat', 'keto', 'custom')),
  add constraint nutrition_profiles_custom_protein_check
    check (custom_protein_g_per_kg is null or custom_protein_g_per_kg between 1 and 4),
  add constraint nutrition_profiles_custom_fat_check
    check (custom_fat_pct is null or custom_fat_pct between 10 and 90),
  add constraint nutrition_profiles_maintenance_override_check
    check (maintenance_override_kcal is null or maintenance_override_kcal between 1000 and 6000),
  add constraint nutrition_profiles_target_weight_check
    check (target_weight_kg is null or (target_weight_kg > 0 and target_weight_kg < 500));

-- 2. meal_logs: objetivo del día congelado. Cambiar el plan no reescribe días pasados.
alter table public.meal_logs
  add column if not exists target_kcal integer,
  add column if not exists target_protein_g integer,
  add column if not exists target_carbs_g integer,
  add column if not exists target_fat_g integer;

alter table public.meal_logs drop constraint if exists meal_logs_targets_check;
alter table public.meal_logs add constraint meal_logs_targets_check check (
  coalesce(target_kcal, 0) >= 0
  and coalesce(target_protein_g, 0) >= 0
  and coalesce(target_carbs_g, 0) >= 0
  and coalesce(target_fat_g, 0) >= 0
);

-- Al crear el registro de un día, copia el objetivo vigente del perfil.
create or replace function public.meal_logs_snapshot_target()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.target_kcal is null then
    select np.target_kcal, np.protein_g, np.carbs_g, np.fat_g
      into new.target_kcal, new.target_protein_g, new.target_carbs_g, new.target_fat_g
      from public.nutrition_profiles np
     where np.user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists snapshot_meal_logs_target on public.meal_logs;
create trigger snapshot_meal_logs_target
  before insert on public.meal_logs
  for each row execute function public.meal_logs_snapshot_target();

-- Al cambiar el plan, actualiza solo el registro de hoy (hora argentina).
create or replace function public.nutrition_profiles_sync_today_target()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.meal_logs ml
     set target_kcal = new.target_kcal,
         target_protein_g = new.protein_g,
         target_carbs_g = new.carbs_g,
         target_fat_g = new.fat_g
   where ml.user_id = new.user_id
     and ml.log_date = (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  return null;
end;
$$;

drop trigger if exists sync_nutrition_profiles_today_target on public.nutrition_profiles;
create trigger sync_nutrition_profiles_today_target
  after insert or update of target_kcal, protein_g, carbs_g, fat_g on public.nutrition_profiles
  for each row execute function public.nutrition_profiles_sync_today_target();

-- Días ya registrados: se congelan con el objetivo actual (es lo que mostraban hasta hoy).
update public.meal_logs ml
   set target_kcal = np.target_kcal,
       target_protein_g = np.protein_g,
       target_carbs_g = np.carbs_g,
       target_fat_g = np.fat_g
  from public.nutrition_profiles np
 where np.user_id = ml.user_id
   and ml.target_kcal is null;
