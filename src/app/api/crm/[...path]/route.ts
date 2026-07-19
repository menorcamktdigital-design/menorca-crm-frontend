import { NextRequest, NextResponse } from "next/server";

// Proxy server-side hacia la API del CRM en n8n.
// El token vive solo en el servidor (.env.local) y nunca llega al navegador.
// Exige la cookie de sesión: sin login no hay datos.
const BASE = process.env.CRM_API_URL ?? "";
const TOKEN = process.env.CRM_API_TOKEN ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!req.cookies.get("menorca_session")?.value) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { path } = await params;
  const url = `${BASE}/${path.join("/")}${req.nextUrl.search}`;

  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  // Para imágenes pasamos el stream binario directamente
  if (contentType.startsWith("image/")) {
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600",
      },
    });
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}
