alter table public.saved_routines
add column if not exists is_active boolean not null default false;

with first_saved_routines as (
  select distinct on (user_id) id
  from public.saved_routines
  order by user_id, saved_at asc
)
update public.saved_routines
set is_active = true
where id in (select id from first_saved_routines)
  and not exists (
    select 1
    from public.saved_routines active_saved_routines
    where active_saved_routines.user_id = saved_routines.user_id
      and active_saved_routines.is_active = true
  );

create unique index if not exists saved_routines_one_active_per_user_idx
on public.saved_routines (user_id)
where is_active;
