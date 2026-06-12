"use client";

import { useState } from "react";

import { Badge } from "@/app/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card";
import { ExerciseDetailModal, type ExerciseDetail } from "@/app/components/shared/ExerciseDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";

type RoutineTableRow = {
  id: string;
  exercise: ExerciseDetail;
  series: string;
  reps: string;
  rir: string;
  rest: string;
};

type RoutineTablePreviewProps = {
  title: string;
  rows: RoutineTableRow[];
  description?: string;
};

export function RoutineTablePreview({
  title,
  rows,
  description,
}: RoutineTablePreviewProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[var(--border)]">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 sm:pl-6">Ejercicio</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>RIR</TableHead>
                <TableHead className="pr-5 sm:pr-6">Descanso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-5 text-white sm:pl-6">
                    <button
                      type="button"
                      className="flex min-h-6 w-full items-center justify-between gap-3 rounded-md text-left transition-colors hover:text-[var(--accent-bright)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-bright)]"
                      onClick={() => setSelectedExercise(row.exercise)}
                    >
                      <span className="font-medium">{row.exercise.name}</span>
                      <Badge variant="accent">Detalle</Badge>
                    </button>
                  </TableCell>
                  <TableCell>{row.series}</TableCell>
                  <TableCell>{row.reps}</TableCell>
                  <TableCell>{row.rir}</TableCell>
                  <TableCell className="pr-5 sm:pr-6">{row.rest}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={selectedExercise !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
      />
    </>
  );
}
