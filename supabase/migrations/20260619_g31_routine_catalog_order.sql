with routine_order(name, position) as (
  values
    ('Push Pull Legs 6 dias', 1),
    ('Push Pull Legs 5 dias', 2),
    ('Push Pull Legs x Arnold Split 6 dias', 3),
    ('Push Pull Legs x Arnold Split 5 dias', 4),
    ('Upper Lower 4 dias', 5),
    ('Fullbody 3 dias', 6),
    ('Fullbody mantenimiento 3 dias', 7),
    ('Prio Legs(woman) 5 dias', 8)
)
update public.routine_templates routines
set
  created_at = now() - ((routine_order.position - 1) * interval '1 second'),
  updated_at = now()
from routine_order
where routines.name = routine_order.name;
