import { NextRequest, NextResponse } from "next/server";
import { inicializarSync, leerCacheMes, syncMesBackground } from "@/lib/ventas-sync";

export async function GET(req: NextRequest) {
  if (!req.cookies.get("menorca_session")?.value) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const mes = req.nextUrl.searchParams.get("mes");
  if (!mes) {
    return NextResponse.json({ error: "Falta parámetro mes" }, { status: 400 });
  }

  const mesNum = Number(mes);

  // Inicializa sync de meses faltantes en background (solo la primera vez)
  inicializarSync();

  try {
    const data = await leerCacheMes(mesNum);

    if (!data) {
      // No hay data aún, disparar sync en background y avisar al front
      syncMesBackground(mesNum);
      return NextResponse.json({
        mes: mesNum,
        total: 0,
        por_canal: [],
        ventas: [],
        _sincronizando: true,
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
