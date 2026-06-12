do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_routines_user_id_routine_template_id_key'
      and conrelid = 'public.saved_routines'::regclass
  ) then
    alter table public.saved_routines
    add constraint saved_routines_user_id_routine_template_id_key
    unique (user_id, routine_template_id);
  end if;
end
$$;
