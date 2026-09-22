-- Avisos push, fase "contract" (docs/DATABASE.md "Avisos push").
-- Sin "Probar notificación" (pedido del usuario, 2026-09-22): last_test_at era el tope de 1 prueba cada 10 s
-- de /api/push/test y ya nada la lee.
-- Se aplica DESPUÉS del deploy que saca esa ruta: el código anterior la escribe.

alter table public.push_subscriptions drop column last_test_at;
