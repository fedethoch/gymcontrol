-- Días de entreno de cada rutina guardada (DESIGN.md §10.2 y §12.2, app/lib/training-schedule.ts).
-- Fase "expand": solo agrega una columna nullable. El código desplegado antes de este cambio la ignora.
-- ISO: 1 = lunes … 7 = domingo, ordenados y sin repetir. El día k de la rutina va el k-ésimo día elegido.
-- null = todavía sin elegir (rutinas activadas antes de esta función, o plantillas de más de 7 días).

alter table public.saved_routines
  add column if not exists training_weekdays smallint[];

create or replace function public.is_valid_training_weekdays(days smallint[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select days is null or (
    cardinality(days) between 1 and 7
    and days = array(select distinct day from unnest(days) as day where day between 1 and 7 order by day)
  );
$$;

comment on function public.is_valid_training_weekdays(smallint[]) is
  'Días de semana ISO (1 a 7) ordenados y sin repetir; null = sin elegir. Check de saved_routines.training_weekdays.';

alter table public.saved_routines drop constraint if exists saved_routines_training_weekdays_check;
alter table public.saved_routines add constraint saved_routines_training_weekdays_check
  check (public.is_valid_training_weekdays(training_weekdays));

comment on column public.saved_routines.training_weekdays is
  'Días de entreno elegidos (ISO: 1 = lunes … 7 = domingo). El día k de la rutina va el k-ésimo. null = sin elegir.';
