import "server-only";

import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };

export function pushJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function pushFail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export function pushNoContent() {
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}

/**
 * Origin de la app que hizo el pedido (con él se arman los links de los avisos).
 * `null` si el pedido viene de otro sitio: mismo chequeo que /api/workouts/sync.
 */
export function resolveRequestOrigin(request: Request): string | null {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const originHeader = request.headers.get("origin");

  if (originHeader) {
    try {
      const origin = new URL(originHeader);
      return host && origin.host !== host ? null : origin.origin;
    } catch {
      return null;
    }
  }

  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  return host ? `${proto}://${host}` : url.origin;
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}
