alter table public.routine_templates
add column difficulty text not null default 'intermedio',
add column objective text not null default 'mantenimiento';

alter table public.routine_templates
add constraint routine_templates_difficulty_check
check (difficulty in ('principiante', 'intermedio', 'avanzado')),
add constraint routine_templates_objective_check
check (objective in ('hipertrofia', 'fuerza', 'mantenimiento'));
