-- Patada de glúteo en polea: segundo ejercicio de medición de Glúteos en el nivel de fuerza
-- (docs/STRENGTH_STANDARDS.md §12). Se crea solo en el catálogo, sin sumarlo a rutinas.
-- La imagen (cuadro 0) y el GIF los completa scripts/sync-exercise-gifs.mjs; hasta entonces image_url queda vacía.
insert into public.exercises (name, description, image_url, created_by, muscle_group, equipment, min_reps, max_reps, steps, tips)
select
  'Patada de gluteo en polea',
  'Extensión de cadera de pie en polea baja, con tobillera y una pierna por vez. Aísla el glúteo mayor con tensión constante y deja trabajar cada lado por separado.',
  '',
  hip_thrust.created_by,
  'Piernas',
  'Polea',
  10,
  15,
  array[
    'Colocá la tobillera en la polea baja y parate de frente a la máquina, sosteniéndote con las manos.',
    'Con la rodilla apenas flexionada, llevá la pierna hacia atrás apretando el glúteo.',
    'Pausá un segundo arriba y volvé con control, sin dejar que el peso toque la pila.'
  ],
  array[
    'El movimiento sale de la cadera: mantené la espalda neutra y no arquees la zona lumbar.',
    'No balancees el cuerpo para mover más carga.',
    'Registrá el peso de un lado: es el que se compara con el estándar.'
  ]
from public.exercises as hip_thrust
where hip_thrust.name = 'Hip thrust'
  and not exists (select 1 from public.exercises where name = 'Patada de gluteo en polea');
