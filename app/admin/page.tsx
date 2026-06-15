import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  LayoutGrid,
  Pencil,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";

import {
  getAdminStats,
  getManagementSummary,
  getRecentActivity,
  type RecentActivityKind,
} from "@/app/lib/admin-stats";
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
  TableBody,
  TableCell,
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

const ACTIVITY_ICONS: Record<RecentActivityKind, typeof Plus> = {
  rutina_nueva: Plus,
  ejercicio_nuevo: Dumbbell,
  rutina_actualizada: Pencil,
  usuario_nuevo: UserPlus,
  rutina_guardada: Bookmark,
};

export default async function AdminPage() {
  const [stats, latestExercises, latestRoutines, managementSummary, recentActivity] =
    await Promise.all([
      getAdminStats(),
      listAdminExercises(),
      listAdminRoutines(),
      getManagementSummary(),
      getRecentActivity(6),
    ]);

  const exercises = latestExercises.slice(0, 4);
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
            className="flex items-center gap-4 p-5 transition-colors hover:border-[#6d40ef]"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)]">
              <tile.icon className="size-6" />
            </span>
            <div>
              <p className="font-display text-[2.4rem] font-semibold tracking-[-0.06em] text-white">
                {tile.value}
              </p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{tile.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {recentActivity.length === 0 ? (
              <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
                <div className="max-w-sm">
                  <p className="font-display text-lg font-semibold text-white">
                    Todavia no hay actividad
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    La actividad reciente de la plataforma va a aparecer aca.
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Accion</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((entry, index) => {
                    const Icon = ACTIVITY_ICONS[entry.kind];

                    return (
                      <TableRow key={`${entry.kind}-${entry.at}-${index}`}>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)]">
                              <Icon className="size-4" />
                            </span>
                            <span className="font-medium">{entry.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>{entry.detail}</TableCell>
                        <TableCell>{formatActivityDate(entry.at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="flex flex-1 flex-col overflow-hidden">
            <CardHeader className="border-b border-[var(--border)]">
              <CardTitle>Acciones rapidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-0 sm:p-0">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-1 items-center gap-4 border-b border-[rgba(37,43,54,0.55)] px-5 py-5 text-base font-medium text-[var(--foreground)] transition-colors last:border-b-0 hover:bg-[var(--card-alt)] sm:px-6"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-[9px] border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)]">
                    <action.icon className="size-5" />
                  </span>
                  {action.label}
                  <ChevronRight className="ml-auto size-5 text-[#7d8697]" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="flex flex-1 flex-col overflow-hidden">
            <CardHeader className="border-b border-[var(--border)]">
              <CardTitle>Resumen de gestion</CardTitle>
            </CardHeader>
            <CardContent className="grid flex-1 gap-3 p-5 sm:p-6">
              <div className="flex flex-1 items-center justify-between text-base">
                <span className="text-[var(--foreground-muted)]">Rutinas activas</span>
                <span className="font-display text-lg font-semibold text-[var(--accent-bright)]">
                  {managementSummary.activeRoutines}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-between text-base">
                <span className="text-[var(--foreground-muted)]">
                  Ejercicios nuevos esta semana
                </span>
                <span className="font-display text-lg font-semibold text-[var(--accent-bright)]">
                  {managementSummary.newExercisesThisWeek}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-between text-base">
                <span className="text-[var(--foreground-muted)]">
                  Usuarios con rutina asignada
                </span>
                <span className="font-display text-lg font-semibold text-[var(--accent-bright)]">
                  {managementSummary.usersWithRoutinePct}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle>Ultimos ejercicios agregados</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {exercises.length === 0 ? (
              <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
                <div className="max-w-sm">
                  <p className="font-display text-lg font-semibold text-white">
                    Todavia no hay ejercicios
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
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
            className="mt-auto flex items-center justify-center gap-1.5 border-t border-[var(--border)] py-4 text-sm font-semibold text-[var(--accent-bright)] transition-colors hover:text-white"
          >
            Ver todos los ejercicios
            <ChevronRight className="size-4" />
          </Link>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle>Ultimas rutinas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
          {routines.length === 0 ? (
            <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
              <div className="max-w-sm">
                <p className="font-display text-lg font-semibold text-white">
                  Todavia no hay rutinas
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  Crea la primera desde `/admin/rutinas` para alimentar el catalogo.
                </p>
              </div>
            </div>
          ) : (
            routines.map((routine) => (
              <Link
                key={routine.id}
                href="/admin/rutinas"
                className="flex items-center gap-3.5 border-b border-[rgba(37,43,54,0.55)] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-white/[0.025] sm:px-6"
              >
                <span className="fitness-photo size-12 shrink-0 rounded-[10px] border border-white/[0.08]" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{routine.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
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
          className="mt-auto flex items-center justify-center gap-1.5 border-t border-[var(--border)] py-4 text-sm font-semibold text-[var(--accent-bright)] transition-colors hover:text-white"
        >
          Ver todas las rutinas
          <ChevronRight className="size-4" />
        </Link>
        </Card>
      </div>
    </section>
  );
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / dayMs);

  if (diffDays === 0) {
    return "Hoy";
  }

  if (diffDays === 1) {
    return "Ayer";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
