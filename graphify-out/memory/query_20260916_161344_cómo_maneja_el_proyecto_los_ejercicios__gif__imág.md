---
type: "query"
date: "2026-09-16T16:13:44.110761+00:00"
question: "¿Cómo maneja el proyecto los ejercicios, GIF, imágenes y ExerciseDB?"
contributor: "graphify"
source_nodes: ["exercise-images storage bucket (G6)", "fetchExerciseDbGif()", "ExerciseDbExercise"]
---

# Q: ¿Cómo maneja el proyecto los ejercicios, GIF, imágenes y ExerciseDB?

## Answer

Expanded from original query via vocab: [exercise, exercises, exercisedb, gif, image, catalog, storage, supabase, routine]. El proyecto usa el bucket público exercise-images para PNG y GIF persistidos; exercises guarda image_url, gif_url y exercisedb_id; ExerciseDB aporta metadatos y demostraciones, y fetchExerciseDbGif resuelve el medio a través de la API interna.

## Source Nodes

- exercise-images storage bucket (G6)
- fetchExerciseDbGif()
- ExerciseDbExercise