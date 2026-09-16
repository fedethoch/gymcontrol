# Body fat reference images

Rendered 3D figures (MakeHuman via Blender MPFB; generated models are CC0) used by
`app/components/shared/BodyFatFigure.tsx`.

```
male/    12.png 17.png 22.png 27.png 33.png
female/  17.png 22.png 27.png 32.png 38.png
```

Values match `BODY_FAT_REFERENCES` in `app/lib/nutrition-types.ts` (ranges differ by sex; same five body shapes).
560 × 640 PNG, transparent background, head-to-knees framing.

## Regenerate

Requires Blender 4.5 LTS with the MPFB extension (`blender --online-mode -c extension install mpfb --enable`).

```
blender -b --python scripts/body-fat/render_body_fat.py -- public/references/body-fat
```

Body shape per level is set in `SHAPES` (MakeHuman weight/muscle macros) inside the script.
