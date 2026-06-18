alter table public.meal_log_meals
add column if not exists type text default 'snack';

update public.meal_log_meals
set type = case
  when lower(trim(name)) = 'desayuno' then 'desayuno'
  when lower(trim(name)) = 'almuerzo' then 'almuerzo'
  when lower(trim(name)) = 'merienda' then 'merienda'
  when lower(trim(name)) = 'cena' then 'cena'
  when lower(trim(name)) = 'snack' then 'snack'
  else coalesce(type, 'snack')
end
where type is null
  or type not in ('desayuno', 'almuerzo', 'merienda', 'cena', 'snack')
  or lower(trim(name)) in ('desayuno', 'almuerzo', 'merienda', 'cena', 'snack');

alter table public.meal_log_meals
alter column type set default 'snack';

alter table public.meal_log_meals
alter column type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meal_log_meals_type_check'
      and conrelid = 'public.meal_log_meals'::regclass
  ) then
    alter table public.meal_log_meals
    add constraint meal_log_meals_type_check
    check (type in ('desayuno', 'almuerzo', 'merienda', 'cena', 'snack'));
  end if;
end $$;
