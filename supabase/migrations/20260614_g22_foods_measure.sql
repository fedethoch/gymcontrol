alter table public.foods add column measure text not null default 'g' check (measure in ('g','unit'));
