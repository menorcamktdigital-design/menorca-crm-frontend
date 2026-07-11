import { NextResponse, type NextRequest } from "next/server";

// Protección de rutas en el servidor. Complementa el guard client-side
// del layout (app): sin la cookie de sesión no se sirve ninguna página.
const SESSION_COOKIE = "menorca_session";

export default function proxy(req: NextRequest) {
  const haySesion = !!req.cookies.get(SESSION_COOKIE)?.value;
  const esLogin = req.nextUrl.pathname === "/login";

  if (!haySesion && !esLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (haySesion && esLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Todo excepto assets estáticos y el proxy /api (rewrites a n8n)
  matcher: ["/((?!_next|api|favicon\\.ico).*)"],
};
