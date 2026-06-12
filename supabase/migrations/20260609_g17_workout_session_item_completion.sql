alter table public.workout_session_items
add column if not exists is_completed boolean not null default false;
