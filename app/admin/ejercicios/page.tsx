import { ExerciseAdminClient } from "@/app/admin/ejercicios/ExerciseAdminClient";
import { listAdminExercises } from "@/app/lib/exercises";

export default async function AdminExercisesPage() {
  const exercises = await listAdminExercises();

  return <ExerciseAdminClient initialExercises={exercises} />;
}
