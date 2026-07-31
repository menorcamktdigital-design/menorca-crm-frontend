import { NextRequest, NextResponse } from "next/server";
import { syncMesBackground, mesesSincronizando, erroresSync } from "@/lib/ventas-sync";

export async function POST(req: NextRequest) {
  if (!req.cookies.get("menorca_session")?.value) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const mesActual = new Date().getMonth() + 1;
  const meses = Array.from({ length: mesActual }, (_, i) => i + 1);

  meses.forEach(syncMesBackground);

  return NextResponse.json({ disparados: meses }, { status: 202 });
}

export async function GET(req: NextRequest) {
  if (!req.cookies.get("menorca_session")?.value) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    sincronizando: mesesSincronizando(),
    errores: erroresSync(),
  });
}
