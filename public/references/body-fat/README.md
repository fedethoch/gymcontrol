# Body fat reference images

Place the 10 reference PNG files here before deploying:

```
male/
  12.png   (10-14% — athletic definition)
  17.png   (15-19% — lean)
  22.png   (20-24% — moderate)
  27.png   (25-29% — above average)
  33.png   (30%+ — high)

female/
  12.png
  17.png
  22.png
  27.png
  33.png
```

## Style guidelines

- Generic 3D/illustrated silhouette — no real person, no face
- Neutral background (white or very light grey)
- Same framing and proportions across all 10 images
- Consistent width × height (e.g. 280 × 320 px)
- Format: PNG with transparency or solid bg
- Male set: male body proportions; Female set: female body proportions

These are served from `public/` and pre-cached by the PWA service worker.
