-- Suplementos: el upsert de un común (on conflict (user_id, preset_key)) no puede usar un índice único
-- parcial (PostgREST no manda el WHERE). Un unique común alcanza: los NULL de los propios son distintos entre sí.

drop index if exists public.user_supplements_user_preset_key;

alter table public.user_supplements
  add constraint user_supplements_user_preset_key unique (user_id, preset_key);
