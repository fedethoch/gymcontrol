import Link from "next/link";
import { ClipboardList, Dumbbell, Plus } from "lucide-react";

import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
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
import { listAdminExercises } from "@/app/lib/exercises";

const adminModules = [
  {
    href: "/admin/ejercicios",
    title: "Ejercicios",
    value: "CRUD",
    description: "Catalogo tecnico para alimentar rutinas.",
  },
  {
    href: "/admin/rutinas",
    title: "Rutinas",
    value: "Builder",
    description: "Plantillas semanales con dias y filas editables.",
  },
];

export default async function AdminPage() {
  const latestExercises = (await listAdminExercises()).slice(0, 4);

  return (
    <section className="page-frame">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionEyebrow>Admin</SectionEyebrow>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
            Dashboard Admin
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/rutinas">
              <Plus className="size-4" />
              Crear rutina
            </Link>
          </Button>
          <Badge variant="accent">Gestion base</Badge>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {adminModules.map((module) => (
          <Link key={module.title} href={module.href}>
            <Card className="h-full transition-colors hover:border-[#5b2ab3]">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8697]">
                  {module.title}
                </p>
                <p className="font-display mt-2 text-3xl font-semibold text-white">
                  {module.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  {module.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
              Rutinas admin
            </p>
            <CardTitle className="mt-1">Builder semanal</CardTitle>
          </div>
          <Button asChild>
            <Link href="/admin/rutinas">
              <ClipboardList className="size-4" />
              Abrir rutinas
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm leading-6 text-[var(--foreground-muted)]">
              Crea plantillas con nombre, descripcion, multiples dias y filas de
              ejercicios. Este apartado alimenta el catalogo y el dashboard de
              usuario en los siguientes grupos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/ejercicios">
                <Dumbbell className="size-4" />
                Ver ejercicios
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/rutinas">
                <Plus className="size-4" />
                Crear rutina
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
              Ultimos ejercicios agregados
            </p>
            <CardTitle className="mt-1">Catalogo administrable</CardTitle>
          </div>
          <Button asChild>
            <Link href="/admin/ejercicios">+ Nuevo ejercicio</Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {latestExercises.length === 0 ? (
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
                  <TableHead className="pl-5 sm:pl-6">Ejercicio</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="pr-5 sm:pr-6">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestExercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="pl-5 text-white sm:pl-6">
                      <div className="flex items-center gap-3">
                        <span className="thumb-fitness size-10 rounded-xl border border-[var(--border)]" />
                        <span className="font-medium">{exercise.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{exercise.description}</TableCell>
                    <TableCell className="pr-5 sm:pr-6">
                      {exercise.createdAtLabel}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
