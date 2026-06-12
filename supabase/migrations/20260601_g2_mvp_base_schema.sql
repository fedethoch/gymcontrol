create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  type_rol text not null default 'user' check (type_rol in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routine_templates(id) on delete cascade,
  day_order integer not null check (day_order > 0),
  day_name text,
  created_at timestamptz not null default now(),
  unique (routine_id, day_order)
);

create table public.routine_items (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  series integer not null check (series > 0),
  repetitions text not null,
  rir integer not null check (rir >= 0),
  rest text not null,
  row_order integer not null check (row_order > 0),
  created_at timestamptz not null default now(),
  unique (routine_day_id, row_order)
);

create table public.saved_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_template_id uuid not null references public.routine_templates(id) on delete cascade,
  custom_name text,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_created_by_idx on public.exercises (created_by);
create index routine_templates_created_by_idx on public.routine_templates (created_by);
create index routine_days_routine_id_idx on public.routine_days (routine_id);
create index routine_items_routine_day_id_idx on public.routine_items (routine_day_id);
create index routine_items_exercise_id_idx on public.routine_items (exercise_id);
create index saved_routines_user_id_idx on public.saved_routines (user_id);
create index saved_routines_routine_template_id_idx on public.saved_routines (routine_template_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

create trigger set_routine_templates_updated_at
before update on public.routine_templates
for each row execute function public.set_updated_at();

create trigger set_saved_routines_updated_at
before update on public.saved_routines
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (user_id)
select u.id
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.user_id = u.id
);
