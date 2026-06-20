import { NextResponse } from "next/server";

import { getExerciseDemo } from "@/app/lib/exercise-demo";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const demo = await getExerciseDemo(id);

    if (!demo) {
      return NextResponse.json(
        {
          available: false,
          reason: "not-found",
          message: "El ejercicio ya no existe.",
        },
        {
          status: 404,
          headers: noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(demo, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json(
      {
        available: false,
        reason: "provider-error",
        message: "No se pudo cargar la demostracion en este momento.",
      },
      {
        status: 502,
        headers: noStoreHeaders(),
      },
    );
  }
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store",
  };
}
