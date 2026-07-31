import type { ResumenCanal, VentaAtribuida } from "@/types";

/**
 * Sperant no siempre registra el nivel de anuncio (utm_content llega vacío en
 * buena parte de las ventas), así que esas se juntan bajo una etiqueta
 * explícita en vez de descartarlas: los subtotales siguen sumando el total del
 * canal y queda visible cuánto no está trackeado.
 */
export const SIN_ANUNCIO = "Anuncio no identificado";

/**
 * Agrupa ventas en Canal > Campaña > Anuncio con conteo y monto.
 * Compartido entre el sync (servidor) y el filtro por proyecto (cliente) para
 * que ambos produzcan exactamente la misma estructura.
 */
export function agruparPorCanal(ventas: VentaAtribuida[]): ResumenCanal[] {
  const porCanal = new Map<string, VentaAtribuida[]>();
  for (const v of ventas) {
    const arr = porCanal.get(v.canal) ?? [];
    arr.push(v);
    porCanal.set(v.canal, arr);
  }

  return [...porCanal.entries()]
    .map(([canal, items]) => {
      const porCampana = new Map<string, VentaAtribuida[]>();
      for (const v of items) {
        const key = v.utm_campaign || v.medio;
        const arr = porCampana.get(key) ?? [];
        arr.push(v);
        porCampana.set(key, arr);
      }

      const campanas = [...porCampana.entries()]
        .map(([nombre, ventasCamp]) => {
          const porAnuncio = new Map<string, VentaAtribuida[]>();
          for (const v of ventasCamp) {
            const key = v.utm_content || SIN_ANUNCIO;
            const arr = porAnuncio.get(key) ?? [];
            arr.push(v);
            porAnuncio.set(key, arr);
          }

          const anuncios = [...porAnuncio.entries()]
            .map(([nombreAd, vs]) => ({
              nombre: nombreAd,
              total: vs.length,
              monto: vs.reduce((s, v) => s + v.precio_lista, 0),
              // Todas las ventas del grupo comparten nombre de anuncio, así
              // que basta el ad_id de la primera que lo haya resuelto.
              ad_id: vs.find((v) => v.ad_id)?.ad_id ?? null,
            }))
            .sort((a, b) => b.total - a.total);

          return {
            nombre,
            total: ventasCamp.length,
            monto: ventasCamp.reduce((s, v) => s + v.precio_lista, 0),
            anuncios,
          };
        })
        .sort((a, b) => b.total - a.total);

      return {
        canal,
        total: items.length,
        monto: items.reduce((s, v) => s + v.precio_lista, 0),
        campanas,
      };
    })
    .sort((a, b) => b.total - a.total);
}
