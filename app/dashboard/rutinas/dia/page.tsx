import { redirect } from "next/navigation";

type LegacyDashboardRoutineDayPageProps = {
  searchParams: Promise<{
    savedRoutineId?: string;
    day?: string;
  }>;
};

export default async function LegacyDashboardRoutineDayPage({
  searchParams,
}: LegacyDashboardRoutineDayPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.savedRoutineId) {
    query.set("savedRoutineId", params.savedRoutineId);
  }

  if (params.day) {
    query.set("day", params.day);
  }

  const suffix = query.toString();
  redirect(suffix ? `/rutinas/dia?${suffix}` : "/rutinas/dia");
}
