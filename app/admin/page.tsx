import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  LayoutGrid,
  Plus,
  Users,
} from "lucide-react";

import {
  getAdminStats,
  getManagementSummary,
  getRecentActivity,
} from "@/app/lib/admin-stats";
import { RecentActivityTable } from "@/app/admin/RecentActivityTable";
import { RecentExercisesTable } from "@/app/admin/RecentExercisesTable";
import { listAdminExercises } from "@/app/lib/exercises";
import { listAdminRoutines } from "@/app/lib/routines";
import { ROUTINE_DIFFICULTY_LABELS, type RoutineDifficulty } from "@/app/lib/routine-metadata";
import { Badge } from "@/app/components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card";
import { SectionEyebrow } from "@/app/components/ui/SectionEyebrow";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";
const DIFFICULTY_BADGE_VARIANT: Record<RoutineDifficulty, "accent" | "neutral" | "success"> = {
  intermedio: "accent",
  avanzado: "neutral",
  principiante: "success",
};

const quickActions = [
  { href: "/admin/ejercicios", icon: Plus, label: "Crear ejercicio" },
  { href: "/admin/rutinas", icon: Plus, label: "Crear rutina" },
  { href: "/catalogo", icon: LayoutGrid, label: "Ver catalogo admin" },
];

export default async function AdminPage() {
  const [stats, latestExercises, latestRoutines, managementSummary, recentActivity] =
    await Promise.all([
      getAdminStats(),
      listAdminExercises(),
      listAdminRoutines(),
      getManagementSummary(),
      getRecentActivity(8),
    ]);

  const exercises = latestExercises.slice(0, 3);
  const routines = latestRoutines.slice(0, 3);

  const statTiles = [
    { icon: Dumbbell, value: stats.exercises, label: "Ejercicios" },
    { icon: ClipboardList, value: stats.routines, label: "Rutinas" },
    { icon: Users, value: stats.users, label: "Usuarios" },
    { icon: Bookmark, value: stats.savedRoutines, label: "Rutinas guardadas" },
  ];

  return (
    <section className="page-frame">
      <header>
        <SectionEyebrow>Dashboard Admin</SectionEyebrow>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
          Dashboard Admin
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
          Supervisa el estado general de la plataforma y gestiona el contenido.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statTiles.map((tile) => (
          <Card
            key={tile.label}
            className="flex flex-col gap-2 p-3 transition-colors hover:border-[#6d40ef] sm:p-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)] sm:size-11">
                <tile.icon className="size-4 sm:size-5" />
              </span>
              <p className="font-display text-2xl font-semibold tracking-[-0.06em] text-white sm:text-3xl">
                {tile.value}
              </p>
            </div>
            <p className="truncate text-xs text-[var(--foreground-muted)] sm:text-sm">{tile.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[var(--border)] py-3">
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {recentActivity.length === 0 ? (
            <div className="grid min-h-32 place-items-center px-6 py-6 text-center">
              <div className="max-w-sm">
                <p className="font-display text-base font-semibold text-white">
                  Todavia no hay actividad
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                  La actividad reciente de la plataforma va a aparecer aca.
                </p>
              </div>
            </div>
          ) : (
            <RecentActivityTable activities={recentActivity} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] py-3">
            <CardTitle>Acciones rapidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0 sm:p-0">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-1 items-center gap-3 border-b border-[rgba(37,43,54,0.55)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-colors last:border-b-0 hover:bg-[var(--card-alt)] sm:px-5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)]">
                  <action.icon className="size-4" />
                </span>
                {action.label}
                <ChevronRight className="ml-auto size-4 text-[#7d8697]" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] py-3">
            <CardTitle>Resumen de gestion</CardTitle>
          </CardHeader>
          <CardContent className="grid flex-1 gap-2.5 p-4 sm:p-5">
            <div className="flex flex-1 items-center justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">Rutinas activas</span>
              <span className="font-display text-base font-semibold text-[var(--accent-bright)]">
                {managementSummary.activeRoutines}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">
                Ejercicios nuevos esta semana
              </span>
              <span className="font-display text-base font-semibold text-[var(--accent-bright)]">
                {managementSummary.newExercisesThisWeek}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">
                Usuarios con rutina asignada
              </span>
              <span className="font-display text-base font-semibold text-[var(--accent-bright)]">
                {managementSummary.usersWithRoutinePct}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] py-3">
            <CardTitle>Ultimos ejercicios agregados</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {exercises.length === 0 ? (
              <div className="grid min-h-32 place-items-center px-6 py-6 text-center">
                <div className="max-w-sm">
                  <p className="font-display text-base font-semibold text-white">
                    Todavia no hay ejercicios
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                    Crea el primero desde `/admin/ejercicios` para poblar el catalogo base.
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Ejercicio</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <RecentExercisesTable exercises={exercises} />
              </Table>
            )}
          </CardContent>
          <Link
            href="/admin/ejercicios"
            className="mt-auto flex items-center justify-center gap-1.5 border-t border-[var(--border)] py-3 text-sm font-semibold text-[var(--accent-bright)] transition-colors hover:text-white"
          >
            Ver todos
            <ChevronRight className="size-4" />
          </Link>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] py-3">
            <CardTitle>Ultimas rutinas agregadas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
          {routines.length === 0 ? (
            <div className="grid min-h-32 place-items-center px-6 py-6 text-center">
              <div className="max-w-sm">
                <p className="font-display text-base font-semibold text-white">
                  Todavia no hay rutinas
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                  Crea la primera desde `/admin/rutinas` para alimentar el catalogo.
                </p>
              </div>
            </div>
          ) : (
            routines.map((routine) => (
              <Link
                key={routine.id}
                href="/admin/rutinas"
                className="flex items-center gap-3 border-b border-[rgba(37,43,54,0.55)] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-white/[0.025] sm:px-5"
              >
                <span className="fitness-photo size-10 shrink-0 rounded-[10px] border border-white/[0.08]" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{routine.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {routine.dayCount} dias
                    </span>
                    <Badge variant={DIFFICULTY_BADGE_VARIANT[routine.difficulty]}>
                      {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[#7d8697]" />
              </Link>
            ))
          )}
        </CardContent>
        <Link
          href="/admin/rutinas"
          className="mt-auto flex items-center justify-center gap-1.5 border-t border-[var(--border)] py-3 text-sm font-semibold text-[var(--accent-bright)] transition-colors hover:text-white"
        >
          Ver todas
          <ChevronRight className="size-4" />
        </Link>
        </Card>
      </div>
    </section>
  );
}
