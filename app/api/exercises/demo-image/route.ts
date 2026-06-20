import { NextResponse } from "next/server";

import { fetchExerciseDbImage, fetchExerciseDbGif } from "@/app/lib/exercise-demo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerExerciseId = url.searchParams.get("providerExerciseId")?.trim();
  const resolution = url.searchParams.get("resolution")?.trim() || "360";
  const type = url.searchParams.get("type")?.trim() || "image";

  if (!providerExerciseId) {
    return new NextResponse("Missing providerExerciseId", {
      status: 400,
      headers: noStoreHeaders(),
    });
  }

  const upstream = type === "gif"
    ? await fetchExerciseDbGif(providerExerciseId, resolution)
    : await fetchExerciseDbImage(providerExerciseId, resolution);

  if (!upstream) {
    return new NextResponse("Exercise demo provider is not configured", {
      status: 503,
      headers: noStoreHeaders(),
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Exercise demo image unavailable", {
      status: upstream.status || 502,
      headers: noStoreHeaders(),
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      ...noStoreHeaders(),
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/gif",
    },
  });
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store",
  };
}
