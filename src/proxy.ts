import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protege /admin con HTTP Basic Auth cuando están definidas STAFF_USER y STAFF_PASSWORD.
 * Sin esas variables la demo queda abierta (comportamiento por defecto en local).
 * TODO(auth): reemplazar por sesión real cuando exista backend.
 */
export function proxy(request: NextRequest) {
  const user = process.env.STAFF_USER;
  const pass = process.env.STAFF_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (u === user && rest.join(":") === pass) return NextResponse.next();
    } catch {
      // Header mal formado: cae al 401.
    }
  }

  return new NextResponse("Acceso restringido al staff.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Staff Nodo", charset="UTF-8"' },
  });
}

export const config = { matcher: "/admin/:path*" };
