import { NextRequest, NextResponse } from "next/server";
import { procesarMes, guardarCache } from "@/lib/ventas-sync";

/**
 * Sync protegido por secret, para disparar desde scripts o cron. El botón del
 * CRM usa /api/ventas/actualizar, que se autentica con la cookie de sesión.
 * La lógica de sincronización vive en @/lib/ventas-sync (fuente única).
 */
const SYNC_SECRET = process.env.SYNC_SECRET || "menorca-sync-2026";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.secret !== SYNC_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const mesActual = new Date().getMonth() + 1;
  const mesesASincronizar = body.meses
    ? (body.meses as number[])
    : Array.from({ length: mesActual }, (_, i) => i + 1);

  const resultados: { mes: number; status: string; ventas?: number }[] = [];

  for (const mes of mesesASincronizar) {
    try {
      const data = await procesarMes(mes);
      await guardarCache(mes, data);
      resultados.push({ mes, status: "ok", ventas: data.total });
    } catch (e) {
      resultados.push({
        mes,
        status: `error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return NextResponse.json({
    sincronizados: resultados.filter((r) => r.status === "ok").length,
    total: mesesASincronizar.length,
    detalle: resultados,
  });
}
