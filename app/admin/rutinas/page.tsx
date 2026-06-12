import { RoutineAdminClient } from "@/app/admin/rutinas/RoutineAdminClient";
import { listExerciseCatalogItems } from "@/app/lib/exercises";
import { listAdminRoutines } from "@/app/lib/routines";

export default async function AdminRoutinesPage() {
  const [routines, exercises] = await Promise.all([
    listAdminRoutines(),
    listExerciseCatalogItems(),
  ]);

  return (
    <RoutineAdminClient
      initialExercises={exercises}
      initialRoutines={routines}
    />
  );
}
