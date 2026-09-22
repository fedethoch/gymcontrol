-- Avisos push (DESIGN.md §6.4, docs/DATABASE.md "Avisos push").
-- Por defecto, cada recordatorio de comida sale a la hora de esa comida (pedido del usuario, 2026-09-22):
-- desayuno 08:00, almuerzo 12:30, merienda 17:30 y cena 21:00 (antes 10:00, 14:30, 18:30 y 22:30).
-- Siguen siendo editables en S7. Mismos valores que DEFAULT_NOTIFICATION_PREFERENCES (app/lib/notifications.ts).
-- Se puede aplicar antes del deploy: el código solo lee y escribe las horas de cada fila.

alter table public.notification_preferences
  alter column meal_desayuno_time set default '08:00',
  alter column meal_almuerzo_time set default '12:30',
  alter column meal_merienda_time set default '17:30',
  alter column meal_cena_time set default '21:00';

-- Las filas que conservan un default viejo pasan al nuevo; una hora distinta queda como está.
update public.notification_preferences set meal_desayuno_time = '08:00' where meal_desayuno_time = '10:00';
update public.notification_preferences set meal_almuerzo_time = '12:30' where meal_almuerzo_time = '14:30';
update public.notification_preferences set meal_merienda_time = '17:30' where meal_merienda_time = '18:30';
update public.notification_preferences set meal_cena_time = '21:00' where meal_cena_time = '22:30';
